import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Length } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 重置密码 DTO
 */
export class ResetPwdDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '新密码', example: '123456' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(5, 20, { message: '密码长度必须介于 5 和 20 之间' })
  password: string;
}

