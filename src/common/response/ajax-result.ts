import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应结果
 * 对应 RuoYi 的 AjaxResult
 */
export class AjaxResult<T = any> {
  @ApiProperty({ description: '状态码' })
  code: number;

  @ApiProperty({ description: '消息' })
  msg: string;

  @ApiProperty({ description: '数据', required: false })
  data?: T;

  constructor(code: number, msg: string, data?: T) {
    this.code = code;
    this.msg = msg;
    if (data !== undefined) {
      this.data = data;
    }
  }

  static success<T>(msg = '操作成功', data?: T): AjaxResult<T> {
    return new AjaxResult(200, msg, data);
  }

  static error<T>(msg = '操作失败', code = 500, data?: T): AjaxResult<T> {
    return new AjaxResult(code, msg, data);
  }

  static warn<T>(msg: string, data?: T): AjaxResult<T> {
    return new AjaxResult(601, msg, data);
  }
}


