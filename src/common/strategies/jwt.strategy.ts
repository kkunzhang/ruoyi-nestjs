import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, RequestUser } from '../interfaces/jwt-payload.interface';

/**
 * JWT 策略
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key-here',
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('Token 无效');
    }

    return {
      userId: payload.userId,
      userName: payload.userName,
      deptId: payload.deptId,
      roleIds: payload.roleIds,
      permissions: payload.permissions,
    };
  }
}

