import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { DATA_SCOPE_KEY, DataScopeOptions } from '../decorators/data-scope.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';

/**
 * 数据权限拦截器
 * 对应 Java 的 DataScopeAspect
 * 
 * 数据权限规则：
 * 1 - 全部数据权限
 * 2 - 自定数据权限
 * 3 - 本部门数据权限
 * 4 - 本部门及以下数据权限
 * 5 - 仅本人数据权限
 */
@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取数据权限元数据
    const dataScopeOptions = this.reflector.getAllAndOverride<DataScopeOptions>(
      DATA_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置数据权限，直接返回
    if (!dataScopeOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    // 超级管理员不过滤数据权限
    if (!user || user.userId === 1) {
      return next.handle();
    }

    // 构建数据权限SQL条件
    const dataScopeSQL = this.buildDataScopeSQL(user, dataScopeOptions);
    
    // 将数据权限SQL添加到请求中，供Repository使用
    request.dataScopeSQL = dataScopeSQL;

    return next.handle();
  }

  /**
   * 构建数据权限SQL条件
   */
  private buildDataScopeSQL(user: RequestUser, options: DataScopeOptions): string {
    const deptAlias = options.deptAlias || 'd';
    const userAlias = options.userAlias || 'u';
    
    const conditions: string[] = [];

    // TODO: 从数据库获取用户的角色数据权限
    // 这里简化处理，实际应该查询用户的角色及其数据权限
    const dataScope: number = 1; // 假设默认为全部数据权限

    switch (dataScope) {
      case 1: // 全部数据权限
        // 不添加条件
        break;
      case 2: // 自定数据权限
        // TODO: 查询角色的自定义部门权限
        conditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_role_dept WHERE role_id IN (${user.roleIds?.join(',') || 0}))`);
        break;
      case 3: // 本部门数据权限
        conditions.push(`${deptAlias}.dept_id = ${user.deptId || 0}`);
        break;
      case 4: // 本部门及以下数据权限
        conditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_dept WHERE dept_id = ${user.deptId || 0} OR FIND_IN_SET(${user.deptId || 0}, ancestors))`);
        break;
      case 5: // 仅本人数据权限
        conditions.push(`${userAlias}.user_id = ${user.userId}`);
        break;
      default:
        break;
    }

    return conditions.join(' OR ');
  }
}

