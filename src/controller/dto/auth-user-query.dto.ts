import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../common/dto/page-query.dto';

/**
 * 查询已分配/未分配用户角色列表 DTO
 */
export class AuthUserQueryDto extends PageQueryDto {
  @ApiProperty({ description: '角色ID', example: 2 })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  roleId: number;

  @ApiPropertyOptional({ description: '用户账号' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ description: '手机号码' })
  @IsOptional()
  @IsString()
  phonenumber?: string;
}

