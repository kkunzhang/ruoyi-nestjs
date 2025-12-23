import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';
import { SysDept } from './sys-dept.entity';
import { SysRole } from './sys-role.entity';
import { SysPost } from './sys-post.entity';

/**
 * 用户对象 sys_user
 * 对应 Java 的 SysUser
 */
@Entity('sys_user')
export class SysUser extends BaseEntity {
  /**
   * 用户ID
   */
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn({ name: 'user_id', type: 'bigint', comment: '用户ID' })
  userId: number;

  /**
   * 部门ID
   */
  @ApiPropertyOptional({ description: '部门ID' })
  @Column({ name: 'dept_id', type: 'bigint', nullable: true, comment: '部门ID' })
  deptId?: number;

  /**
   * 用户账号
   */
  @ApiProperty({ description: '用户账号' })
  @Column({ name: 'user_name', type: 'varchar', length: 30, unique: true, comment: '用户账号' })
  userName: string;

  /**
   * 用户昵称
   */
  @ApiProperty({ description: '用户昵称' })
  @Column({ name: 'nick_name', type: 'varchar', length: 30, comment: '用户昵称' })
  nickName: string;

  /**
   * 用户类型（00系统用户）
   */
  @ApiPropertyOptional({ description: '用户类型（00系统用户）' })
  @Column({ name: 'user_type', type: 'varchar', length: 2, default: '00', comment: '用户类型（00系统用户）' })
  userType: string;

  /**
   * 用户邮箱
   */
  @ApiPropertyOptional({ description: '用户邮箱' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '用户邮箱' })
  email?: string;

  /**
   * 手机号码
   */
  @ApiPropertyOptional({ description: '手机号码' })
  @Column({ type: 'varchar', length: 11, nullable: true, comment: '手机号码' })
  phonenumber?: string;

  /**
   * 用户性别（0男 1女 2未知）
   */
  @ApiPropertyOptional({ description: '用户性别（0男 1女 2未知）' })
  @Column({ type: 'char', length: 1, nullable: true, comment: '用户性别（0男 1女 2未知）' })
  sex?: string;

  /**
   * 头像地址
   */
  @ApiPropertyOptional({ description: '头像地址' })
  @Column({ type: 'varchar', length: 100, nullable: true, comment: '头像地址' })
  avatar?: string;

  /**
   * 密码
   */
  @Exclude() // 序列化时排除密码字段
  @Column({ type: 'varchar', length: 100, default: '', comment: '密码' })
  password: string;

  /**
   * 帐号状态（0正常 1停用）
   */
  @ApiProperty({ description: '帐号状态（0正常 1停用）' })
  @Column({ type: 'char', length: 1, default: '0', comment: '帐号状态（0正常 1停用）' })
  status: string;

  /**
   * 删除标志（0代表存在 2代表删除）
   */
  @ApiProperty({ description: '删除标志（0代表存在 2代表删除）' })
  @Column({ name: 'del_flag', type: 'char', length: 1, default: '0', comment: '删除标志（0代表存在 2代表删除）' })
  delFlag: string;

  /**
   * 最后登录IP
   */
  @ApiPropertyOptional({ description: '最后登录IP' })
  @Column({ name: 'login_ip', type: 'varchar', length: 128, nullable: true, comment: '最后登录IP' })
  loginIp?: string;

  /**
   * 最后登录时间
   */
  @ApiPropertyOptional({ description: '最后登录时间' })
  @Column({ name: 'login_date', type: 'datetime', nullable: true, comment: '最后登录时间' })
  loginDate?: Date;

  /**
   * 密码最后更新时间
   */
  @ApiPropertyOptional({ description: '密码最后更新时间' })
  @Column({ name: 'pwd_update_date', type: 'datetime', nullable: true, comment: '密码最后更新时间' })
  pwdUpdateDate?: Date;

  /**
   * 部门对象（多对一）
   */
  @ManyToOne(() => SysDept, { nullable: true })
  @JoinColumn({ name: 'dept_id' })
  dept?: SysDept;

  /**
   * 角色列表（多对多）
   */
  @ManyToMany(() => SysRole)
  @JoinTable({
    name: 'sys_user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'userId' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'roleId' },
  })
  roles?: SysRole[];

  /**
   * 岗位列表（多对多）
   */
  @ManyToMany(() => SysPost)
  @JoinTable({
    name: 'sys_user_post',
    joinColumn: { name: 'user_id', referencedColumnName: 'userId' },
    inverseJoinColumn: { name: 'post_id', referencedColumnName: 'postId' },
  })
  posts?: SysPost[];

  /**
   * 判断是否为管理员
   */
  isAdmin(): boolean {
    return this.userId === 1;
  }
}

