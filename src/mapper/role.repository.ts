import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { SysRole } from '../domain/entities/sys-role.entity';

/**
 * 角色表 数据层
 * 对应 Java 的 SysRoleMapper
 */
@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(SysRole)
    private readonly roleRepository: Repository<SysRole>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 根据条件分页查询角色数据
   * @param role 角色信息
   * @returns 角色数据集合信息
   */
  async selectRoleList(role: Partial<SysRole>): Promise<[SysRole[], number]> {
    const queryBuilder = this.roleRepository.createQueryBuilder('r');
    
    queryBuilder.where('r.delFlag = :delFlag', { delFlag: '0' });

    // 条件筛选
    if (role.roleId) {
      queryBuilder.andWhere('r.roleId = :roleId', { roleId: role.roleId });
    }
    if (role.roleName) {
      queryBuilder.andWhere('r.roleName LIKE :roleName', { roleName: `%${role.roleName}%` });
    }
    if (role.roleKey) {
      queryBuilder.andWhere('r.roleKey LIKE :roleKey', { roleKey: `%${role.roleKey}%` });
    }
    if (role.status) {
      queryBuilder.andWhere('r.status = :status', { status: role.status });
    }

    // 排序
    queryBuilder.orderBy('r.roleSort', 'ASC');

    return queryBuilder.getManyAndCount();
  }

  /**
   * 根据用户ID查询角色
   * @param userId 用户ID
   * @returns 角色列表（包含数据权限）
   */
  async selectRolePermissionByUserId(userId: number): Promise<SysRole[]> {
    const query = `
      SELECT DISTINCT r.role_id, r.role_name, r.role_key, r.role_sort, 
             r.data_scope, r.status, r.del_flag, r.create_time, r.remark
      FROM sys_role r
      LEFT JOIN sys_user_role ur ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
        AND r.del_flag = '0'
    `;

    return this.roleRepository.query(query, [userId]);
  }

  /**
   * 查询所有角色
   * @returns 角色列表
   */
  async selectRoleAll(): Promise<SysRole[]> {
    return this.roleRepository.find({
      where: { delFlag: '0' },
      order: { roleSort: 'ASC' },
    });
  }

  /**
   * 根据用户ID获取角色选择框列表
   * @param userId 用户ID
   * @returns 选中角色ID列表
   */
  async selectRoleListByUserId(userId: number): Promise<number[]> {
    const result = await this.dataSource.query(
      'SELECT role_id FROM sys_user_role WHERE user_id = ?',
      [userId],
    );
    return result.map((item: any) => item.role_id);
  }

  /**
   * 通过角色ID查询角色
   * @param roleId 角色ID
   * @returns 角色对象信息
   */
  async selectRoleById(roleId: number): Promise<SysRole | null> {
    return this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });
  }

  /**
   * 根据用户名查询角色
   * @param userName 用户名
   * @returns 角色列表
   */
  async selectRolesByUserName(userName: string): Promise<SysRole[]> {
    const query = `
      SELECT DISTINCT r.*
      FROM sys_role r
      LEFT JOIN sys_user_role ur ON ur.role_id = r.role_id
      LEFT JOIN sys_user u ON u.user_id = ur.user_id
      WHERE u.user_name = ?
        AND r.del_flag = '0'
    `;

    return this.roleRepository.query(query, [userName]);
  }

  /**
   * 校验角色名称是否唯一
   * @param roleName 角色名称
   * @returns 角色信息
   */
  async checkRoleNameUnique(roleName: string): Promise<SysRole | null> {
    return this.roleRepository.findOne({
      where: { roleName, delFlag: '0' },
    });
  }

  /**
   * 校验角色权限是否唯一
   * @param roleKey 角色权限
   * @returns 角色信息
   */
  async checkRoleKeyUnique(roleKey: string): Promise<SysRole | null> {
    return this.roleRepository.findOne({
      where: { roleKey, delFlag: '0' },
    });
  }

  /**
   * 修改角色信息
   * @param role 角色信息
   * @returns 结果
   */
  async updateRole(role: Partial<SysRole>): Promise<number> {
    const result = await this.roleRepository.update(
      { roleId: role.roleId },
      role,
    );
    return result.affected || 0;
  }

  /**
   * 新增角色信息
   * @param role 角色信息
   * @returns 结果
   */
  async insertRole(role: SysRole): Promise<SysRole> {
    return this.roleRepository.save(role);
  }

  /**
   * 通过角色ID删除角色
   * @param roleId 角色ID
   * @returns 结果
   */
  async deleteRoleById(roleId: number): Promise<number> {
    // 软删除
    const result = await this.roleRepository.update(
      { roleId },
      { delFlag: '2' },
    );
    return result.affected || 0;
  }

  /**
   * 批量删除角色信息
   * @param roleIds 需要删除的角色ID
   * @returns 结果
   */
  async deleteRoleByIds(roleIds: number[]): Promise<number> {
    // 软删除
    const result = await this.roleRepository
      .createQueryBuilder()
      .update(SysRole)
      .set({ delFlag: '2' })
      .whereInIds(roleIds)
      .execute();
    return result.affected || 0;
  }
}

