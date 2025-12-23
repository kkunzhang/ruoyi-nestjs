import { Entity, PrimaryGeneratedColumn, Column, Tree, TreeChildren, TreeParent } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';

/**
 * 部门表 sys_dept
 * 对应 Java 的 SysDept
 */
@Entity('sys_dept')
@Tree('materialized-path')
export class SysDept extends BaseEntity {
  /**
   * 部门ID
   */
  @ApiProperty({ description: '部门ID' })
  @PrimaryGeneratedColumn({ name: 'dept_id', type: 'bigint', comment: '部门ID' })
  deptId: number;

  /**
   * 父部门ID
   */
  @ApiPropertyOptional({ description: '父部门ID' })
  @Column({ name: 'parent_id', type: 'bigint', default: 0, comment: '父部门ID' })
  parentId: number;

  /**
   * 祖级列表
   */
  @ApiPropertyOptional({ description: '祖级列表' })
  @Column({ type: 'varchar', length: 50, default: '', comment: '祖级列表' })
  ancestors: string;

  /**
   * 部门名称
   */
  @ApiProperty({ description: '部门名称' })
  @Column({ name: 'dept_name', type: 'varchar', length: 30, default: '', comment: '部门名称' })
  deptName: string;

  /**
   * 显示顺序
   */
  @ApiProperty({ description: '显示顺序' })
  @Column({ name: 'order_num', type: 'int', default: 0, comment: '显示顺序' })
  orderNum: number;

  /**
   * 负责人
   */
  @ApiPropertyOptional({ description: '负责人' })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '负责人' })
  leader?: string;

  /**
   * 联系电话
   */
  @ApiPropertyOptional({ description: '联系电话' })
  @Column({ type: 'varchar', length: 11, nullable: true, comment: '联系电话' })
  phone?: string;

  /**
   * 邮箱
   */
  @ApiPropertyOptional({ description: '邮箱' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '邮箱' })
  email?: string;

  /**
   * 部门状态（0正常 1停用）
   */
  @ApiProperty({ description: '部门状态（0正常 1停用）' })
  @Column({ type: 'char', length: 1, default: '0', comment: '部门状态（0正常 1停用）' })
  status: string;

  /**
   * 删除标志（0代表存在 2代表删除）
   */
  @ApiProperty({ description: '删除标志（0代表存在 2代表删除）' })
  @Column({ name: 'del_flag', type: 'char', length: 1, default: '0', comment: '删除标志（0代表存在 2代表删除）' })
  delFlag: string;

  /**
   * 父部门（树形结构）
   */
  @TreeParent()
  parent?: SysDept;

  /**
   * 子部门（树形结构）
   */
  @TreeChildren()
  children?: SysDept[];
}

