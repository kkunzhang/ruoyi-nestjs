import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MapperModule } from '../mapper/mapper.module';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

/**
 * Service 模块
 * 提供所有业务逻辑服务
 */
@Module({
  imports: [
    MapperModule, // 导入 Mapper 模块以使用 Repository
    // JWT 模块
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-here',
        signOptions: {
          expiresIn: '7d', // Token 过期时间
        },
      }),
    }),
  ],
  providers: [UserService, AuthService],
  exports: [UserService, AuthService],
})
export class ServiceModule {}

