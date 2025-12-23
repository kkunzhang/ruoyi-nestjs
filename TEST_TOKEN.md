# Token 管理测试指南（若依版本）

## 📋 测试前准备

### 1. 启动 Redis

```bash
redis-server
```

### 2. 启动应用

```bash
cd "/Users/mac/Desktop/project/ruoyi 2/nestRuoyi"
npm run start:dev
```

**预期输出**：
```
✅ Redis 连接成功
🚀 Application is running on: http://localhost:3000
```

---

## 🧪 测试用例

### 测试 1：登录并查看 Redis 存储

**步骤 1**：获取验证码

```bash
curl http://localhost:3000/captchaImage
```

**步骤 2**：查看 Redis 中的验证码

```bash
redis-cli
127.0.0.1:6379> keys captcha_codes:*
127.0.0.1:6379> get captcha_codes:{你的uuid}
```

**步骤 3**：登录

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin",
    "password": "admin123",
    "code": "{你的验证码}",
    "uuid": "{你的uuid}"
  }'
```

**步骤 4**：查看 Redis 中的 LoginUser

```bash
127.0.0.1:6379> keys login_tokens:*
1) "login_tokens:xxxxxxxx..."

127.0.0.1:6379> get login_tokens:xxxxxxxx...
# 应该返回完整的 JSON 格式 LoginUser
```

**验证点**：
- ✅ 返回 JWT Token
- ✅ Redis 中存在 `login_tokens:{uuid}`
- ✅ LoginUser 包含用户信息、权限、IP等
- ✅ TTL 为 1800 秒（30分钟）

---

### 测试 2：使用 Token 获取用户信息

**步骤 1**：使用登录获得的 Token

```bash
curl http://localhost:3000/getInfo \
  -H "Authorization: Bearer {你的Token}"
```

**预期响应**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "user": {
      "userId": 1,
      "userName": "admin",
      ...
    },
    "roles": ["admin"],
    "permissions": ["*:*:*"]
  }
}
```

**验证点**：
- ✅ 能够正常获取用户信息
- ✅ 权限列表正确

---

### 测试 3：JWT 中只包含 UUID

**步骤 1**：解码 JWT Token

访问：https://jwt.io/

粘贴你的 Token，查看 Payload

**预期 Payload**：
```json
{
  "login_user_key": "xxxxxxxx...",  // UUID
  "userName": "admin",              // 用户名（可选）
  "iat": 1703123456,                // 签发时间
  "exp": 1703125256                 // 过期时间
}
```

**验证点**：
- ✅ JWT 中**不包含**完整用户信息
- ✅ JWT 中**不包含**权限列表
- ✅ 只包含 `login_user_key`（UUID）

---

### 测试 4：注销功能

**步骤 1**：记录当前的 UUID

```bash
redis-cli
127.0.0.1:6379> keys login_tokens:*
1) "login_tokens:abc123..."  # 记录这个 UUID
```

**步骤 2**：注销

```bash
curl -X POST http://localhost:3000/logout \
  -H "Authorization: Bearer {你的Token}"
```

**步骤 3**：验证 Redis 中的数据已删除

```bash
127.0.0.1:6379> keys login_tokens:*
(empty array)  # 已被删除
```

**步骤 4**：使用旧 Token 请求

```bash
curl http://localhost:3000/getInfo \
  -H "Authorization: Bearer {你的Token}"
```

**预期响应**：
```json
{
  "statusCode": 401,
  "message": "用户信息已过期，请重新登录"
}
```

**验证点**：
- ✅ 注销后 Redis 数据立即删除
- ✅ 旧 Token 无法再使用
- ✅ 返回 401 错误

---

### 测试 5：Token 自动刷新

**说明**：Token 剩余时间不足 20 分钟时，会自动刷新

**步骤 1**：登录并记录初始过期时间

```bash
redis-cli
127.0.0.1:6379> get login_tokens:{uuid}
# 记录 expireTime 字段
```

**步骤 2**：手动修改 Redis 中的过期时间（模拟临近过期）

```bash
127.0.0.1:6379> get login_tokens:{uuid}
# 复制整个 JSON，修改 expireTime 为当前时间 + 10分钟
127.0.0.1:6379> set login_tokens:{uuid} "{修改后的JSON}"
```

**步骤 3**：发起请求

```bash
curl http://localhost:3000/getInfo \
  -H "Authorization: Bearer {你的Token}"
```

**步骤 4**：再次查看 Redis

```bash
127.0.0.1:6379> get login_tokens:{uuid}
# expireTime 应该被自动刷新为当前时间 + 30分钟
```

**验证点**：
- ✅ 剩余时间 < 20分钟时自动刷新
- ✅ `expireTime` 被更新
- ✅ `loginTime` 被更新

---

### 测试 6：多次请求验证 Token 刷新

**步骤 1**：连续发起多次请求

```bash
for i in {1..5}; do
  curl http://localhost:3000/getInfo \
    -H "Authorization: Bearer {你的Token}"
  echo "\n---"
  sleep 1
done
```

**步骤 2**：查看 Redis 的 TTL 变化

```bash
redis-cli
127.0.0.1:6379> ttl login_tokens:{uuid}
# 如果剩余时间 < 20分钟，TTL 应该被刷新
```

---

### 测试 7：服务端主动踢人

**步骤 1**：登录

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "admin",
    "password": "admin123",
    "code": "{验证码}",
    "uuid": "{uuid}"
  }'
```

**步骤 2**：管理员手动删除 Redis 中的 LoginUser

```bash
redis-cli
127.0.0.1:6379> del login_tokens:{uuid}
(integer) 1
```

**步骤 3**：用户尝试请求

```bash
curl http://localhost:3000/getInfo \
  -H "Authorization: Bearer {Token}"
```

**预期响应**：
```json
{
  "statusCode": 401,
  "message": "用户信息已过期，请重新登录"
}
```

**验证点**：
- ✅ 管理员可以通过删除 Redis Key 强制用户下线
- ✅ 被踢用户立即失去访问权限

---

### 测试 8：IP 和 User-Agent 记录

**步骤 1**：使用不同的 User-Agent 登录

```bash
# Chrome
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -d '{
    "userName": "admin",
    "password": "admin123",
    "code": "{验证码}",
    "uuid": "{uuid}"
  }'
```

**步骤 2**：查看 Redis 中的 LoginUser

```bash
redis-cli
127.0.0.1:6379> get login_tokens:{uuid}
```

**预期字段**：
```json
{
  ...
  "ipaddr": "127.0.0.1",
  "loginLocation": "内网IP",
  "browser": "Chrome",
  "os": "Windows"
}
```

**验证点**：
- ✅ 记录了客户端 IP
- ✅ 解析了浏览器类型
- ✅ 解析了操作系统

---

### 测试 9：Token 过期后的行为

**步骤 1**：修改 Redis 的 TTL 为 1 秒

```bash
redis-cli
127.0.0.1:6379> expire login_tokens:{uuid} 1
```

**步骤 2**：等待 2 秒

```bash
sleep 2
```

**步骤 3**：发起请求

```bash
curl http://localhost:3000/getInfo \
  -H "Authorization: Bearer {Token}"
```

**预期响应**：
```json
{
  "statusCode": 401,
  "message": "用户信息已过期，请重新登录"
}
```

**验证点**：
- ✅ Redis 数据过期后，Token 立即失效
- ✅ 返回明确的过期提示

---

## 📊 测试结果记录

| 测试用例 | 状态 | 说明 |
|---------|------|------|
| 登录并查看 Redis | ⏳ | |
| 使用 Token 获取信息 | ⏳ | |
| JWT 中只包含 UUID | ⏳ | |
| 注销功能 | ⏳ | |
| Token 自动刷新 | ⏳ | |
| 多次请求验证刷新 | ⏳ | |
| 服务端主动踢人 | ⏳ | |
| IP 和 User-Agent | ⏳ | |
| Token 过期行为 | ⏳ | |

---

## ✅ 测试通过标准

- ✅ JWT Token 只包含 UUID
- ✅ 完整 LoginUser 存储在 Redis
- ✅ Redis Key 为 `login_tokens:{uuid}`
- ✅ Token 有效期 30 分钟
- ✅ 剩余时间 < 20 分钟时自动刷新
- ✅ 注销后 Redis 数据立即删除
- ✅ 注销后旧 Token 无法使用
- ✅ 支持服务端主动踢人
- ✅ 记录 IP 和 User-Agent

---

**测试完成后，请更新 `docs/completion/Token管理-若依版本实现完成.md` 中的测试状态！**

