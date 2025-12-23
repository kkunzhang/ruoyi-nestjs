import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 实体基类
 * 对应 Java 的 BaseEntity
 * 包含通用字段：创建人、创建时间、更新人、更新时间、备注
 */
export abstract class BaseEntity {
  /**
   * 创建者
   */
  @ApiPropertyOptional({ description: '创建者' })
  @Column({ name: 'create_by', type: 'varchar', length: 64, nullable: true, comment: '创建者' })
  createBy?: string;

  /**
   * 创建时间
   */
  @ApiPropertyOptional({ description: '创建时间' })
  @CreateDateColumn({ name: 'create_time', type: 'datetime', comment: '创建时间' })
  createTime?: Date;

  /**
   * 更新者
   */
  @ApiPropertyOptional({ description: '更新者' })
  @Column({ name: 'update_by', type: 'varchar', length: 64, nullable: true, comment: '更新者' })
  updateBy?: string;

  /**
   * 更新时间
   */
  @ApiPropertyOptional({ description: '更新时间' })
  @UpdateDateColumn({ name: 'update_time', type: 'datetime', comment: '更新时间' })
  updateTime?: Date;

  /**
   * 备注
   */
  @ApiPropertyOptional({ description: '备注' })
  @Column({ type: 'varchar', length: 500, nullable: true, comment: '备注' })
  remark?: string;
}

