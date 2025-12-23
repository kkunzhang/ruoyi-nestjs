import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between } from 'typeorm';
import { SysUser } from '../domain/entities/sys-user.entity';

/**
 * 用户表 数据层
 * 对应 Java 的 SysUserMapper
 */
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
  ) {}

  /**
   * 根据条件分页查询用户列表
   * @param query 查询条件
   * @returns 用户信息集合
   */
  async selectUserList(query: {
    userId?: number;
    userName?: string;
    status?: string;
    phonenumber?: string;
    deptId?: number;
    beginTime?: Date;
    endTime?: Date;
    skip?: number;
    take?: number;
  }): Promise<[SysUser[], number]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.dept', 'd')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.delFlag = :delFlag', { delFlag: '0' });

    // 用户ID
    if (query.userId) {
      queryBuilder.andWhere('u.userId = :userId', { userId: query.userId });
    }

    // 用户名（模糊查询）
    if (query.userName) {
      queryBuilder.andWhere('u.userName LIKE :userName', {
        userName: `%${query.userName}%`,
      });
    }

    // 状态
    if (query.status) {
      queryBuilder.andWhere('u.status = :status', { status: query.status });
    }

    // 手机号（模糊查询）
    if (query.phonenumber) {
      queryBuilder.andWhere('u.phonenumber LIKE :phonenumber', {
        phonenumber: `%${query.phonenumber}%`,
      });
    }

    // 部门ID（包含子部门）
    if (query.deptId) {
      queryBuilder.andWhere(
        '(u.deptId = :deptId OR u.deptId IN (SELECT t.deptId FROM sys_dept t WHERE FIND_IN_SET(:deptId, t.ancestors)))',
        { deptId: query.deptId },
      );
    }

    // 创建时间范围
    if (query.beginTime && query.endTime) {
      queryBuilder.andWhere('u.createTime BETWEEN :beginTime AND :endTime', {
        beginTime: query.beginTime,
        endTime: query.endTime,
      });
    }

    // 分页
    if (query.skip !== undefined) {
      queryBuilder.skip(query.skip);
    }
    if (query.take !== undefined) {
      queryBuilder.take(query.take);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 根据条件分页查询已配用户角色列表
   * @param query 查询条件
   * @returns 用户信息集合
   */
  async selectAllocatedList(query: {
    roleId: number;
    userName?: string;
    phonenumber?: string;
    skip?: number;
    take?: number;
  }): Promise<[SysUser[], number]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.dept', 'd')
      .leftJoinAndSelect('u.roles', 'r')
      .where('u.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('r.roleId = :roleId', { roleId: query.roleId });

    if (query.userName) {
      queryBuilder.andWhere('u.userName LIKE :userName', {
        userName: `%${query.userName}%`,
      });
    }

    if (query.phonenumber) {
      queryBuilder.andWhere('u.phonenumber LIKE :phonenumber', {
        phonenumber: `%${query.phonenumber}%`,
      });
    }

    if (query.skip !== undefined) {
      queryBuilder.skip(query.skip);
    }
    if (query.take !== undefined) {
      queryBuilder.take(query.take);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 根据条件分页查询未分配用户角色列表
   * @param query 查询条件
   * @returns 用户信息集合
   */
  async selectUnallocatedList(query: {
    roleId: number;
    userName?: string;
    phonenumber?: string;
    skip?: number;
    take?: number;
  }): Promise<[SysUser[], number]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.dept', 'd')
      .leftJoin('u.roles', 'r')
      .where('u.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('(r.roleId != :roleId OR r.roleId IS NULL)', {
        roleId: query.roleId,
      });

    if (query.userName) {
      queryBuilder.andWhere('u.userName LIKE :userName', {
        userName: `%${query.userName}%`,
      });
    }

    if (query.phonenumber) {
      queryBuilder.andWhere('u.phonenumber LIKE :phonenumber', {
        phonenumber: `%${query.phonenumber}%`,
      });
    }

    if (query.skip !== undefined) {
      queryBuilder.skip(query.skip);
    }
    if (query.take !== undefined) {
      queryBuilder.take(query.take);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 通过用户名查询用户
   * @param userName 用户名
   * @returns 用户对象信息
   */
  async selectUserByUserName(userName: string): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { userName, delFlag: '0' },
      relations: ['dept', 'roles'],
    });
  }

  /**
   * 通过用户ID查询用户
   * @param userId 用户ID
   * @returns 用户对象信息
   */
  async selectUserById(userId: number): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { userId, delFlag: '0' },
      relations: ['dept', 'roles', 'posts'],
    });
  }

  /**
   * 新增用户信息
   * @param user 用户信息
   * @returns 结果
   */
  async insertUser(user: Partial<SysUser>): Promise<SysUser> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  /**
   * 修改用户信息
   * @param user 用户信息
   * @returns 结果
   */
  async updateUser(user: Partial<SysUser>): Promise<boolean> {
    const result = await this.userRepository.update(user.userId!, user);
    return result.affected! > 0;
  }

  /**
   * 修改用户头像
   * @param userId 用户ID
   * @param avatar 头像地址
   * @returns 结果
   */
  async updateUserAvatar(userId: number, avatar: string): Promise<boolean> {
    const result = await this.userRepository.update(userId, { avatar });
    return result.affected! > 0;
  }

  /**
   * 修改用户状态
   * @param userId 用户ID
   * @param status 状态
   * @returns 结果
   */
  async updateUserStatus(userId: number, status: string): Promise<boolean> {
    const result = await this.userRepository.update(userId, { status });
    return result.affected! > 0;
  }

  /**
   * 更新用户登录信息（IP和登录时间）
   * @param userId 用户ID
   * @param loginIp 登录IP地址
   * @param loginDate 登录时间
   * @returns 结果
   */
  async updateLoginInfo(
    userId: number,
    loginIp: string,
    loginDate: Date,
  ): Promise<boolean> {
    const result = await this.userRepository.update(userId, {
      loginIp,
      loginDate,
    });
    return result.affected! > 0;
  }

  /**
   * 重置用户密码
   * @param userId 用户ID
   * @param password 密码
   * @returns 结果
   */
  async resetUserPwd(userId: number, password: string): Promise<boolean> {
    const result = await this.userRepository.update(userId, {
      password,
      pwdUpdateDate: new Date(),
    });
    return result.affected! > 0;
  }

  /**
   * 通过用户ID删除用户（软删除）
   * @param userId 用户ID
   * @returns 结果
   */
  async deleteUserById(userId: number): Promise<boolean> {
    const result = await this.userRepository.update(userId, { delFlag: '2' });
    return result.affected! > 0;
  }

  /**
   * 批量删除用户信息（软删除）
   * @param userIds 需要删除的用户ID
   * @returns 结果
   */
  async deleteUserByIds(userIds: number[]): Promise<boolean> {
    const result = await this.userRepository.update(
      { userId: In(userIds) },
      { delFlag: '2' },
    );
    return result.affected! > 0;
  }

  /**
   * 校验用户名称是否唯一
   * @param userName 用户名称
   * @returns 结果
   */
  async checkUserNameUnique(userName: string): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { userName, delFlag: '0' },
    });
  }

  /**
   * 校验手机号码是否唯一
   * @param phonenumber 手机号码
   * @returns 结果
   */
  async checkPhoneUnique(phonenumber: string): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { phonenumber, delFlag: '0' },
    });
  }

  /**
   * 校验email是否唯一
   * @param email 用户邮箱
   * @returns 结果
   */
  async checkEmailUnique(email: string): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { email, delFlag: '0' },
    });
  }
}

