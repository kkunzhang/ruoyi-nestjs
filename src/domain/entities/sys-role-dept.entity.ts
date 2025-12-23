import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * 角色和部门关联表 sys_role_dept
 * 对应 Java 的 SysRoleDept
 * 
 * 说明：
 * - 此表用于维护角色与部门的多对多关联关系
 * - 用于角色的自定义数据权限（dataScope = 2）
 * - 通过此表可以为角色指定可以访问哪些部门的数据
 * - 联合主键：roleId + deptId
 */
@Entity('sys_role_dept')
export class SysRoleDept {
  /**
   * 角色ID
   */
  @PrimaryColumn({ name: 'role_id', type: 'bigint', comment: '角色ID' })
  roleId: number;

  /**
   * 部门ID
   */
  @PrimaryColumn({ name: 'dept_id', type: 'bigint', comment: '部门ID' })
  deptId: number;
}

