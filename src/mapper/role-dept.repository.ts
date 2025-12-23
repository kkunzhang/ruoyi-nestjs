import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SysRoleDept } from '../domain/entities/sys-role-dept.entity';

/**
 * 角色与部门关联表 数据层
 * 对应 Java 的 SysRoleDeptMapper
 */
@Injectable()
export class RoleDeptRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 通过角色ID删除角色和部门关联
   * @param roleId 角色ID
   * @returns 结果
   */
  async deleteRoleDeptByRoleId(roleId: number): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_role_dept')
      .where('role_id = :roleId', { roleId })
      .execute();

    return result.affected || 0;
  }

  /**
   * 批量删除角色部门关联信息
   * @param ids 需要删除的角色ID
   * @returns 结果
   */
  async deleteRoleDept(ids: number[]): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_role_dept')
      .where('role_id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * 查询部门使用数量
   * @param deptId 部门ID
   * @returns 结果
   */
  async selectCountRoleDeptByDeptId(deptId: number): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('sys_role_dept', 'rd')
      .where('rd.dept_id = :deptId', { deptId })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * 批量新增角色部门信息
   * @param roleDeptList 角色部门列表
   * @returns 结果
   */
  async batchRoleDept(roleDeptList: Partial<SysRoleDept>[]): Promise<number> {
    if (!roleDeptList || roleDeptList.length === 0) {
      return 0;
    }

    const values = roleDeptList.map((rd) => ({
      role_id: rd.roleId,
      dept_id: rd.deptId,
    }));

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('sys_role_dept')
      .values(values)
      .execute();

    return result.raw.affectedRows || 0;
  }

  /**
   * 查询角色的所有部门ID
   * @param roleId 角色ID
   * @returns 部门ID列表
   */
  async selectDeptIdsByRoleId(roleId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('rd.dept_id', 'deptId')
      .from('sys_role_dept', 'rd')
      .where('rd.role_id = :roleId', { roleId })
      .getRawMany();

    return result.map((item) => item.deptId);
  }

  /**
   * 查询部门被哪些角色使用（用于数据权限）
   * @param deptId 部门ID
   * @returns 角色ID列表
   */
  async selectRoleIdsByDeptId(deptId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('rd.role_id', 'roleId')
      .from('sys_role_dept', 'rd')
      .where('rd.dept_id = :deptId', { deptId })
      .getRawMany();

    return result.map((item) => item.roleId);
  }
}

