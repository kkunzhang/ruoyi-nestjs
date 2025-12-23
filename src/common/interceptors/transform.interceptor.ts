import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

/**
 * 全局响应拦截器
 * 统一处理响应格式
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 记录请求日志
        this.logger.log(
          `[${request.method}] ${request.url} - ${duration}ms`,
        );

        // 如果返回的数据已经是标准格式（有 code 和 msg 字段），直接返回
        if (data && typeof data === 'object' && 'code' in data && 'msg' in data) {
          return data;
        }

        // 否则包装成标准格式
        return {
          code: 200,
          msg: '操作成功',
          data: data || null,
        };
      }),
    );
  }
}
