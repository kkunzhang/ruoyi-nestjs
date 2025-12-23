import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUser, SysDept, SysRole, SysMenu, SysPost, SysOperLog } from '../domain/entities';
import { UserRepository } from './user.repository';
import { UserRoleRepository } from './user-role.repository';
import { UserPostRepository } from './user-post.repository';
import { OperLogRepository } from './oper-log.repository';

/**
 * Mapper 模块
 * 提供所有 Repository（数据访问层）
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysUser,
      SysDept,
      SysRole,
      SysMenu,
      SysPost,
      SysOperLog,
    ]),
  ],
  providers: [
    UserRepository,
    UserRoleRepository,
    UserPostRepository,
    OperLogRepository,
  ],
  exports: [
    UserRepository,
    UserRoleRepository,
    UserPostRepository,
    OperLogRepository,
    TypeOrmModule,
  ],
})
export class MapperModule {}

