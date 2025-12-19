import { ApiProperty } from '@nestjs/swagger';

/**
 * 分页结果 DTO
 * 对应 RuoYi 的 TableDataInfo
 */
export class PageResultDto<T> {
  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '数据列表' })
  rows: T[];

  @ApiProperty({ description: '状态码', default: 200 })
  code: number;

  @ApiProperty({ description: '消息', default: '查询成功' })
  msg: string;

  constructor(rows: T[], total: number, code = 200, msg = '查询成功') {
    this.rows = rows;
    this.total = total;
    this.code = code;
    this.msg = msg;
  }
}


