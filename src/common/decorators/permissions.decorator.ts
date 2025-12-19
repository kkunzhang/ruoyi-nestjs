import { SetMetadata } from '@nestjs/common';

/**
 * 权限装饰器
 * 用于标记接口需要的权限标识
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);


