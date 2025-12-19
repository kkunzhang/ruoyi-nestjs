import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AjaxResult } from '../response/ajax-result';

/**
 * 响应转换拦截器
 * 统一包装响应格式
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, AjaxResult<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<AjaxResult<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是 AjaxResult 格式，直接返回
        if (data instanceof AjaxResult) {
          return data;
        }
        // 否则包装成 AjaxResult
        return AjaxResult.success('操作成功', data);
      }),
    );
  }
}


