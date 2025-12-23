import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * 日志服务
 * 后续可扩展为记录到数据库或文件
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  log(message: any, context?: string) {
    console.log(`[LOG] [${context || 'Application'}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    console.error(`[ERROR] [${context || 'Application'}] ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    console.warn(`[WARN] [${context || 'Application'}] ${message}`);
  }

  debug(message: any, context?: string) {
    console.debug(`[DEBUG] [${context || 'Application'}] ${message}`);
  }

  verbose(message: any, context?: string) {
    console.log(`[VERBOSE] [${context || 'Application'}] ${message}`);
  }
}



