import { Module } from '@nestjs/common';
import { MapperModule } from '../mapper/mapper.module';
import { UserService } from './user.service';

/**
 * Service 模块
 * 提供所有业务逻辑服务
 */
@Module({
  imports: [MapperModule], // 导入 Mapper 模块以使用 Repository
  providers: [UserService],
  exports: [UserService],
})
export class ServiceModule {}

