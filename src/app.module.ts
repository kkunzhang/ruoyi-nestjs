import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { MapperModule } from './mapper';
import { ServiceModule } from './service';
import { ControllerModule } from './controller';

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // TypeORM 数据库模块
        TypeOrmModule.forRoot(typeOrmConfig),
        // Mapper 数据访问层模块
        MapperModule,
        // Service 业务逻辑层模块
        ServiceModule,
        // Controller 接口层模块
        ControllerModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }



