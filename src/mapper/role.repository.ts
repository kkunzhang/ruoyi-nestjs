import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysRole } from '../domain/entities/sys-role.entity';

/**
 * 角色 Repository
 */
@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(SysRole)
    private readonly roleRepository: Repository<SysRole>,
  ) {}

  /**
   * 根据用户ID查询角色权限数据范围
   * @param userId 用户ID
   * @returns 角色列表（包含数据权限）
   */
  async selectRolePermissionByUserId(userId: number): Promise<SysRole[]> {
    const query = `
      SELECT DISTINCT r.role_id, r.role_name, r.role_key, r.data_scope, r.status
      FROM sys_role r
      LEFT JOIN sys_user_role ur ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
        AND r.del_flag = '0'
        AND r.status = '0'
    `;

    return this.roleRepository.query(query, [userId]);
  }

  /**
   * 根据角色ID查询角色
   * @param roleId 角色ID
   * @returns 角色信息
   */
  async selectRoleById(roleId: number): Promise<SysRole | null> {
    return this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });
  }

  /**
   * 查询所有角色
   * @returns 角色列表
   */
  async selectRoleAll(): Promise<SysRole[]> {
    return this.roleRepository.find({
      where: { delFlag: '0', status: '0' },
    });
  }
}

