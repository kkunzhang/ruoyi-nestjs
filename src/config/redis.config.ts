import { ConfigService } from '@nestjs/config';

/**
 * Redis 配置
 */
export const redisConfig = {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: configService.get<number>('REDIS_PORT') || 6379,
        db: configService.get<number>('REDIS_DB') || 0,
        password: configService.get<string>('REDIS_PASSWORD') || undefined,
        retryStrategy: (times: number) => {
            if (times > 3) {
                console.error('Redis connection failed after 3 retries');
                return null; // 停止重试
            }
            return Math.min(times * 50, 2000); // 重试间隔
        },
    }),
};

