import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../common/dto/page-query.dto';

/**
 * 用户查询 DTO
 */
export class UserQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '用户ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: '用户账号', example: 'admin' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ description: '用户昵称', example: '管理员' })
  @IsOptional()
  @IsString()
  nickName?: string;

  @ApiPropertyOptional({ description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phonenumber?: string;

  @ApiPropertyOptional({ description: '用户状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '部门ID', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deptId?: number;

  @ApiPropertyOptional({ description: '开始时间', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

