import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应结果
 * 对应 Java 的 AjaxResult
 */
export class ResponseDto<T = any> {
  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '返回消息', example: '操作成功' })
  msg: string;

  @ApiProperty({ description: '返回数据' })
  data?: T;

  constructor(code: number, msg: string, data?: T) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  static success<T>(data?: T, msg = '操作成功'): ResponseDto<T> {
    return new ResponseDto(200, msg, data);
  }

  static error(msg = '操作失败', code = 500): ResponseDto {
    return new ResponseDto(code, msg);
  }
}

/**
 * 分页响应结果
 * 对应 Java 的 TableDataInfo
 */
export class PageResponseDto<T = any> {
  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '列表数据' })
  rows: T[];

  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '返回消息', example: '查询成功' })
  msg: string;

  constructor(rows: T[], total: number, msg = '查询成功') {
    this.rows = rows;
    this.total = total;
    this.code = 200;
    this.msg = msg;
  }
}

