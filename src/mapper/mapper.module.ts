import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUser, SysDept, SysRole, SysMenu, SysPost } from '../domain/entities';
import { UserRepository } from './user.repository';
import { UserRoleRepository } from './user-role.repository';
import { UserPostRepository } from './user-post.repository';

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
    ]),
  ],
  providers: [
    UserRepository,
    UserRoleRepository,
    UserPostRepository,
  ],
  exports: [
    UserRepository,
    UserRoleRepository,
    UserPostRepository,
    TypeOrmModule,
  ],
})
export class MapperModule {}

