import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LOG_METADATA_KEY, LogMetadata } from '../decorators/log.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';

/**
 * 操作日志拦截器
 * 对应 Java 的 LogAspect
 */
@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取日志元数据
    const logMetadata = this.reflector.getAllAndOverride<LogMetadata>(
      LOG_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置日志记录，直接返回
    if (!logMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    const startTime = Date.now();

    // 构建日志信息
    const logInfo = {
      title: logMetadata.title,
      businessType: logMetadata.businessType,
      method: request.method,
      url: request.url,
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      operName: user?.userName || '匿名',
      operTime: new Date(),
      requestParams: logMetadata.isSaveRequestData !== false ? {
        query: request.query,
        body: this.filterSensitiveData(request.body),
      } : undefined,
    };

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 记录成功日志
        this.logger.log(
          `[操作日志] ${logInfo.title} - ${logInfo.operName} - ${logInfo.method} ${logInfo.url} - ${duration}ms - 成功`,
        );

        // TODO: 将日志保存到数据库
        // await this.saveOperLog({
        //   ...logInfo,
        //   status: 0, // 成功
        //   duration,
        //   responseData: logMetadata.isSaveResponseData ? data : undefined,
        // });
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 记录失败日志
        this.logger.error(
          `[操作日志] ${logInfo.title} - ${logInfo.operName} - ${logInfo.method} ${logInfo.url} - ${duration}ms - 失败: ${error.message}`,
        );

        // TODO: 将日志保存到数据库
        // await this.saveOperLog({
        //   ...logInfo,
        //   status: 1, // 失败
        //   duration,
        //   errorMsg: error.message,
        // });

        return throwError(() => error);
      }),
    );
  }

  /**
   * 过滤敏感数据
   */
  private filterSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'confirmPassword'];
    const filtered = { ...data };

    for (const field of sensitiveFields) {
      if (field in filtered) {
        filtered[field] = '******';
      }
    }

    return filtered;
  }
}

