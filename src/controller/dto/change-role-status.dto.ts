import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 修改角色状态 DTO
 */
export class ChangeRoleStatusDto {
  @ApiProperty({ description: '角色ID', example: 2 })
  @IsNotEmpty({ message: '角色ID不能为空' })
  @IsNumber()
  @Type(() => Number)
  roleId: number;

  @ApiProperty({ description: '角色状态（0正常 1停用）', example: '0' })
  @IsNotEmpty({ message: '角色状态不能为空' })
  @IsString()
  status: string;
}

