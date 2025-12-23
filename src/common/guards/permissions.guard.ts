import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';

/**
 * 权限守卫
 * 对应 Java 的 @PreAuthorize
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取接口所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置权限要求，直接通过
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    // 超级管理员拥有所有权限
    if (user.userId === 1) {
      return true;
    }

    // 检查用户是否拥有所需权限
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
