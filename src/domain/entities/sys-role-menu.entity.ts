import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * 角色和菜单关联表 sys_role_menu
 * 对应 Java 的 SysRoleMenu
 * 
 * 说明：
 * - 此表用于维护角色与菜单（权限）的多对多关联关系
 * - 通过此表可以为角色分配菜单权限
 * - 联合主键：roleId + menuId
 */
@Entity('sys_role_menu')
export class SysRoleMenu {
  /**
   * 角色ID
   */
  @PrimaryColumn({ name: 'role_id', type: 'bigint', comment: '角色ID' })
  roleId: number;

  /**
   * 菜单ID
   */
  @PrimaryColumn({ name: 'menu_id', type: 'bigint', comment: '菜单ID' })
  menuId: number;
}

