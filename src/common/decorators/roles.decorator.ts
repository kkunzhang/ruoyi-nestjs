import { SetMetadata } from '@nestjs/common';

/**
 * 角色装饰器
 */
export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);
