import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { CommonModule } from './common/common.module';
import { MapperModule } from './mapper';
import { ServiceModule } from './service';
import { ControllerModule } from './controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { LogInterceptor } from './common/interceptors/log.interceptor';
import { JwtStrategy } from './common/strategies/jwt.strategy';

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // TypeORM 数据库模块
        TypeOrmModule.forRoot(typeOrmConfig),
        // Common 通用模块（Redis、Captcha等）
        CommonModule,
        // Mapper 数据访问层模块
        MapperModule,
        // Service 业务逻辑层模块
        ServiceModule,
        // Controller 接口层模块
        ControllerModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        // 全局 JWT 认证守卫
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        // 全局权限守卫
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
        // 全局操作日志拦截器
        {
            provide: APP_INTERCEPTOR,
            useClass: LogInterceptor,
        },
    ],
})
export class AppModule { }



