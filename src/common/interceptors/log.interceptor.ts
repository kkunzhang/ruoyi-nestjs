import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LOG_METADATA_KEY, LogMetadata } from '../decorators/log.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';
import { OperLogRepository } from '../../mapper/oper-log.repository';

/**
 * 操作日志拦截器
 * 对应 Java 的 LogAspect
 */
@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogInterceptor.name);

  constructor(
    private reflector: Reflector,
    @Inject(OperLogRepository) private operLogRepository: OperLogRepository,
  ) {}

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

        // 保存日志到数据库（异步，不阻塞响应）
        this.saveOperLog({
          ...logInfo,
          status: 0, // 成功
          costTime: duration,
          jsonResult: logMetadata.isSaveResponseData ? JSON.stringify(data) : undefined,
        }).catch((err) => {
          this.logger.error(`保存操作日志失败: ${err.message}`);
        });
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 记录失败日志
        this.logger.error(
          `[操作日志] ${logInfo.title} - ${logInfo.operName} - ${logInfo.method} ${logInfo.url} - ${duration}ms - 失败: ${error.message}`,
        );

        // 保存日志到数据库（异步，不阻塞响应）
        this.saveOperLog({
          ...logInfo,
          status: 1, // 失败
          costTime: duration,
          errorMsg: error.message,
        }).catch((err) => {
          this.logger.error(`保存操作日志失败: ${err.message}`);
        });

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

  /**
   * 保存操作日志到数据库
   */
  private async saveOperLog(logData: any): Promise<void> {
    try {
      await this.operLogRepository.insertOperLog({
        title: logData.title,
        businessType: logData.businessType,
        method: `${logData.method} ${logData.url}`,
        requestMethod: logData.method,
        operatorType: 1, // 后台用户
        operName: logData.operName,
        operUrl: logData.url,
        operIp: logData.ip,
        operLocation: '', // TODO: IP归属地查询
        operParam: logData.requestParams ? JSON.stringify(logData.requestParams) : undefined,
        jsonResult: logData.jsonResult,
        status: logData.status,
        errorMsg: logData.errorMsg,
        costTime: logData.costTime,
        operTime: logData.operTime,
      });
    } catch (error) {
      this.logger.error(`保存操作日志异常: ${error.message}`, error.stack);
    }
  }
}

