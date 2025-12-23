import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 修改数据权限 DTO
 */
export class UpdateDataScopeDto {
  @ApiProperty({ description: '角色ID', example: 2 })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  roleId: number;

  @ApiProperty({ description: '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）', example: '2' })
  @IsNotEmpty({ message: '数据范围不能为空' })
  @IsString()
  dataScope: string;

  @ApiPropertyOptional({ description: '部门ID列表（数据权限）', example: [100, 101] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  deptIds?: number[];
}

