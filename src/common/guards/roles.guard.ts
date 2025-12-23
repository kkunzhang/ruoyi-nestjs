import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';

/**
 * 角色守卫
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取接口所需角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置角色要求，直接通过
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    // 超级管理员拥有所有角色
    if (user.userId === 1) {
      return true;
    }

    // 检查用户是否拥有所需角色
    const userRoleIds = user.roleIds || [];
    
    // TODO: 这里需要根据角色名称查询角色ID，暂时简化处理
    // const hasRole = requiredRoles.some((role) => userRoleIds.includes(role));

    // 暂时允许通过，等待完善角色查询逻辑
    return true;
  }
}
