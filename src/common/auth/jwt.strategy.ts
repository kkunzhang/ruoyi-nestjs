import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 策略
 * 用于验证 JWT Token
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        });
    }

    async validate(payload: any) {
        if (!payload) {
            throw new UnauthorizedException('Token 无效');
        }

        return {
            userId: payload.sub,
            username: payload.username,
            roles: payload.roles || [],
            permissions: payload.permissions || [],
        };
    }
}


