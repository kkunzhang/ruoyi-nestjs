import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * 登录 DTO
 */
export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Length(2, 30, { message: '用户名长度必须介于 2 和 30 之间' })
  userName: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(5, 20, { message: '密码长度必须介于 5 和 20 之间' })
  password: string;

  @ApiProperty({ description: '验证码', example: '1234', required: false })
  code?: string;

  @ApiProperty({ description: '唯一标识', example: 'uuid', required: false })
  uuid?: string;
}

