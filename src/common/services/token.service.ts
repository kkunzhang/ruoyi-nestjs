import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { LoginUser } from '../interfaces/login-user.interface';
import { randomUUID } from 'crypto';

/**
 * Token 管理服务
 * 完全模仿若依的 TokenService
 * 
 * 核心逻辑：
 * 1. JWT Token 只包含 uuid
 * 2. 完整的 LoginUser 存储在 Redis
 * 3. 每次请求从 Redis 加载用户信息
 * 4. 注销时删除 Redis 中的用户信息
 */
@Injectable()
export class TokenService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 登录Token Redis Key 前缀（与若依一致）
   */
  private readonly LOGIN_TOKEN_KEY = 'login_tokens:';

  /**
   * JWT 中的用户标识 Key（与若依一致）
   */
  private readonly LOGIN_USER_KEY = 'login_user_key';

  /**
   * Token 有效期（分钟）
   */
  private readonly EXPIRE_TIME = 30; // 30分钟

  /**
   * 毫秒
   */
  private readonly MILLIS_SECOND = 1000;
  private readonly MILLIS_MINUTE = 60 * this.MILLIS_SECOND;
  private readonly MILLIS_MINUTE_TWENTY = 20 * 60 * 1000;

  /**
   * 创建令牌
   * @param loginUser 登录用户信息
   * @returns JWT Token
   */
  createToken(loginUser: LoginUser): string {
    // 生成 UUID 作为用户唯一标识
    const token = this.generateUUID();
    loginUser.token = token;

    // 设置登录时间和过期时间
    this.refreshToken(loginUser);

    // 生成 JWT Token（只包含 uuid）
    const payload = {
      [this.LOGIN_USER_KEY]: token,
      userName: loginUser.user.userName,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * 获取登录用户信息（从 Redis）
   * @param uuid 用户唯一标识
   * @returns 登录用户信息，不存在则返回 null
   */
  async getLoginUser(uuid: string): Promise<LoginUser | null> {
    const userKey = this.getTokenKey(uuid);
    const userJson = await this.redis.get(userKey);
    
    if (!userJson) {
      return null;
    }

    try {
      const loginUser: LoginUser = JSON.parse(userJson);
      return loginUser;
    } catch (error) {
      console.error('解析 LoginUser 失败:', error);
      return null;
    }
  }

  /**
   * 设置用户身份信息（更新 Redis）
   * @param loginUser 登录用户信息
   */
  async setLoginUser(loginUser: LoginUser): Promise<void> {
    if (loginUser && loginUser.token) {
      await this.refreshToken(loginUser);
    }
  }

  /**
   * 删除用户身份信息（注销）
   * @param uuid 用户唯一标识
   */
  async delLoginUser(uuid: string): Promise<void> {
    if (uuid) {
      const userKey = this.getTokenKey(uuid);
      await this.redis.del(userKey);
    }
  }

  /**
   * 验证令牌有效期，相差不足20分钟，自动刷新缓存
   * @param loginUser 登录用户信息
   */
  async verifyToken(loginUser: LoginUser): Promise<void> {
    const expireTime = loginUser.expireTime;
    const currentTime = Date.now();

    // 如果剩余时间不足 20 分钟，自动刷新
    if (expireTime - currentTime <= this.MILLIS_MINUTE_TWENTY) {
      await this.refreshToken(loginUser);
    }
  }

  /**
   * 刷新令牌有效期
   * @param loginUser 登录用户信息
   */
  async refreshToken(loginUser: LoginUser): Promise<void> {
    loginUser.loginTime = Date.now();
    loginUser.expireTime = loginUser.loginTime + this.EXPIRE_TIME * this.MILLIS_MINUTE;

    // 根据 uuid 将 loginUser 缓存到 Redis
    const userKey = this.getTokenKey(loginUser.token);
    const userJson = JSON.stringify(loginUser);
    
    // 设置过期时间（转换为秒）
    await this.redis.set(userKey, userJson, 'EX', this.EXPIRE_TIME * 60);
  }

  /**
   * 从 JWT Token 中解析 uuid
   * @param jwtToken JWT Token
   * @returns uuid，解析失败返回 null
   */
  getUuidFromToken(jwtToken: string): string | null {
    try {
      const payload = this.jwtService.decode(jwtToken) as any;
      return payload?.[this.LOGIN_USER_KEY] || null;
    } catch (error) {
      console.error('解析 JWT Token 失败:', error);
      return null;
    }
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return randomUUID().replace(/-/g, '');
  }

  /**
   * 获取 Redis Key
   * @param uuid 用户唯一标识
   */
  private getTokenKey(uuid: string): string {
    return this.LOGIN_TOKEN_KEY + uuid;
  }

  /**
   * 获取客户端真实 IP
   * @param request Express Request 对象
   */
  getClientIp(request: any): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return (xForwardedFor as string).split(',')[0].trim();
    }

    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return xRealIp as string;
    }

    return request.ip || request.socket?.remoteAddress || '127.0.0.1';
  }

  /**
   * 获取用户代理信息
   * @param request Express Request 对象
   */
  getUserAgent(request: any): { browser: string; os: string } {
    const userAgent = request.headers['user-agent'] || '';
    
    // 简单解析（实际项目可使用 ua-parser-js 等库）
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { browser, os };
  }

  /**
   * 更新 LoginUser 中的权限列表（权限刷新）
   * @param uuid 用户唯一标识
   * @param permissions 新的权限列表
   */
  async updatePermissions(uuid: string, permissions: string[]): Promise<void> {
    const loginUser = await this.getLoginUser(uuid);
    if (!loginUser) {
      return; // 用户不存在或已过期，无需更新
    }

    // 更新权限
    loginUser.permissions = permissions;

    // 保存回 Redis（同时刷新过期时间）
    await this.refreshToken(loginUser);
  }

  /**
   * 批量更新多个用户的权限（角色修改后刷新）
   * @param userIds 用户ID列表
   * @param getPermissionsFn 获取权限的函数
   */
  async batchUpdateUsersPermissions(
    userIds: number[],
    getPermissionsFn: (userId: number) => Promise<string[]>,
  ): Promise<void> {
    // 获取所有在线用户的 LoginUser Key
    const pattern = this.LOGIN_TOKEN_KEY + '*';
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const loginUserJson = await this.redis.get(key);
      if (!loginUserJson) continue;

      try {
        const loginUser: LoginUser = JSON.parse(loginUserJson);

        // 如果该用户在受影响的用户列表中，刷新权限
        if (userIds.includes(loginUser.userId)) {
          const newPermissions = await getPermissionsFn(loginUser.userId);
          loginUser.permissions = newPermissions;

          // 保存回 Redis
          const userKey = this.getTokenKey(loginUser.token);
          const userJson = JSON.stringify(loginUser);
          await this.redis.set(userKey, userJson, 'EX', this.EXPIRE_TIME * 60);
        }
      } catch (error) {
        console.error('更新用户权限失败:', error);
      }
    }
  }

  /**
   * 刷新指定角色下所有在线用户的权限
   * @param roleId 角色ID
   * @param getUserIdsByRoleFn 获取角色下用户ID的函数
   * @param getPermissionsFn 获取权限的函数
   */
  async refreshRoleUsersPermissions(
    roleId: number,
    getUserIdsByRoleFn: (roleId: number) => Promise<number[]>,
    getPermissionsFn: (userId: number) => Promise<string[]>,
  ): Promise<void> {
    // 获取该角色下的所有用户ID
    const userIds = await getUserIdsByRoleFn(roleId);

    if (userIds.length === 0) {
      return; // 没有用户，无需更新
    }

    // 批量更新这些用户的权限
    await this.batchUpdateUsersPermissions(userIds, getPermissionsFn);
  }
}

