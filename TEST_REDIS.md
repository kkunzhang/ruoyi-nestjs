# Redis 验证码功能测试指南

## 📋 测试前准备

### 1. 启动 Redis

```bash
redis-server
```

### 2. 配置环境变量

编辑 `.env` 文件，添加以下配置：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

---

## 🚀 启动应用

### 方式 1：开发模式

```bash
npm run start:dev
```

### 方式 2：生产模式

```bash
npm run build
npm run start:prod
```

**预期输出**：

```
✅ Redis 连接成功
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api-docs
```

---

## 🧪 测试用例

### 测试 1：获取验证码

**请求**：
```bash
curl http://localhost:3000/captchaImage
```

**预期响应**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "uuid": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
    "img": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>...</svg>"
  }
}
```

**验证点**：
- ✅ HTTP 状态码 200
- ✅ 返回 `uuid` 和 `img`
- ✅ `img` 为 SVG 格式

---

### 测试 2：验证 Redis 存储

**步骤 1**：获取验证码，记录 `uuid`（假设为 `test-uuid-1234`）

**步骤 2**：连接 Redis

```bash
redis-cli
```

**步骤 3**：查看所有验证码 Key

```bash
127.0.0.1:6379> keys captcha_codes:*
1) "captcha_codes:test-uuid-1234"
```

**步骤 4**：查看验证码值

```bash
127.0.0.1:6379> get captcha_codes:test-uuid-1234
"1234"  # 验证码（小写）
```

**步骤 5**：查看过期时间

```bash
127.0.0.1:6379> ttl captcha_codes:test-uuid-1234
(integer) 115  # 剩余秒数（最多 120 秒）
```

**验证点**：
- ✅ Key 前缀为 `captcha_codes:`
- ✅ 验证码为小写字符串
- ✅ TTL 为 120 秒以内

---

### 测试 3：登录成功（正确验证码）

**前置**：先获取验证码，记录 `uuid` 和 `code`（从 Redis 中查看）

**请求**：
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin",
    "password": "admin123",
    "code": "1234",
    "uuid": "test-uuid-1234"
  }'
```

**预期响应**：
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**验证点**：
- ✅ HTTP 状态码 200
- ✅ 返回 JWT Token
- ✅ Redis 中验证码已被删除（一次性使用）

**验证验证码已删除**：
```bash
127.0.0.1:6379> get captcha_codes:test-uuid-1234
(nil)  # 已不存在
```

---

### 测试 4：登录失败（错误验证码）

**请求**：
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin",
    "password": "admin123",
    "code": "0000",
    "uuid": "test-uuid-1234"
  }'
```

**预期响应**：
```json
{
  "statusCode": 400,
  "message": "验证码错误或已过期",
  "error": "Bad Request"
}
```

**验证点**：
- ✅ HTTP 状态码 400
- ✅ 错误提示准确

---

### 测试 5：登录失败（验证码过期）

**步骤 1**：获取验证码

**步骤 2**：等待 2 分钟以上

**步骤 3**：使用该验证码登录

**预期响应**：
```json
{
  "statusCode": 400,
  "message": "验证码错误或已过期",
  "error": "Bad Request"
}
```

**验证点**：
- ✅ 验证码自动过期
- ✅ 无法使用过期验证码登录

---

### 测试 6：重复使用验证码

**步骤 1**：获取验证码并登录成功

**步骤 2**：使用同一 `uuid` 和 `code` 再次登录

**预期响应**：
```json
{
  "statusCode": 400,
  "message": "验证码错误或已过期",
  "error": "Bad Request"
}
```

**验证点**：
- ✅ 验证码为一次性使用
- ✅ 验证成功后立即删除

---

### 测试 7：Redis 连接失败处理

**步骤 1**：停止 Redis

```bash
redis-cli shutdown
```

**步骤 2**：启动应用

```bash
npm run start:dev
```

**预期输出**：
```
❌ Redis 连接失败: connect ECONNREFUSED 127.0.0.1:6379
Redis connection failed after 3 retries
```

**步骤 3**：尝试获取验证码

**预期响应**：
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**验证点**：
- ✅ 应用能启动（不因 Redis 失败而崩溃）
- ✅ 显示清晰的错误提示
- ✅ 最多重试 3 次

---

## 🎯 Swagger UI 测试

访问：http://localhost:3000/api-docs

### 测试步骤

1. **找到 "认证管理" 分组**
2. **点击 `GET /captchaImage`**
3. **点击 "Try it out" → "Execute"**
4. **查看 Response body**：
   ```json
   {
     "code": 200,
     "msg": "操作成功",
     "data": {
       "uuid": "...",
       "img": "<svg>...</svg>"
     }
   }
   ```
5. **复制 `uuid` 和验证码（从 Redis 查看）**
6. **点击 `POST /login`**
7. **填写参数**：
   ```json
   {
     "userName": "admin",
     "password": "admin123",
     "code": "1234",
     "uuid": "..."
   }
   ```
8. **执行登录，验证成功返回 Token**

---

## 📊 测试结果记录

| 测试用例 | 状态 | 说明 |
|---------|------|------|
| 获取验证码 | ⏳ | |
| Redis 存储验证 | ⏳ | |
| 正确验证码登录 | ⏳ | |
| 错误验证码登录 | ⏳ | |
| 验证码过期 | ⏳ | |
| 验证码一次性使用 | ⏳ | |
| Redis 连接失败 | ⏳ | |
| Swagger UI 测试 | ⏳ | |

**完成测试后，将 ⏳ 改为 ✅ 或 ❌**

---

## 🐛 常见问题

### 问题 1：Redis 连接失败

**症状**：
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决**：
1. 检查 Redis 是否启动：`redis-cli ping`（应返回 `PONG`）
2. 检查端口是否正确：`lsof -i :6379`
3. 检查 `.env` 配置是否正确

---

### 问题 2：验证码验证失败

**症状**：
```json
{
  "message": "验证码错误或已过期"
}
```

**排查**：
1. 在 Redis 中查看验证码：`get captcha_codes:{uuid}`
2. 确认验证码未过期：`ttl captcha_codes:{uuid}`
3. 确认 `code` 为小写（验证码会自动转为小写）

---

### 问题 3：验证码已过期

**原因**：验证码有效期为 2 分钟

**解决**：重新获取验证码

---

## ✅ 测试通过标准

- ✅ Redis 连接成功
- ✅ 验证码正确存储到 Redis
- ✅ Key 前缀为 `captcha_codes:`
- ✅ 过期时间为 120 秒
- ✅ 正确验证码可以登录
- ✅ 错误验证码无法登录
- ✅ 验证码过期后无法使用
- ✅ 验证码为一次性使用（验证后立即删除）
- ✅ Redis 连接失败时有清晰的错误提示

---

**测试完成后，请更新 `docs/completion/验证码Redis存储完成.md` 中的测试状态！**

