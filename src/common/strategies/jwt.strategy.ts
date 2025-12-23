import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../services/token.service';
import { LoginUser } from '../interfaces/login-user.interface';

/**
 * JWT 策略（若依版本）
 * 从 Redis 加载完整的 LoginUser
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key-here',
    });
  }

  /**
   * 验证 JWT 并从 Redis 加载 LoginUser
   * @param payload JWT Payload（只包含 uuid）
   * @returns LoginUser
   */
  async validate(payload: any): Promise<LoginUser> {
    // 从 JWT 中获取 uuid（若依的 login_user_key）
    const uuid = payload.login_user_key || payload.uuid;
    if (!uuid) {
      throw new UnauthorizedException('无效的 Token');
    }

    // 从 Redis 加载完整的 LoginUser
    const loginUser = await this.tokenService.getLoginUser(uuid);
    if (!loginUser) {
      throw new UnauthorizedException('用户信息已过期，请重新登录');
    }

    // 验证并刷新 Token
    await this.tokenService.verifyToken(loginUser);

    // 返回 LoginUser（会被注入到 request.user）
    return loginUser;
  }
}
