import { SetMetadata } from '@nestjs/common';

/**
 * 公开接口装饰器
 * 标记不需要 JWT 认证的接口
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);


