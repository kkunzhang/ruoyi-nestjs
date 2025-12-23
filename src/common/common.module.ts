import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { CaptchaService } from './services/captcha.service';
import { TokenService } from './services/token.service';
import { redisConfig } from '../config/redis.config';

/**
 * Common 模块
 * 提供全局共享的服务（Redis、Captcha、Token等）
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    // JWT 模块（TokenService 需要）
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30m' }, // 30分钟（与若依一致）
      }),
    }),
  ],
  providers: [
    // Redis 客户端
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const config = redisConfig.useFactory(configService);
        const redis = new Redis(config);

        redis.on('error', (err) => {
          console.error('Redis 连接错误:', err);
        });

        redis.on('connect', () => {
          console.log('✅ Redis 连接成功');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    // 验证码服务
    CaptchaService,
    // Token 服务
    TokenService,
  ],
  exports: ['REDIS_CLIENT', CaptchaService, TokenService],
})
export class CommonModule {}

