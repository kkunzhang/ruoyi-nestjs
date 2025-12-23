import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // TypeORM 数据库模块
        TypeOrmModule.forRoot(typeOrmConfig),
        // 后续添加业务模块
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }



