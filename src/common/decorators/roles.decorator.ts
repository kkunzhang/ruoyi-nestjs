import { SetMetadata } from '@nestjs/common';

/**
 * 角色装饰器
 * 用于标记接口需要的角色权限
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);



