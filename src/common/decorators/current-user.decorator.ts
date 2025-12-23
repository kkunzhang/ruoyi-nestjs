import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LoginUser } from '../interfaces/login-user.interface';

/**
 * 获取当前登录用户装饰器（若依版本）
 * 从 request.user 中获取 LoginUser
 */
export const CurrentUser = createParamDecorator(
  (data: keyof LoginUser | string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const loginUser: LoginUser = request.user;

    if (!loginUser) {
      return null;
    }

    // 如果指定了字段名，返回该字段的值
    if (data) {
      // 支持深层访问，如 'user.userName'
      if (data.includes('.')) {
        const keys = data.split('.');
        let value: any = loginUser;
        for (const key of keys) {
          value = value?.[key];
        }
        return value;
      }
      return loginUser[data];
    }

    // 否则返回完整的 LoginUser
    return loginUser;
  },
);
