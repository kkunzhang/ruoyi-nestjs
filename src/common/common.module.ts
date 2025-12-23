import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { CaptchaService } from './services/captcha.service';
import { redisConfig } from '../config/redis.config';

/**
 * Common 模块
 * 提供全局共享的服务（Redis、Captcha等）
 */
@Global()
@Module({
  imports: [ConfigModule],
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
  ],
  exports: ['REDIS_CLIENT', CaptchaService],
})
export class CommonModule {}

