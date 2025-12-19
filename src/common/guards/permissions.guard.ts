import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * 权限守卫
 * 用于检查用户是否拥有所需权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (!requiredPermissions) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('用户未登录');
    }
    
    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions?.includes(permission),
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }
    
    return true;
  }
}


