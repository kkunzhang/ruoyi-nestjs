import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { BcryptUtil } from '../common/utils/bcrypt.util';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { MenuRepository } from '../mapper/menu.repository';

/**
 * 认证服务
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly menuRepository: MenuRepository,
  ) {}

  /**
   * 用户登录
   * @param userName 用户名
   * @param password 密码
   * @returns Token 信息
   */
  async login(userName: string, password: string) {
    // 查询用户
    const user = await this.userService.selectUserByUserName(userName);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status === '1') {
      throw new UnauthorizedException('用户已被停用');
    }

    if (user.delFlag === '2') {
      throw new UnauthorizedException('用户已被删除');
    }

    // 验证密码
    const isPasswordValid = await BcryptUtil.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息
    await this.userService.updateLoginInfo(
      user.userId,
      '127.0.0.1', // TODO: 获取真实IP
      new Date(),
    );

    // 获取用户权限列表
    let permissions: string[] = [];
    if (user.userId === 1) {
      // 超级管理员拥有所有权限
      permissions = ['*:*:*'];
    } else {
      // 从数据库加载用户权限
      permissions = await this.menuRepository.selectMenuPermsByUserId(user.userId);
    }

    // 生成 Token
    const payload: JwtPayload = {
      userId: user.userId,
      userName: user.userName,
      deptId: user.deptId,
      roleIds: user.roles?.map((role) => role.roleId) || [],
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 7 * 24 * 60 * 60, // 7天（秒）
      user: {
        userId: user.userId,
        userName: user.userName,
        nickName: user.nickName,
        avatar: user.avatar,
        email: user.email,
        phonenumber: user.phonenumber,
        sex: user.sex,
        deptId: user.deptId,
        roles: user.roles,
      },
    };
  }

  /**
   * 获取用户信息
   * @param userId 用户ID
   * @returns 用户信息
   */
  async getUserInfo(userId: number) {
    const user = await this.userService.selectUserById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 获取用户权限列表
    let permissions: string[] = [];
    if (userId === 1) {
      // 超级管理员拥有所有权限
      permissions = ['*:*:*'];
    } else {
      // 从数据库加载用户权限
      permissions = await this.menuRepository.selectMenuPermsByUserId(userId);
    }

    return {
      user: {
        userId: user.userId,
        userName: user.userName,
        nickName: user.nickName,
        avatar: user.avatar,
        email: user.email,
        phonenumber: user.phonenumber,
        sex: user.sex,
        deptId: user.deptId,
        roles: user.roles,
        posts: user.posts,
      },
      roles: user.roles?.map((role) => role.roleKey) || [],
      permissions,
    };
  }

  /**
   * 退出登录
   * @param userId 用户ID
   */
  async logout(userId: number) {
    // TODO: 将 Token 加入黑名单或清除 Redis 缓存
    return true;
  }
}

