import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

/**
 * 分页查询参数
 */
export class PageQueryDto {
  @ApiPropertyOptional({ description: '当前页码', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '排序列' })
  @IsOptional()
  orderByColumn?: string;

  @ApiPropertyOptional({ description: '排序方向', example: 'asc' })
  @IsOptional()
  isAsc?: string;

  @ApiPropertyOptional({ description: '合理化分页参数' })
  @IsOptional()
  reasonable?: boolean;
}

