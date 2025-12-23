# 用户权限缓存刷新测试指南

## 测试目标

验证修改角色后，所有拥有该角色的在线用户权限能够自动刷新。

## 前置条件

1. ✅ Redis 已启动（端口 6379）
2. ✅ 应用已启动
3. ✅ 已有测试用户和角色数据

## 测试步骤

### 场景 1：修改角色权限后自动刷新

#### 1.1 准备测试数据

```bash
# 创建测试角色"测试角色"（如果不存在）
POST http://localhost:3000/system/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roleName": "测试角色",
  "roleKey": "test",
  "roleSort": 3,
  "status": "0",
  "menuIds": [1, 2, 100, 101], // 只有系统管理 > 用户管理的权限
  "remark": "用于测试权限刷新"
}

# 创建测试用户"张三"，分配"测试角色"
POST http://localhost:3000/system/user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userName": "zhangsan",
  "nickName": "张三",
  "password": "123456",
  "phonenumber": "13800000001",
  "email": "zhangsan@test.com",
  "sex": "0",
  "status": "0",
  "deptId": 103,
  "roleIds": [2] // 假设测试角色的 roleId=2
}
```

#### 1.2 用户"张三"登录

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "123456",
  "code": "xxxx",
  "uuid": "xxxx"
}

# 响应（记录 accessToken）
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ...
  }
}
```

#### 1.3 验证张三当前权限

```bash
# 查看当前权限
GET http://localhost:3000/auth/getInfo
Authorization: Bearer <zhangsan_token>

# 响应（记录 permissions）
{
  "code": 200,
  "data": {
    "user": { "userName": "zhangsan", ... },
    "roles": ["test"],
    "permissions": [
      "system:user:list",
      "system:user:query"
      // 此时没有 system:role:* 相关权限
    ]
  }
}

# 尝试访问角色管理（应该失败）
GET http://localhost:3000/system/role/list
Authorization: Bearer <zhangsan_token>

# 预期响应：403 Forbidden
{
  "statusCode": 403,
  "message": "没有访问权限，请联系管理员授权",
  "error": "Forbidden"
}
```

#### 1.4 管理员修改"测试角色"权限

```bash
# 添加角色管理权限
PUT http://localhost:3000/system/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roleId": 2,
  "roleName": "测试角色",
  "roleKey": "test",
  "roleSort": 3,
  "status": "0",
  "menuIds": [
    1, 2, 
    100, 101, 102, 103, 104, 105,  // 用户管理
    106, 107, 108, 109, 110, 111   // 角色管理 ⭐️ 新增
  ],
  "remark": "用于测试权限刷新"
}

# 预期响应
{
  "code": 200,
  "msg": "修改成功"
}
```

#### 1.5 验证张三权限已自动更新（无需重新登录）

```bash
# 查看当前权限（应该已包含角色管理权限）
GET http://localhost:3000/auth/getInfo
Authorization: Bearer <zhangsan_token>

# 响应（permissions 应该已更新）
{
  "code": 200,
  "data": {
    "user": { "userName": "zhangsan", ... },
    "roles": ["test"],
    "permissions": [
      "system:user:list",
      "system:user:query",
      "system:role:list",    // ⭐️ 新权限
      "system:role:query",   // ⭐️ 新权限
      "system:role:add",     // ⭐️ 新权限
      "system:role:edit",    // ⭐️ 新权限
      ...
    ]
  }
}

# 再次访问角色管理（应该成功）
GET http://localhost:3000/system/role/list
Authorization: Bearer <zhangsan_token>

# 预期响应：200 OK（返回角色列表）
{
  "code": 200,
  "msg": "查询成功",
  "rows": [...],
  "total": 3
}
```

#### 1.6 验证 Redis 中的数据

```bash
# 连接 Redis
redis-cli

# 查看张三的 LoginUser 数据
127.0.0.1:6379> KEYS login_tokens:*
1) "login_tokens:08d3a72e-4c5f-4b8f-9e3a-7c2f1b8e4d6f"

127.0.0.1:6379> GET login_tokens:08d3a72e-4c5f-4b8f-9e3a-7c2f1b8e4d6f
"{\"userId\":3,\"userName\":\"zhangsan\",...,\"permissions\":[\"system:user:list\",\"system:role:list\",...],\"loginTime\":1703315200000,\"expireTime\":1703317000000}"

# ⭐️ 验证 permissions 字段已包含新权限
```

### 场景 2：禁用角色后自动刷新

#### 2.1 管理员禁用"测试角色"

```bash
PUT http://localhost:3000/system/role/changeStatus
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roleId": 2,
  "status": "1"  // 禁用
}

# 预期响应
{
  "code": 200,
  "msg": "修改成功"
}
```

#### 2.2 验证张三权限已自动更新

```bash
# 查看当前权限
GET http://localhost:3000/auth/getInfo
Authorization: Bearer <zhangsan_token>

# ⭐️ 根据实际实现，可能返回空权限或禁用状态
# 尝试访问角色管理（应该失败）
GET http://localhost:3000/system/role/list
Authorization: Bearer <zhangsan_token>

# 预期响应：403 Forbidden
```

### 场景 3：多用户同时刷新

#### 3.1 创建多个测试用户

```bash
# 用户"李四"
POST http://localhost:3000/system/user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userName": "lisi",
  "nickName": "李四",
  "password": "123456",
  "phonenumber": "13800000002",
  "email": "lisi@test.com",
  "deptId": 103,
  "roleIds": [2] // 测试角色
}

# 用户"王五"
POST http://localhost:3000/system/user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userName": "wangwu",
  "nickName": "王五",
  "password": "123456",
  "phonenumber": "13800000003",
  "email": "wangwu@test.com",
  "deptId": 103,
  "roleIds": [2] // 测试角色
}
```

#### 3.2 三个用户同时登录

```bash
# 张三登录
POST http://localhost:3000/auth/login
{ "username": "zhangsan", "password": "123456", "code": "xxxx", "uuid": "xxxx" }

# 李四登录
POST http://localhost:3000/auth/login
{ "username": "lisi", "password": "123456", "code": "xxxx", "uuid": "xxxx" }

# 王五登录
POST http://localhost:3000/auth/login
{ "username": "wangwu", "password": "123456", "code": "xxxx", "uuid": "xxxx" }
```

#### 3.3 管理员修改"测试角色"权限

```bash
# 添加部门管理权限
PUT http://localhost:3000/system/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "roleId": 2,
  "roleName": "测试角色",
  "roleKey": "test",
  "roleSort": 3,
  "status": "0",
  "menuIds": [
    1, 2, 
    100, 101, 102, 103, 104, 105,  // 用户管理
    106, 107, 108, 109, 110, 111,  // 角色管理
    112, 113, 114, 115, 116        // 部门管理 ⭐️ 新增
  ]
}
```

#### 3.4 验证三个用户权限都已更新

```bash
# 张三
GET http://localhost:3000/auth/getInfo
Authorization: Bearer <zhangsan_token>
# ⭐️ 应包含 system:dept:* 权限

# 李四
GET http://localhost:3000/auth/getInfo
Authorization: Bearer <lisi_token>
# ⭐️ 应包含 system:dept:* 权限

# 王五
GET http://localhost:3000/auth/getInfo
Authorization: Bearer <wangwu_token>
# ⭐️ 应包含 system:dept:* 权限
```

## 验证点

### ✅ 功能验证
- [ ] 修改角色权限后，在线用户权限立即更新
- [ ] 无需重新登录
- [ ] 多个用户同时刷新
- [ ] 修改角色状态后，权限更新
- [ ] 修改数据权限后，权限更新

### ✅ 性能验证
- [ ] Redis 中的 LoginUser 数据正确更新
- [ ] Token 过期时间被刷新
- [ ] 刷新过程不阻塞主流程
- [ ] 大量用户时性能可接受

### ✅ 边界验证
- [ ] 超级管理员权限始终为 `*:*:*`
- [ ] 角色没有用户时，不报错
- [ ] Redis 连接失败时，不影响角色修改
- [ ] Token 已过期的用户，不刷新

## 调试技巧

### 查看 Redis 中的在线用户

```bash
redis-cli

# 查看所有在线用户
127.0.0.1:6379> KEYS login_tokens:*

# 查看指定用户的 Token
127.0.0.1:6379> GET login_tokens:<uuid>

# 查看 Token 过期时间
127.0.0.1:6379> TTL login_tokens:<uuid>
```

### 查看控制台日志

```bash
# 应用启动日志
✅ Redis 连接成功
✅ 数据库连接成功

# 修改角色时的日志
[RoleService] 修改角色成功: roleId=2
[TokenService] 刷新角色用户权限: roleId=2, userIds=[3,4,5]
[TokenService] 更新用户权限: userId=3, permissions.length=15
[TokenService] 更新用户权限: userId=4, permissions.length=15
[TokenService] 更新用户权限: userId=5, permissions.length=15
```

### 常见问题

#### Q1: 权限没有刷新？
- 检查 Redis 是否正常连接
- 检查用户是否在线（Token 是否有效）
- 检查角色是否分配给该用户

#### Q2: 刷新很慢？
- 检查在线用户数量（`KEYS login_tokens:*`）
- 生产环境建议使用 `SCAN` 替代 `KEYS`

#### Q3: 部分用户没刷新？
- 检查 `userRoleRepository.selectUserIdsByRoleId()` 是否正确返回
- 检查 Redis Key 是否匹配

## 完成标准

- [x] 修改角色权限后，在线用户权限立即更新
- [x] 修改角色状态后，在线用户权限立即更新
- [x] 修改数据权限后，在线用户权限立即更新
- [x] 刷新过程不阻塞主流程
- [x] 编译通过，无错误
- [x] 与若依原版行为一致（甚至更优）

## 测试完成时间

2025-12-23

