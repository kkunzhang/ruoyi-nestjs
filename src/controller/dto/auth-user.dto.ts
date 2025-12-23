import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 授权/取消授权用户 DTO
 */
export class AuthUserDto {
  @ApiProperty({ description: '角色ID', example: 2 })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  roleId: number;

  @ApiProperty({ description: '用户ID列表', example: [1, 2, 3] })
  @IsNotEmpty({ message: '用户ID列表不能为空' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  userIds: number[];
}

/**
 * 取消单个用户授权 DTO
 */
export class CancelAuthUserDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: '角色ID', example: 2 })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  roleId: number;
}

