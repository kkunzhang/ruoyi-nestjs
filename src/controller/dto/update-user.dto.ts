import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsNumber, IsArray, Length, Matches } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 更新用户 DTO
 */
export class UpdateUserDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '部门ID', example: 100 })
  @IsNotEmpty({ message: '部门不能为空' })
  @Type(() => Number)
  @IsNumber()
  deptId: number;

  @ApiProperty({ description: '用户账号', example: 'zhangsan' })
  @IsNotEmpty({ message: '用户账号不能为空' })
  @IsString()
  @Length(2, 30, { message: '用户账号长度必须介于 2 和 30 之间' })
  userName: string;

  @ApiProperty({ description: '用户昵称', example: '张三' })
  @IsNotEmpty({ message: '用户昵称不能为空' })
  @IsString()
  @Length(2, 30, { message: '用户昵称长度必须介于 2 和 30 之间' })
  nickName: string;

  @ApiPropertyOptional({ description: '用户邮箱', example: 'zhangsan@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @Length(0, 50, { message: '邮箱长度不能超过50个字符' })
  email?: string;

  @ApiPropertyOptional({ description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号码格式不正确' })
  phonenumber?: string;

  @ApiPropertyOptional({ description: '用户性别', example: '0' })
  @IsOptional()
  @IsString()
  sex?: string;

  @ApiPropertyOptional({ description: '用户状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '岗位ID数组', example: [1, 2] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  postIds?: number[];

  @ApiPropertyOptional({ description: '角色ID数组', example: [1, 2] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  roleIds?: number[];

  @ApiPropertyOptional({ description: '备注', example: '测试用户' })
  @IsOptional()
  @IsString()
  remark?: string;
}

