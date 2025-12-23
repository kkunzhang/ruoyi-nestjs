import { SetMetadata } from '@nestjs/common';

/**
 * 数据权限装饰器
 * 对应 Java 的 @DataScope
 */
export const DATA_SCOPE_KEY = 'dataScope';

export interface DataScopeOptions {
  deptAlias?: string; // 部门表别名
  userAlias?: string; // 用户表别名
}

export const DataScope = (options: DataScopeOptions = {}) =>
  SetMetadata(DATA_SCOPE_KEY, options);

