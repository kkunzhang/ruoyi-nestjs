# 后续优化 TODO 清单

## 📋 待优化项目

### 🔴 高优先级

#### 1. 修复数据权限拦截器异步问题
**文件**: `src/common/interceptors/data-scope.interceptor.ts`

**问题**:
```typescript
// ❌ 当前实现：Promise 可能未完成就继续执行
this.buildDataScopeSQL(user, dataScopeOptions).then((dataScopeSQL) => {
  request.dataScopeSQL = dataScopeSQL;
});
return next.handle(); // 可能在 SQL 构建完成前就执行
```

**解决方案**:
```typescript
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// ✅ 正确实现：确保异步完成后再继续
return from(this.buildDataScopeSQL(user, dataScopeOptions)).pipe(
  switchMap((dataScopeSQL) => {
    request.dataScopeSQL = dataScopeSQL;
    return next.handle();
  })
);
```

**影响**: 当前实现可能导致数据权限过滤失效

---

#### 2. ~~验证码改用 Redis 存储~~ ✅ 已完成
**文件**: ~~`src/common/utils/captcha.util.ts`~~ → `src/common/services/captcha.service.ts`

**状态**: ✅ 已完成（2025-12-23）

**完成内容**:
- ✅ 安装 `ioredis` 依赖
- ✅ 创建 `src/config/redis.config.ts`
- ✅ 创建 `src/common/services/captcha.service.ts`
- ✅ 创建 `src/common/common.module.ts`
- ✅ 更新 `AuthController` 使用 `CaptchaService`
- ✅ Redis Key 与若依保持一致：`captcha_codes:{uuid}`
- ✅ 过期时间：120秒（2分钟）
- ✅ 支持一次性使用

**文档**: [验证码Redis存储完成.md](../completion/验证码Redis存储完成.md)

**原因**:
- 若依原版使用 Redis 存储验证码
- 内存存储不支持多实例部署
- 重启服务会丢失所有验证码

**实现步骤**:

1. **安装依赖**:
```bash
npm install ioredis @nestjs/redis
```

2. **配置 Redis**:
```typescript
// .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

// src/config/redis.config.ts
import { RedisModuleOptions } from '@nestjs/redis';

export const redisConfig: RedisModuleOptions = {
  config: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
  },
};
```

3. **创建 CaptchaService**:
```typescript
// src/common/services/captcha.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CaptchaService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  private readonly CAPTCHA_PREFIX = 'captcha_codes:';
  private readonly EXPIRE_TIME = 120; // 2分钟

  async saveCaptcha(uuid: string, code: string): Promise<void> {
    const key = this.CAPTCHA_PREFIX + uuid;
    await this.redis.set(key, code.toLowerCase(), 'EX', this.EXPIRE_TIME);
  }

  async verifyCaptcha(uuid: string, code: string): Promise<boolean> {
    const key = this.CAPTCHA_PREFIX + uuid;
    const saved = await this.redis.get(key);
    
    if (!saved) return false;
    
    await this.redis.del(key); // 一次性使用
    return saved === code.toLowerCase();
  }

  async deleteCaptcha(uuid: string): Promise<void> {
    await this.redis.del(this.CAPTCHA_PREFIX + uuid);
  }
}
```

4. **在 AppModule 中注册**:
```typescript
import { RedisModule } from '@nestjs/redis';

@Module({
  imports: [
    RedisModule.forRoot(redisConfig),
    // ...
  ],
})
```

5. **更新 AuthController**:
```typescript
// 替换 CaptchaUtil 为 CaptchaService
constructor(
  private readonly authService: AuthService,
  private readonly captchaService: CaptchaService,
) {}

// 使用 await
await this.captchaService.saveCaptcha(uuid, code);
const isValid = await this.captchaService.verifyCaptcha(uuid, code);
```

---

### 🟡 中优先级

#### 3. ~~登录 Token 管理 - 实现注销功能~~ ✅ 已完成
**文件**: ~~无~~ → `src/common/services/token.service.ts`

**状态**: ✅ 已完成（2025-12-23）

**完成内容**:
- ✅ 创建 `LoginUser` 接口（对应若依）
- ✅ 创建 `TokenService`（完全模仿若依）
- ✅ 更新 `AuthService` 使用 `TokenService`
- ✅ 更新 `JwtStrategy` 从 Redis 加载用户
- ✅ 实现注销功能（删除 Redis 数据）
- ✅ JWT Token 只包含 UUID
- ✅ 完整的 LoginUser 存储在 Redis
- ✅ 自动刷新 Token（剩余时间 < 20分钟）
- ✅ 支持服务端主动踢人

**文档**: [Token管理-若依版本实现完成.md](../completion/Token管理-若依版本实现完成.md)

---

#### 4. 实现 Google Kaptcha 风格验证码
**文件**: `src/common/services/captcha.service.ts`

**若依原版特性**:
- 支持 `math` 类型（数学运算：`1+2=?`）
- 支持 `char` 类型（字符验证码：`abcd`）
- 使用 Google Kaptcha 库生成
- 返回 Base64 编码的 JPG 图片

**当前实现**:
- 仅支持 4 位数字
- SVG 格式图片
- 简单的随机颜色和旋转

**改进方案**:
```bash
# 安装 canvas（用于生成图片）
npm install canvas
```

```typescript
import { createCanvas } from 'canvas';

export class CaptchaService {
  /**
   * 生成数学运算验证码
   */
  generateMathCaptcha(): { text: string, answer: string } {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer: number;
    switch (operator) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '*': answer = num1 * num2; break;
    }
    
    return {
      text: `${num1} ${operator} ${num2} = ?`,
      answer: answer.toString(),
    };
  }

  /**
   * 生成 JPG 图片（类似 Kaptcha）
   */
  generateImage(text: string): Buffer {
    const canvas = createCanvas(120, 40);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 120, 40);
    
    // 干扰线
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = this.randomColor();
      ctx.beginPath();
      ctx.moveTo(Math.random() * 120, Math.random() * 40);
      ctx.lineTo(Math.random() * 120, Math.random() * 40);
      ctx.stroke();
    }
    
    // 文字
    ctx.font = '24px Arial';
    ctx.textBaseline = 'middle';
    const charWidth = 120 / text.length;
    for (let i = 0; i < text.length; i++) {
      ctx.fillStyle = this.randomColor();
      ctx.save();
      const x = charWidth * i + charWidth / 2;
      const y = 20;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    
    return canvas.toBuffer('image/jpeg');
  }

  private randomColor(): string {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgb(${r},${g},${b})`;
  }
}
```

---

#### 4. 完善 MenuRepository 的权限查询 SQL
**文件**: `src/mapper/menu.repository.ts`

**当前状态**: 返回空数组（TODO）

**需要实现的 SQL**:
```typescript
async selectMenuPermsByUserId(userId: number): Promise<string[]> {
  const query = this.createQueryBuilder('m')
    .select('DISTINCT m.perms', 'perms')
    .leftJoin('sys_role_menu', 'rm', 'm.menu_id = rm.menu_id')
    .leftJoin('sys_user_role', 'ur', 'ur.role_id = rm.role_id')
    .leftJoin('sys_role', 'r', 'r.role_id = ur.role_id')
    .where('ur.user_id = :userId', { userId })
    .andWhere('m.status = :status', { status: '0' })
    .andWhere('r.status = :status', { status: '0' })
    .andWhere('m.perms IS NOT NULL')
    .andWhere('m.perms != :empty', { empty: '' });

  const results = await query.getRawMany();
  return results.map(row => row.perms).filter(Boolean);
}
```

---

#### 5. 完善 DataScopeInterceptor 的自定义部门权限查询
**文件**: `src/common/interceptors/data-scope.interceptor.ts`

**当前状态**: `case '2'` 的自定义部门权限未实现

**需要创建**: `src/mapper/role-dept.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RoleDeptRepository extends Repository<any> {
  constructor(private dataSource: DataSource) {
    super({} as any, dataSource.createEntityManager());
  }

  /**
   * 查询角色的自定义部门权限
   */
  async selectDeptIdsByRoleId(roleId: number): Promise<number[]> {
    const results = await this.dataSource.query(
      'SELECT dept_id FROM sys_role_dept WHERE role_id = ?',
      [roleId]
    );
    return results.map(row => row.dept_id);
  }
}
```

**更新 DataScopeInterceptor**:
```typescript
case '2': // 自定数据权限
  const deptIds = await this.roleDeptRepository.selectDeptIdsByRoleId(role.roleId);
  if (deptIds.length > 0) {
    conditions.push(`${deptAlias}.dept_id IN (${deptIds.join(',')})`);
  }
  break;
```

---

### 🟢 低优先级

#### 6. 添加操作日志的 IP 地址和地理位置获取功能
**文件**: `src/common/interceptors/log.interceptor.ts`

**当前状态**: 使用 `getClientIp(request)` 获取 IP，但未实现地理位置

**需要实现**:

1. **创建 IP 工具类**:
```typescript
// src/common/utils/ip.util.ts
import { Request } from 'express';

export class IpUtil {
  /**
   * 获取客户端真实 IP
   */
  static getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return (xForwardedFor as string).split(',')[0].trim();
    }
    
    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return xRealIp as string;
    }
    
    return request.socket.remoteAddress || '127.0.0.1';
  }

  /**
   * 获取 IP 地理位置
   * 可使用 ip2region 或第三方 API
   */
  static async getIpLocation(ip: string): Promise<string> {
    // TODO: 实现 IP 地理位置查询
    // 方案1: 使用 ip2region 离线库
    // 方案2: 调用第三方 API（如高德、百度）
    return '内网IP';
  }
}
```

2. **更新 LogInterceptor**:
```typescript
const operIp = IpUtil.getClientIp(request);
const operLocation = await IpUtil.getIpLocation(operIp);

const operLog: Partial<SysOperLog> = {
  // ...
  operIp,
  operLocation, // ✅ 添加地理位置
  // ...
};
```

---

## 📊 优化优先级总结

| 序号 | 优化项 | 优先级 | 预计工作量 | 影响范围 |
|------|--------|--------|-----------|---------|
| 1 | 数据权限拦截器异步修复 | 🔴 高 | 30分钟 | 数据安全 |
| 2 | 验证码改用 Redis | 🔴 高 | 2小时 | 生产部署 |
| 3 | Kaptcha 风格验证码 | 🟡 中 | 3小时 | 用户体验 |
| 4 | 完善权限查询 SQL | 🟡 中 | 1小时 | 权限功能 |
| 5 | 完善自定义部门权限 | 🟡 中 | 1小时 | 数据权限 |
| 6 | IP 地理位置功能 | 🟢 低 | 2小时 | 日志增强 |

---

## 🎯 建议实施顺序

1. **第一批（必须）**: 优化项 1、2
   - 修复数据权限异步问题（影响数据安全）
   - 验证码改用 Redis（生产环境必需）

2. **第二批（重要）**: 优化项 4、5
   - 完善权限查询 SQL
   - 完善自定义部门权限

3. **第三批（可选）**: 优化项 3、6
   - Kaptcha 风格验证码
   - IP 地理位置功能

---

## 📝 备注

- 所有优化项都是**非阻塞性**的，当前系统可以正常运行
- 优化项 1 和 2 建议在**生产部署前**完成
- 其他优化项可根据实际需求和时间安排逐步实施

