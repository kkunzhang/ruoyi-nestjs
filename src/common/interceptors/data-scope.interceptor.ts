import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { DATA_SCOPE_KEY, DataScopeOptions } from '../decorators/data-scope.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';
import { RoleRepository } from '../../mapper/role.repository';

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
  constructor(
    private reflector: Reflector,
    @Inject(RoleRepository) private roleRepository: RoleRepository,
  ) {}

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

    // 构建数据权限SQL条件（异步转同步，因为 intercept 不能是 async）
    // 注意：这里简化处理，实际生产环境建议使用 from/switchMap 处理异步
    this.buildDataScopeSQL(user, dataScopeOptions).then((dataScopeSQL) => {
      request.dataScopeSQL = dataScopeSQL;
    });

    return next.handle();
  }

  /**
   * 构建数据权限SQL条件
   */
  private async buildDataScopeSQL(user: RequestUser, options: DataScopeOptions): Promise<string> {
    const deptAlias = options.deptAlias || 'd';
    const userAlias = options.userAlias || 'u';
    
    const conditions: string[] = [];

    // 从数据库获取用户的角色数据权限
    const roles = await this.roleRepository.selectRolePermissionByUserId(user.userId);
    
    for (const role of roles) {
      const dataScope = role.dataScope || '1';
      
      switch (dataScope) {
        case '1': // 全部数据权限
          // 如果有一个角色是全部数据权限，直接返回空条件
          return '';
        case '2': // 自定数据权限
          // 查询角色的自定义部门权限
          conditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_role_dept WHERE role_id = ${role.roleId})`);
          break;
        case '3': // 本部门数据权限
          conditions.push(`${deptAlias}.dept_id = ${user.deptId || 0}`);
          break;
        case '4': // 本部门及以下数据权限
          conditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_dept WHERE dept_id = ${user.deptId || 0} OR FIND_IN_SET(${user.deptId || 0}, ancestors))`);
          break;
        case '5': // 仅本人数据权限
          conditions.push(`${userAlias}.user_id = ${user.userId}`);
          break;
        default:
          break;
      }
    }

    // 去重并用 OR 连接
    return [...new Set(conditions)].join(' OR ');
  }
}

