import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SysUser } from '../domain/entities/sys-user.entity';
import { SysRole } from '../domain/entities/sys-role.entity';
import { SysPost } from '../domain/entities/sys-post.entity';
import { UserRepository } from '../mapper/user.repository';
import { UserRoleRepository } from '../mapper/user-role.repository';
import { UserPostRepository } from '../mapper/user-post.repository';
import { BcryptUtil } from '../common/utils/bcrypt.util';

/**
 * 用户 业务层
 * 对应 Java 的 ISysUserService 和 SysUserServiceImpl
 */
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly userPostRepository: UserPostRepository,
    private readonly dataSource: DataSource,
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
    return this.userRepository.selectUserList(query);
  }

  /**
   * 根据条件分页查询已分配用户角色列表
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
    return this.userRepository.selectAllocatedList(query);
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
    return this.userRepository.selectUnallocatedList(query);
  }

  /**
   * 通过用户名查询用户
   * @param userName 用户名
   * @returns 用户对象信息
   */
  async selectUserByUserName(userName: string): Promise<SysUser | null> {
    return this.userRepository.selectUserByUserName(userName);
  }

  /**
   * 通过用户ID查询用户
   * @param userId 用户ID
   * @returns 用户对象信息
   */
  async selectUserById(userId: number): Promise<SysUser | null> {
    return this.userRepository.selectUserById(userId);
  }

  /**
   * 根据用户名查询用户所属角色组
   * @param userName 用户名
   * @returns 角色名称，用逗号分隔
   */
  async selectUserRoleGroup(userName: string): Promise<string> {
    const user = await this.userRepository.selectUserByUserName(userName);
    if (!user || !user.roles || user.roles.length === 0) {
      return '';
    }
    return user.roles.map((role) => role.roleName).join(',');
  }

  /**
   * 根据用户名查询用户所属岗位组
   * @param userName 用户名
   * @returns 岗位名称，用逗号分隔
   */
  async selectUserPostGroup(userName: string): Promise<string> {
    const user = await this.userRepository.selectUserById(
      (await this.userRepository.selectUserByUserName(userName))?.userId!,
    );
    if (!user || !user.posts || user.posts.length === 0) {
      return '';
    }
    return user.posts.map((post) => post.postName).join(',');
  }

  /**
   * 校验用户名称是否唯一
   * @param user 用户信息
   * @returns true=唯一, false=不唯一
   */
  async checkUserNameUnique(user: Partial<SysUser>): Promise<boolean> {
    const userId = user.userId || -1;
    const info = await this.userRepository.checkUserNameUnique(user.userName!);
    if (info && info.userId !== userId) {
      return false; // 不唯一
    }
    return true; // 唯一
  }

  /**
   * 校验手机号码是否唯一
   * @param user 用户信息
   * @returns true=唯一, false=不唯一
   */
  async checkPhoneUnique(user: Partial<SysUser>): Promise<boolean> {
    const userId = user.userId || -1;
    const info = await this.userRepository.checkPhoneUnique(user.phonenumber!);
    if (info && info.userId !== userId) {
      return false; // 不唯一
    }
    return true; // 唯一
  }

  /**
   * 校验email是否唯一
   * @param user 用户信息
   * @returns true=唯一, false=不唯一
   */
  async checkEmailUnique(user: Partial<SysUser>): Promise<boolean> {
    const userId = user.userId || -1;
    const info = await this.userRepository.checkEmailUnique(user.email!);
    if (info && info.userId !== userId) {
      return false; // 不唯一
    }
    return true; // 唯一
  }

  /**
   * 校验用户是否允许操作
   * @param user 用户信息
   * @throws BadRequestException 不允许操作超级管理员用户
   */
  checkUserAllowed(user: Partial<SysUser>): void {
    if (user.userId && user.userId === 1) {
      throw new BadRequestException('不允许操作超级管理员用户');
    }
  }

  /**
   * 校验用户是否有数据权限
   * @param userId 用户ID
   * @param currentUserId 当前登录用户ID
   * @throws ForbiddenException 没有权限访问用户数据
   */
  async checkUserDataScope(userId: number, currentUserId: number): Promise<void> {
    // 如果当前用户是管理员，跳过权限检查
    if (currentUserId === 1) {
      return;
    }

    // 查询用户是否在当前用户的数据权限范围内
    const [users] = await this.userRepository.selectUserList({ userId });
    if (!users || users.length === 0) {
      throw new ForbiddenException('没有权限访问用户数据！');
    }
  }

  /**
   * 新增用户信息
   * @param user 用户信息
   * @returns 结果
   */
  async insertUser(user: Partial<SysUser> & { roleIds?: number[]; postIds?: number[] }): Promise<SysUser> {
    return this.dataSource.transaction(async (manager) => {
      // 加密密码
      if (user.password) {
        user.password = await BcryptUtil.hashPassword(user.password);
      }

      // 新增用户信息
      const newUser = await this.userRepository.insertUser(user);

      // 新增用户岗位关联
      if (user.postIds && user.postIds.length > 0) {
        await this.userPostRepository.batchUserPost(newUser.userId, user.postIds);
      }

      // 新增用户角色关联
      if (user.roleIds && user.roleIds.length > 0) {
        await this.userRoleRepository.batchUserRole(newUser.userId, user.roleIds);
      }

      return newUser;
    });
  }

  /**
   * 注册用户信息
   * @param user 用户信息
   * @returns 结果
   */
  async registerUser(user: Partial<SysUser>): Promise<boolean> {
    // 加密密码
    if (user.password) {
      user.password = await BcryptUtil.hashPassword(user.password);
    }

    const newUser = await this.userRepository.insertUser(user);
    return !!newUser;
  }

  /**
   * 修改用户信息
   * @param user 用户信息
   * @returns 结果
   */
  async updateUser(user: Partial<SysUser> & { roleIds?: number[]; postIds?: number[] }): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const userId = user.userId!;

      // 删除用户与角色关联
      await this.userRoleRepository.deleteUserRoleByUserId(userId);

      // 新增用户与角色管理
      if (user.roleIds && user.roleIds.length > 0) {
        await this.userRoleRepository.batchUserRole(userId, user.roleIds);
      }

      // 删除用户与岗位关联
      await this.userPostRepository.deleteUserPostByUserId(userId);

      // 新增用户与岗位管理
      if (user.postIds && user.postIds.length > 0) {
        await this.userPostRepository.batchUserPost(userId, user.postIds);
      }

      // 更新用户信息
      return this.userRepository.updateUser(user);
    });
  }

  /**
   * 用户授权角色
   * @param userId 用户ID
   * @param roleIds 角色组
   */
  async insertUserAuth(userId: number, roleIds: number[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 删除用户与角色关联
      await this.userRoleRepository.deleteUserRoleByUserId(userId);

      // 新增用户与角色管理
      if (roleIds && roleIds.length > 0) {
        await this.userRoleRepository.batchUserRole(userId, roleIds);
      }
    });
  }

  /**
   * 修改用户状态
   * @param userId 用户ID
   * @param status 状态
   * @returns 结果
   */
  async updateUserStatus(userId: number, status: string): Promise<boolean> {
    return this.userRepository.updateUserStatus(userId, status);
  }

  /**
   * 修改用户基本信息
   * @param user 用户信息
   * @returns 结果
   */
  async updateUserProfile(user: Partial<SysUser>): Promise<boolean> {
    return this.userRepository.updateUser(user);
  }

  /**
   * 修改用户头像
   * @param userId 用户ID
   * @param avatar 头像地址
   * @returns 结果
   */
  async updateUserAvatar(userId: number, avatar: string): Promise<boolean> {
    return this.userRepository.updateUserAvatar(userId, avatar);
  }

  /**
   * 更新用户登录信息（IP和登录时间）
   * @param userId 用户ID
   * @param loginIp 登录IP地址
   * @param loginDate 登录时间
   */
  async updateLoginInfo(userId: number, loginIp: string, loginDate: Date): Promise<void> {
    await this.userRepository.updateLoginInfo(userId, loginIp, loginDate);
  }

  /**
   * 重置用户密码
   * @param userId 用户ID
   * @param password 新密码
   * @returns 结果
   */
  async resetPwd(userId: number, password: string): Promise<boolean> {
    // 加密密码
    const hashedPassword = await BcryptUtil.hashPassword(password);
    return this.userRepository.resetUserPwd(userId, hashedPassword);
  }

  /**
   * 重置用户密码（直接传入已加密密码）
   * @param userId 用户ID
   * @param password 已加密的密码
   * @returns 结果
   */
  async resetUserPwd(userId: number, password: string): Promise<boolean> {
    return this.userRepository.resetUserPwd(userId, password);
  }

  /**
   * 通过用户ID删除用户
   * @param userId 用户ID
   * @returns 结果
   */
  async deleteUserById(userId: number): Promise<boolean> {
    // 校验用户是否允许删除
    const user = await this.userRepository.selectUserById(userId);
    if (user) {
      this.checkUserAllowed(user);
    }

    return this.dataSource.transaction(async (manager) => {
      // 删除用户与角色关联
      await this.userRoleRepository.deleteUserRoleByUserId(userId);

      // 删除用户与岗位关联
      await this.userPostRepository.deleteUserPostByUserId(userId);

      // 删除用户
      return this.userRepository.deleteUserById(userId);
    });
  }

  /**
   * 批量删除用户信息
   * @param userIds 需要删除的用户ID
   * @returns 结果
   */
  async deleteUserByIds(userIds: number[]): Promise<boolean> {
    // 校验是否包含超级管理员
    for (const userId of userIds) {
      const user = await this.userRepository.selectUserById(userId);
      if (user) {
        this.checkUserAllowed(user);
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // 删除用户与角色关联
      await this.userRoleRepository.deleteUserRole(userIds);

      // 删除用户与岗位关联
      await this.userPostRepository.deleteUserPost(userIds);

      // 批量删除用户
      return this.userRepository.deleteUserByIds(userIds);
    });
  }

  /**
   * 导入用户数据
   * @param userList 用户数据列表
   * @param isUpdateSupport 是否更新支持
   * @param operName 操作用户
   * @returns 结果消息
   */
  async importUser(
    userList: Partial<SysUser>[],
    isUpdateSupport: boolean,
    operName: string,
  ): Promise<string> {
    if (!userList || userList.length === 0) {
      throw new BadRequestException('导入用户数据不能为空！');
    }

    let successNum = 0;
    let failureNum = 0;
    const failureMsg: string[] = [];

    for (const user of userList) {
      try {
        // 验证用户名是否存在
        const existUser = await this.userRepository.checkUserNameUnique(user.userName!);

        if (!existUser) {
          // 新增用户
          user.password = await BcryptUtil.hashPassword(user.password || '123456');
          user.createBy = operName;
          await this.userRepository.insertUser(user);
          successNum++;
        } else if (isUpdateSupport) {
          // 更新用户
          user.userId = existUser.userId;
          user.updateBy = operName;
          await this.userRepository.updateUser(user);
          successNum++;
        } else {
          failureNum++;
          failureMsg.push(`用户 ${user.userName} 已存在`);
        }
      } catch (error) {
        failureNum++;
        failureMsg.push(`用户 ${user.userName} 导入失败：${error.message}`);
      }
    }

    if (failureNum > 0) {
      return `导入成功 ${successNum} 条，失败 ${failureNum} 条。${failureMsg.join('; ')}`;
    }

    return `恭喜您，数据已全部导入成功！共 ${successNum} 条`;
  }
}

