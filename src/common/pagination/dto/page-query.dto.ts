import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * 分页查询 DTO
 * 对应 RuoYi 的分页参数
 */
export class PageQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  orderByColumn?: string;

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'] })
  @IsOptional()
  isAsc?: 'asc' | 'desc';
}



