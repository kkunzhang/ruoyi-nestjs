import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 修改用户状态 DTO
 */
export class ChangeStatusDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '用户状态', example: '0' })
  @IsNotEmpty({ message: '状态不能为空' })
  @IsString()
  status: string;
}

