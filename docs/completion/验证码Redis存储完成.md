# 验证码 Redis 存储迁移完成

## 🎯 迁移目标

将验证码存储从内存 Map 改为 Redis 存储，与若依原版保持一致，解决以下问题：
- ✅ 多实例部署时验证码无法共享
- ✅ 服务重启后验证码失效
- ✅ 内存泄漏风险

---

## ✅ 完成内容

### 1️⃣ 安装依赖

```bash
npm install ioredis --save
npm install -D @types/supertest
```

- `ioredis`: Redis 客户端（高性能、功能完善）
- `@types/supertest`: 修复测试文件类型错误

---

### 2️⃣ Redis 配置

#### 环境变量（`.env`）

```env
# Redis 配置（与若依原版一致）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

#### 配置文件（`src/config/redis.config.ts`）

```typescript
import { ConfigService } from '@nestjs/config';

export const redisConfig = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    host: configService.get<string>('REDIS_HOST') || 'localhost',
    port: configService.get<number>('REDIS_PORT') || 6379,
    db: configService.get<number>('REDIS_DB') || 0,
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 50, 2000);
    },
  }),
};
```

**特性**：
- 从环境变量读取配置
- 支持密码认证（可选）
- 重试策略（最多3次）
- 错误处理

---

### 3️⃣ 验证码服务（`src/common/services/captcha.service.ts`）

**核心方法**：

| 方法 | 说明 | 对应若依 |
|------|------|---------|
| `generateCode()` | 生成验证码 | ✅ |
| `generateUUID()` | 生成唯一标识 | ✅ |
| `saveCaptcha()` | 保存到 Redis（2分钟过期） | `redisCache.setCacheObject()` |
| `verifyCaptcha()` | 验证并删除（一次性使用） | 验证逻辑 |
| `deleteCaptcha()` | 手动删除 | `redisCache.deleteObject()` |
| `generateSvg()` | 生成 SVG 图片 | ❌ 若依用 Kaptcha JPG |

**Redis Key 规则**（与若依一致）：

```typescript
captcha_codes:{uuid}
```

**示例**：
```
captcha_codes:a1b2c3d4-e5f6-4789-0123-456789abcdef
```

**过期时间**：120秒（2分钟）

---

### 4️⃣ Common 模块（`src/common/common.module.ts`）

创建 `CommonModule` 作为全局模块，提供 Redis 客户端和 CaptchaService：

```typescript
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // Redis 客户端
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const config = redisConfig.useFactory(configService);
        const redis = new Redis(config);
        redis.on('error', (err) => console.error('Redis 连接错误:', err));
        redis.on('connect', () => console.log('✅ Redis 连接成功'));
        return redis;
      },
      inject: [ConfigService],
    },
    // 验证码服务
    CaptchaService,
  ],
  exports: ['REDIS_CLIENT', CaptchaService],
})
export class CommonModule {}
```

**特性**：
- `@Global()` 装饰器：全局模块，无需重复导入
- Redis 客户端：注入为 `REDIS_CLIENT`
- 连接监听：实时显示连接状态
- 导出服务：其他模块可直接使用

---

### 5️⃣ 更新 AuthController

**替换**：`CaptchaUtil` → `CaptchaService`

**获取验证码接口**：

```typescript
async captchaImage(): Promise<ResponseDto> {
  const code = this.captchaService.generateCode(4);
  const uuid = this.captchaService.generateUUID();
  
  // 保存到 Redis（异步）
  await this.captchaService.saveCaptcha(uuid, code);
  
  const img = this.captchaService.generateSvg(code);
  
  return ResponseDto.success({ uuid, img });
}
```

**登录接口**：

```typescript
async login(@Body() loginDto: LoginDto): Promise<ResponseDto> {
  // 从 Redis 验证验证码
  if (loginDto.code && loginDto.uuid) {
    const isValid = await this.captchaService.verifyCaptcha(
      loginDto.uuid, 
      loginDto.code
    );
    if (!isValid) {
      throw new BadRequestException('验证码错误或已过期');
    }
  }
  
  const result = await this.authService.login(
    loginDto.userName,
    loginDto.password,
  );
  return ResponseDto.success(result, '登录成功');
}
```

---

### 6️⃣ 更新 AppModule

在 `AppModule` 中导入 `CommonModule`：

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(typeOrmConfig),
    CommonModule, // ✅ 新增
    MapperModule,
    ServiceModule,
    ControllerModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 📊 对比若依原版

| 功能 | 若依原版 | NestJS 版 | 状态 |
|------|---------|----------|------|
| Redis 存储 | ✅ | ✅ | 完全一致 |
| Key 前缀 | `captcha_codes:` | `captcha_codes:` | ✅ |
| 过期时间 | 2分钟 | 2分钟 | ✅ |
| 一次性使用 | ✅ | ✅ | ✅ |
| 图片格式 | JPG (Kaptcha) | SVG | ⚠️ 可优化 |
| 验证码类型 | math/char | 数字 | ⚠️ 可优化 |

**差异**：
1. **图片格式**：若依用 Google Kaptcha 生成 JPG，NestJS 用 SVG（更轻量）
2. **验证码类型**：若依支持数学运算（`1+2=?`）和字符验证码，NestJS 目前只支持数字

**优化建议**（可选）：
- 集成 `canvas` 库生成 JPG 图片（与若依一致）
- 实现 `math` 和 `char` 两种验证码类型

---

## 🎯 验证步骤

### 1. 启动 Redis

```bash
redis-server
```

### 2. 配置环境变量

在 `.env` 中添加：

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### 3. 启动应用

```bash
npm run start:dev
```

**预期输出**：
```
✅ Redis 连接成功
🚀 Application is running on: http://localhost:3000
```

### 4. 测试验证码接口

**获取验证码**：
```bash
curl http://localhost:3000/captchaImage
```

**返回示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "uuid": "a1b2c3d4-e5f6-4789-0123-456789abcdef",
    "img": "<svg xmlns=...>...</svg>"
  }
}
```

### 5. 验证 Redis 存储

```bash
redis-cli
> keys captcha_codes:*
1) "captcha_codes:a1b2c3d4-e5f6-4789-0123-456789abcdef"

> get captcha_codes:a1b2c3d4-e5f6-4789-0123-456789abcdef
"1234"

> ttl captcha_codes:a1b2c3d4-e5f6-4789-0123-456789abcdef
(integer) 118  # 剩余秒数
```

### 6. 测试登录接口

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin",
    "password": "admin123",
    "code": "1234",
    "uuid": "a1b2c3d4-e5f6-4789-0123-456789abcdef"
  }'
```

**验证码错误**：
```json
{
  "statusCode": 400,
  "message": "验证码错误或已过期"
}
```

**登录成功**：
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## ✅ 编译验证

```bash
npm run build
# ✅ 编译成功
```

---

## 📝 文件清单

### 新增文件（4个）

1. `src/config/redis.config.ts` - Redis 配置
2. `src/common/services/captcha.service.ts` - 验证码服务
3. `src/common/common.module.ts` - Common 模块
4. `docs/completion/验证码Redis存储完成.md` - 本文档

### 修改文件（3个）

1. `src/app.module.ts` - 导入 CommonModule
2. `src/controller/auth.controller.ts` - 使用 CaptchaService
3. `.env` - 添加 Redis 配置（需手动添加）

### 删除文件（1个）

- ⚠️ `src/common/utils/captcha.util.ts` - 可以删除（已被 CaptchaService 替代）

---

## 🎊 总结

验证码 Redis 存储迁移已完成，主要改进：

1. ✅ **生产环境可用**：支持多实例部署
2. ✅ **与若依一致**：使用相同的 Redis Key 规则和过期策略
3. ✅ **更加可靠**：Redis 持久化，服务重启不丢失数据
4. ✅ **易于扩展**：CaptchaService 可支持更多验证码类型

**下一步优化**（可选）：
- 实现 Google Kaptcha 风格验证码（math/char 类型）
- 集成 canvas 生成 JPG 图片
- 添加验证码配置开关（是否启用验证码）

---

**状态**：✅ 完成  
**优先级**：🔴 高（生产环境必需）  
**测试状态**：⏳ 待测试（需启动 Redis）

