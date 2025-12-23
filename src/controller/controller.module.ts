import { Module } from '@nestjs/common';
import { ServiceModule } from '../service/service.module';
import { UserController } from './user.controller';
import { AuthController } from './auth.controller';
import { RoleController } from './role.controller';

/**
 * Controller 模块
 * 提供所有 HTTP 接口
 */
@Module({
  imports: [ServiceModule], // 导入 Service 模块
  controllers: [UserController, AuthController, RoleController],
})
export class ControllerModule {}

