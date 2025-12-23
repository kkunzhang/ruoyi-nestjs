import { Entity, PrimaryGeneratedColumn, Column, Tree, TreeChildren, TreeParent } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';

/**
 * 菜单权限表 sys_menu
 * 对应 Java 的 SysMenu
 */
@Entity('sys_menu')
@Tree('materialized-path')
export class SysMenu extends BaseEntity {
  /**
   * 菜单ID
   */
  @ApiProperty({ description: '菜单ID' })
  @PrimaryGeneratedColumn({ name: 'menu_id', type: 'bigint', comment: '菜单ID' })
  menuId: number;

  /**
   * 菜单名称
   */
  @ApiProperty({ description: '菜单名称' })
  @Column({ name: 'menu_name', type: 'varchar', length: 50, comment: '菜单名称' })
  menuName: string;

  /**
   * 父菜单ID
   */
  @ApiProperty({ description: '父菜单ID' })
  @Column({ name: 'parent_id', type: 'bigint', default: 0, comment: '父菜单ID' })
  parentId: number;

  /**
   * 显示顺序
   */
  @ApiProperty({ description: '显示顺序' })
  @Column({ name: 'order_num', type: 'int', default: 0, comment: '显示顺序' })
  orderNum: number;

  /**
   * 路由地址
   */
  @ApiPropertyOptional({ description: '路由地址' })
  @Column({ type: 'varchar', length: 200, default: '', comment: '路由地址' })
  path: string;

  /**
   * 组件路径
   */
  @ApiPropertyOptional({ description: '组件路径' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '组件路径' })
  component?: string;

  /**
   * 路由参数
   */
  @ApiPropertyOptional({ description: '路由参数' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '路由参数' })
  query?: string;

  /**
   * 路由名称
   */
  @ApiPropertyOptional({ description: '路由名称' })
  @Column({ name: 'route_name', type: 'varchar', length: 50, nullable: true, comment: '路由名称' })
  routeName?: string;

  /**
   * 是否为外链（0是 1否）
   */
  @ApiProperty({ description: '是否为外链（0是 1否）' })
  @Column({ name: 'is_frame', type: 'int', default: 1, comment: '是否为外链（0是 1否）' })
  isFrame: number;

  /**
   * 是否缓存（0缓存 1不缓存）
   */
  @ApiProperty({ description: '是否缓存（0缓存 1不缓存）' })
  @Column({ name: 'is_cache', type: 'int', default: 0, comment: '是否缓存（0缓存 1不缓存）' })
  isCache: number;

  /**
   * 菜单类型（M目录 C菜单 F按钮）
   */
  @ApiProperty({ description: '菜单类型（M目录 C菜单 F按钮）' })
  @Column({ name: 'menu_type', type: 'char', length: 1, default: '', comment: '菜单类型（M目录 C菜单 F按钮）' })
  menuType: string;

  /**
   * 显示状态（0显示 1隐藏）
   */
  @ApiProperty({ description: '显示状态（0显示 1隐藏）' })
  @Column({ type: 'char', length: 1, default: '0', comment: '显示状态（0显示 1隐藏）' })
  visible: string;

  /**
   * 菜单状态（0正常 1停用）
   */
  @ApiProperty({ description: '菜单状态（0正常 1停用）' })
  @Column({ type: 'char', length: 1, default: '0', comment: '菜单状态（0正常 1停用）' })
  status: string;

  /**
   * 权限标识
   */
  @ApiPropertyOptional({ description: '权限标识' })
  @Column({ type: 'varchar', length: 100, nullable: true, comment: '权限标识' })
  perms?: string;

  /**
   * 菜单图标
   */
  @ApiPropertyOptional({ description: '菜单图标' })
  @Column({ type: 'varchar', length: 100, default: '#', comment: '菜单图标' })
  icon: string;

  /**
   * 父菜单（树形结构）
   */
  @TreeParent()
  parent?: SysMenu;

  /**
   * 子菜单（树形结构）
   */
  @TreeChildren()
  children?: SysMenu[];
}

