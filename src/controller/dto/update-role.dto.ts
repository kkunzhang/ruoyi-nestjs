import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoleDto } from './create-role.dto';

/**
 * 修改角色 DTO
 */
export class UpdateRoleDto extends CreateRoleDto {
  @ApiProperty({ description: '角色ID', example: 2 })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  roleId: number;
}

