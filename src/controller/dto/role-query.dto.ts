import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from '../../common/dto/page-query.dto';

/**
 * 角色查询 DTO
 */
export class RoleQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '角色ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  roleId?: number;

  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({ description: '角色权限字符串' })
  @IsOptional()
  @IsString()
  roleKey?: string;

  @ApiPropertyOptional({ description: '角色状态（0正常 1停用）' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string;
}

