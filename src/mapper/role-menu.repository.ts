import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SysRoleMenu } from '../domain/entities/sys-role-menu.entity';

/**
 * 角色与菜单关联表 数据层
 * 对应 Java 的 SysRoleMenuMapper
 */
@Injectable()
export class RoleMenuRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 查询菜单使用数量
   * @param menuId 菜单ID
   * @returns 结果
   */
  async checkMenuExistRole(menuId: number): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('sys_role_menu', 'rm')
      .where('rm.menu_id = :menuId', { menuId })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * 通过角色ID删除角色和菜单关联
   * @param roleId 角色ID
   * @returns 结果
   */
  async deleteRoleMenuByRoleId(roleId: number): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_role_menu')
      .where('role_id = :roleId', { roleId })
      .execute();

    return result.affected || 0;
  }

  /**
   * 批量删除角色菜单关联信息
   * @param ids 需要删除的角色ID
   * @returns 结果
   */
  async deleteRoleMenu(ids: number[]): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_role_menu')
      .where('role_id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * 批量新增角色菜单信息
   * @param roleMenuList 角色菜单列表
   * @returns 结果
   */
  async batchRoleMenu(roleMenuList: Partial<SysRoleMenu>[]): Promise<number> {
    if (!roleMenuList || roleMenuList.length === 0) {
      return 0;
    }

    const values = roleMenuList.map((rm) => ({
      role_id: rm.roleId,
      menu_id: rm.menuId,
    }));

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('sys_role_menu')
      .values(values)
      .execute();

    return result.raw.affectedRows || 0;
  }

  /**
   * 查询角色的所有菜单ID
   * @param roleId 角色ID
   * @returns 菜单ID列表
   */
  async selectMenuIdsByRoleId(roleId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('rm.menu_id', 'menuId')
      .from('sys_role_menu', 'rm')
      .where('rm.role_id = :roleId', { roleId })
      .getRawMany();

    return result.map((item) => item.menuId);
  }

  /**
   * 查询菜单被哪些角色使用
   * @param menuId 菜单ID
   * @returns 角色ID列表
   */
  async selectRoleIdsByMenuId(menuId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('rm.role_id', 'roleId')
      .from('sys_role_menu', 'rm')
      .where('rm.menu_id = :menuId', { menuId })
      .getRawMany();

    return result.map((item) => item.roleId);
  }
}

