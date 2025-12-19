import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // Prisma 数据库模块
        PrismaModule,
        // 后续添加业务模块
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }


