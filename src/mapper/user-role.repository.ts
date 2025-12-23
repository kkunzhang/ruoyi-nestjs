import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { SysUser } from '../domain/entities/sys-user.entity';
import { SysRole } from '../domain/entities/sys-role.entity';

/**
 * 用户与角色关联表 数据层
 * 对应 Java 的 SysUserRoleMapper
 * 
 * 注意：TypeORM 的多对多关系会自动管理中间表，
 * 所以不需要单独的 SysUserRole 实体
 */
@Injectable()
export class UserRoleRepository {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    @InjectRepository(SysRole)
    private readonly roleRepository: Repository<SysRole>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 通过用户ID删除用户和角色关联
   * @param userId 用户ID
   * @returns 结果
   */
  async deleteUserRoleByUserId(userId: number): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_role')
      .where('user_id = :userId', { userId })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 批量删除用户和角色关联
   * @param userIds 需要删除的用户ID
   * @returns 结果
   */
  async deleteUserRole(userIds: number[]): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_role')
      .where('user_id IN (:...userIds)', { userIds })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 通过角色ID查询角色使用数量
   * @param roleId 角色ID
   * @returns 结果
   */
  async countUserRoleByRoleId(roleId: number): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('sys_user_role', 'ur')
      .where('ur.role_id = :roleId', { roleId })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * 批量新增用户角色信息
   * @param userId 用户ID
   * @param roleIds 角色ID列表
   * @returns 结果
   */
  async batchUserRole(userId: number, roleIds: number[]): Promise<boolean> {
    if (!roleIds || roleIds.length === 0) {
      return true;
    }

    // 先删除该用户的所有角色关联
    await this.deleteUserRoleByUserId(userId);

    // 批量插入新的角色关联
    const values = roleIds.map((roleId) => ({ user_id: userId, role_id: roleId }));

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('sys_user_role')
      .values(values)
      .execute();

    return result.raw.affectedRows > 0;
  }

  /**
   * 删除用户和角色关联信息
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns 结果
   */
  async deleteUserRoleInfo(userId: number, roleId: number): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_role')
      .where('user_id = :userId AND role_id = :roleId', { userId, roleId })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 批量取消授权用户角色
   * @param roleId 角色ID
   * @param userIds 需要删除的用户数据ID
   * @returns 结果
   */
  async deleteUserRoleInfos(roleId: number, userIds: number[]): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_role')
      .where('role_id = :roleId AND user_id IN (:...userIds)', { roleId, userIds })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 批量授权用户角色
   * @param roleId 角色ID
   * @param userIds 用户ID列表
   * @returns 结果
   */
  async batchInsertUserRole(roleId: number, userIds: number[]): Promise<boolean> {
    if (!userIds || userIds.length === 0) {
      return true;
    }

    const values = userIds.map((userId) => ({ user_id: userId, role_id: roleId }));

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('sys_user_role')
      .values(values)
      .execute();

    return result.raw.affectedRows > 0;
  }

  /**
   * 查询用户的所有角色ID
   * @param userId 用户ID
   * @returns 角色ID列表
   */
  async selectRoleIdsByUserId(userId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('ur.role_id', 'roleId')
      .from('sys_user_role', 'ur')
      .where('ur.user_id = :userId', { userId })
      .getRawMany();

    return result.map((item) => item.roleId);
  }

  /**
   * 查询角色的所有用户ID
   * @param roleId 角色ID
   * @returns 用户ID列表
   */
  async selectUserIdsByRoleId(roleId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('ur.user_id', 'userId')
      .from('sys_user_role', 'ur')
      .where('ur.role_id = :roleId', { roleId })
      .getRawMany();

    return result.map((item) => item.userId);
  }
}

