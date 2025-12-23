import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';

/**
 * 岗位表 sys_post
 * 对应 Java 的 SysPost
 */
@Entity('sys_post')
export class SysPost extends BaseEntity {
  /**
   * 岗位ID
   */
  @ApiProperty({ description: '岗位ID' })
  @PrimaryGeneratedColumn({ name: 'post_id', type: 'bigint', comment: '岗位ID' })
  postId: number;

  /**
   * 岗位编码
   */
  @ApiProperty({ description: '岗位编码' })
  @Column({ name: 'post_code', type: 'varchar', length: 64, comment: '岗位编码' })
  postCode: string;

  /**
   * 岗位名称
   */
  @ApiProperty({ description: '岗位名称' })
  @Column({ name: 'post_name', type: 'varchar', length: 50, comment: '岗位名称' })
  postName: string;

  /**
   * 显示顺序
   */
  @ApiProperty({ description: '显示顺序' })
  @Column({ name: 'post_sort', type: 'int', comment: '显示顺序' })
  postSort: number;

  /**
   * 状态（0正常 1停用）
   */
  @ApiProperty({ description: '状态（0正常 1停用）' })
  @Column({ type: 'char', length: 1, comment: '状态（0正常 1停用）' })
  status: string;
}

