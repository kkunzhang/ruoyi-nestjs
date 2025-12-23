import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 用户授权角色 DTO
 */
export class AuthRoleDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '角色ID数组', example: [1, 2] })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsArray()
  @Type(() => Number)
  roleIds: number[];
}

