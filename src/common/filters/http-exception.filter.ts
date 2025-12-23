import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 全局异常过滤器
 * 对应 Java 的 GlobalExceptionHandler
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 500;

    // 处理 HTTP 异常
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || res.error || message;
        
        // 处理 class-validator 的验证错误
        if (Array.isArray(res.message)) {
          message = res.message.join('; ');
        }
      }

      code = status;
    } else if (exception instanceof Error) {
      // 处理普通错误
      message = exception.message || message;
      this.logger.error(
        `Exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      // 处理未知错误
      this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
    }

    // 记录错误日志
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} - ${message}`,
    );

    // 返回统一格式的错误响应
    const errorResponse = {
      code,
      msg: message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
