import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { BcryptUtil } from '../common/utils/bcrypt.util';
import { MenuRepository } from '../mapper/menu.repository';
import { TokenService } from '../common/services/token.service';
import { LoginUser } from '../common/interfaces/login-user.interface';

/**
 * 认证服务（若依版本）
 * 使用 Redis 存储用户信息
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly menuRepository: MenuRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * 用户登录（若依版本）
   * @param userName 用户名
   * @param password 密码
   * @param request Express Request（用于获取 IP 和 User-Agent）
   * @returns Token 信息
   */
  async login(userName: string, password: string, request?: any) {
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

    // 获取客户端IP和User-Agent
    const ipaddr = request ? this.tokenService.getClientIp(request) : '127.0.0.1';
    const { browser, os } = request ? this.tokenService.getUserAgent(request) : { browser: 'Unknown', os: 'Unknown' };

    // 更新登录信息
    await this.userService.updateLoginInfo(user.userId, ipaddr, new Date());

    // 获取用户权限列表
    let permissions: string[] = [];
    if (user.userId === 1) {
      // 超级管理员拥有所有权限
      permissions = ['*:*:*'];
    } else {
      // 从数据库加载用户权限
      permissions = await this.menuRepository.selectMenuPermsByUserId(user.userId);
    }

    // 创建 LoginUser 对象（完全模仿若依）
    const loginUser: LoginUser = {
      userId: user.userId,
      deptId: user.deptId || undefined,
      token: '', // TokenService 会自动生成
      loginTime: Date.now(),
      expireTime: 0, // TokenService 会自动设置
      ipaddr,
      loginLocation: '内网IP', // 简化处理，若依使用 IP地址库
      browser,
      os,
      permissions,
      user,
    };

    // 创建 JWT Token（只包含 uuid）
    const accessToken = this.tokenService.createToken(loginUser);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 30 * 60, // 30分钟（秒）
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
   * 获取用户信息（从 Redis 中的 LoginUser）
   * @param loginUser 登录用户信息
   * @returns 用户信息
   */
  async getUserInfo(loginUser: LoginUser) {
    const user = loginUser.user;
    if (!user) {
      throw new UnauthorizedException('用户不存在');
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
      permissions: loginUser.permissions,
    };
  }

  /**
   * 退出登录（删除 Redis 中的用户信息）
   * @param uuid 用户唯一标识
   */
  async logout(uuid: string): Promise<void> {
    await this.tokenService.delLoginUser(uuid);
  }

  /**
   * 从 JWT Token 获取 LoginUser
   * @param jwtToken JWT Token
   * @returns LoginUser，不存在则返回 null
   */
  async getLoginUserFromToken(jwtToken: string): Promise<LoginUser | null> {
    const uuid = this.tokenService.getUuidFromToken(jwtToken);
    if (!uuid) {
      return null;
    }

    const loginUser = await this.tokenService.getLoginUser(uuid);
    if (!loginUser) {
      return null;
    }

    // 验证并刷新 Token（若依逻辑）
    await this.tokenService.verifyToken(loginUser);

    return loginUser;
  }
}

