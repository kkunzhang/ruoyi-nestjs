import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { SysMenu } from './sys-menu.entity';
import { SysDept } from './sys-dept.entity';

/**
 * 角色表 sys_role
 * 对应 Java 的 SysRole
 */
@Entity('sys_role')
export class SysRole extends BaseEntity {
  /**
   * 角色ID
   */
  @ApiProperty({ description: '角色ID' })
  @PrimaryGeneratedColumn({ name: 'role_id', type: 'bigint', comment: '角色ID' })
  roleId: number;

  /**
   * 角色名称
   */
  @ApiProperty({ description: '角色名称' })
  @Column({ name: 'role_name', type: 'varchar', length: 30, comment: '角色名称' })
  roleName: string;

  /**
   * 角色权限字符串
   */
  @ApiProperty({ description: '角色权限字符串' })
  @Column({ name: 'role_key', type: 'varchar', length: 100, comment: '角色权限字符串' })
  roleKey: string;

  /**
   * 显示顺序
   */
  @ApiProperty({ description: '显示顺序' })
  @Column({ name: 'role_sort', type: 'int', comment: '显示顺序' })
  roleSort: number;

  /**
   * 数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）
   */
  @ApiProperty({ description: '数据范围' })
  @Column({ name: 'data_scope', type: 'char', length: 1, default: '1', comment: '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）' })
  dataScope: string;

  /**
   * 菜单树选择项是否关联显示
   */
  @ApiProperty({ description: '菜单树选择项是否关联显示' })
  @Column({ name: 'menu_check_strictly', type: 'tinyint', default: 1, comment: '菜单树选择项是否关联显示' })
  menuCheckStrictly: boolean;

  /**
   * 部门树选择项是否关联显示
   */
  @ApiProperty({ description: '部门树选择项是否关联显示' })
  @Column({ name: 'dept_check_strictly', type: 'tinyint', default: 1, comment: '部门树选择项是否关联显示' })
  deptCheckStrictly: boolean;

  /**
   * 角色状态（0正常 1停用）
   */
  @ApiProperty({ description: '角色状态（0正常 1停用）' })
  @Column({ type: 'char', length: 1, comment: '角色状态（0正常 1停用）' })
  status: string;

  /**
   * 删除标志（0代表存在 2代表删除）
   */
  @ApiProperty({ description: '删除标志（0代表存在 2代表删除）' })
  @Column({ name: 'del_flag', type: 'char', length: 1, default: '0', comment: '删除标志（0代表存在 2代表删除）' })
  delFlag: string;

  /**
   * 角色菜单权限（多对多）
   */
  @ManyToMany(() => SysMenu)
  @JoinTable({
    name: 'sys_role_menu',
    joinColumn: { name: 'role_id', referencedColumnName: 'roleId' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'menuId' },
  })
  menus?: SysMenu[];

  /**
   * 角色部门权限（多对多）
   */
  @ManyToMany(() => SysDept)
  @JoinTable({
    name: 'sys_role_dept',
    joinColumn: { name: 'role_id', referencedColumnName: 'roleId' },
    inverseJoinColumn: { name: 'dept_id', referencedColumnName: 'deptId' },
  })
  depts?: SysDept[];

  /**
   * 判断是否为管理员角色
   */
  isAdmin(): boolean {
    return this.roleId === 1;
  }
}

