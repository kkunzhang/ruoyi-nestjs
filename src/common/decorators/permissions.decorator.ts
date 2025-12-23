import { SetMetadata } from '@nestjs/common';

/**
 * 权限装饰器
 * 对应 Java 的 @PreAuthorize("@ss.hasPermi('system:user:list')")
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
