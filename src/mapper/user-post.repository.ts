import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SysUser } from '../domain/entities/sys-user.entity';
import { SysPost } from '../domain/entities/sys-post.entity';

/**
 * 用户与岗位关联表 数据层
 * 对应 Java 的 SysUserPostMapper
 * 
 * 注意：TypeORM 的多对多关系会自动管理中间表，
 * 所以不需要单独的 SysUserPost 实体
 */
@Injectable()
export class UserPostRepository {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    @InjectRepository(SysPost)
    private readonly postRepository: Repository<SysPost>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 通过用户ID删除用户和岗位关联
   * @param userId 用户ID
   * @returns 结果
   */
  async deleteUserPostByUserId(userId: number): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_post')
      .where('user_id = :userId', { userId })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 通过岗位ID查询岗位使用数量
   * @param postId 岗位ID
   * @returns 结果
   */
  async countUserPostById(postId: number): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('sys_user_post', 'up')
      .where('up.post_id = :postId', { postId })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * 批量删除用户和岗位关联
   * @param userIds 需要删除的用户ID
   * @returns 结果
   */
  async deleteUserPost(userIds: number[]): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_post')
      .where('user_id IN (:...userIds)', { userIds })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 批量新增用户岗位信息
   * @param userId 用户ID
   * @param postIds 岗位ID列表
   * @returns 结果
   */
  async batchUserPost(userId: number, postIds: number[]): Promise<boolean> {
    if (!postIds || postIds.length === 0) {
      return true;
    }

    // 先删除该用户的所有岗位关联
    await this.deleteUserPostByUserId(userId);

    // 批量插入新的岗位关联
    const values = postIds.map((postId) => ({ user_id: userId, post_id: postId }));

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('sys_user_post')
      .values(values)
      .execute();

    return result.raw.affectedRows > 0;
  }

  /**
   * 删除用户和岗位关联信息
   * @param userId 用户ID
   * @param postId 岗位ID
   * @returns 结果
   */
  async deleteUserPostInfo(userId: number, postId: number): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('sys_user_post')
      .where('user_id = :userId AND post_id = :postId', { userId, postId })
      .execute();

    return result.affected! > 0;
  }

  /**
   * 查询用户的所有岗位ID
   * @param userId 用户ID
   * @returns 岗位ID列表
   */
  async selectPostIdsByUserId(userId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('up.post_id', 'postId')
      .from('sys_user_post', 'up')
      .where('up.user_id = :userId', { userId })
      .getRawMany();

    return result.map((item) => item.postId);
  }

  /**
   * 查询岗位的所有用户ID
   * @param postId 岗位ID
   * @returns 用户ID列表
   */
  async selectUserIdsByPostId(postId: number): Promise<number[]> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('up.user_id', 'userId')
      .from('sys_user_post', 'up')
      .where('up.post_id = :postId', { postId })
      .getRawMany();

    return result.map((item) => item.userId);
  }

  /**
   * 批量授权用户岗位
   * @param postId 岗位ID
   * @param userIds 用户ID列表
   * @returns 结果
   */
  async batchInsertUserPost(postId: number, userIds: number[]): Promise<boolean> {
    if (!userIds || userIds.length === 0) {
      return true;
    }

    const values = userIds.map((userId) => ({ user_id: userId, post_id: postId }));

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('sys_user_post')
      .values(values)
      .execute();

    return result.raw.affectedRows > 0;
  }
}

