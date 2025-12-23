import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, Length, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 新增角色 DTO
 */
export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '普通用户' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  @Length(1, 30, { message: '角色名称长度必须介于 1 和 30 之间' })
  roleName: string;

  @ApiProperty({ description: '角色权限字符串', example: 'common' })
  @IsNotEmpty({ message: '角色权限不能为空' })
  @IsString()
  @Length(1, 100, { message: '角色权限长度必须介于 1 和 100 之间' })
  roleKey: string;

  @ApiProperty({ description: '显示顺序', example: 1 })
  @IsNotEmpty({ message: '显示顺序不能为空' })
  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: '显示顺序必须大于等于 0' })
  roleSort: number;

  @ApiPropertyOptional({ description: '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）', example: '1' })
  @IsOptional()
  @IsString()
  dataScope?: string;

  @ApiPropertyOptional({ description: '菜单树选择项是否关联显示', example: true })
  @IsOptional()
  menuCheckStrictly?: boolean;

  @ApiPropertyOptional({ description: '部门树选择项是否关联显示', example: true })
  @IsOptional()
  deptCheckStrictly?: boolean;

  @ApiProperty({ description: '角色状态（0正常 1停用）', example: '0' })
  @IsNotEmpty({ message: '角色状态不能为空' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: '菜单ID列表', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  menuIds?: number[];

  @ApiPropertyOptional({ description: '部门ID列表（数据权限）', example: [100, 101] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  deptIds?: number[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

