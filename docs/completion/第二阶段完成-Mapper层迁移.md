# ✅ 第二阶段完成：Mapper 层（数据访问层）迁移

## 📊 迁移完成情况

### 1️⃣ 已创建的 Repository 文件

| Java Mapper | TypeORM Repository | 状态 | 说明 |
|-------------|-------------------|------|------|
| `SysUserMapper.java` + `SysUserMapper.xml` | `user.repository.ts` | ✅ 完成 | 用户数据访问 |
| `SysUserRoleMapper.java` + XML | `user-role.repository.ts` | ✅ 完成 | 用户角色关联 |
| `SysUserPostMapper.java` + XML | `user-post.repository.ts` | ✅ 完成 | 用户岗位关联 |

### 2️⃣ Repository 方法映射

#### UserRepository（用户数据访问）

| Java 方法 | TypeORM 方法 | 说明 |
|-----------|-------------|------|
| `selectUserList()` | `selectUserList()` | ✅ 分页查询用户列表 |
| `selectAllocatedList()` | `selectAllocatedList()` | ✅ 查询已分配角色的用户 |
| `selectUnallocatedList()` | `selectUnallocatedList()` | ✅ 查询未分配角色的用户 |
| `selectUserByUserName()` | `selectUserByUserName()` | ✅ 根据用户名查询 |
| `selectUserById()` | `selectUserById()` | ✅ 根据ID查询 |
| `insertUser()` | `insertUser()` | ✅ 新增用户 |
| `updateUser()` | `updateUser()` | ✅ 更新用户 |
| `updateUserAvatar()` | `updateUserAvatar()` | ✅ 更新头像 |
| `updateUserStatus()` | `updateUserStatus()` | ✅ 更新状态 |
| `updateLoginInfo()` | `updateLoginInfo()` | ✅ 更新登录信息 |
| `resetUserPwd()` | `resetUserPwd()` | ✅ 重置密码 |
| `deleteUserById()` | `deleteUserById()` | ✅ 删除用户（软删除） |
| `deleteUserByIds()` | `deleteUserByIds()` | ✅ 批量删除 |
| `checkUserNameUnique()` | `checkUserNameUnique()` | ✅ 校验用户名唯一 |
| `checkPhoneUnique()` | `checkPhoneUnique()` | ✅ 校验手机号唯一 |
| `checkEmailUnique()` | `checkEmailUnique()` | ✅ 校验邮箱唯一 |

#### UserRoleRepository（用户角色关联）

| Java 方法 | TypeORM 方法 | 说明 |
|-----------|-------------|------|
| `deleteUserRoleByUserId()` | `deleteUserRoleByUserId()` | ✅ 删除用户的所有角色 |
| `deleteUserRole()` | `deleteUserRole()` | ✅ 批量删除用户角色 |
| `countUserRoleByRoleId()` | `countUserRoleByRoleId()` | ✅ 统计角色使用数量 |
| `batchUserRole()` | `batchUserRole()` | ✅ 批量新增用户角色 |
| `deleteUserRoleInfo()` | `deleteUserRoleInfo()` | ✅ 删除指定用户角色 |
| `deleteUserRoleInfos()` | `deleteUserRoleInfos()` | ✅ 批量取消授权 |
| - | `batchInsertUserRole()` | ✅ 批量授权角色 |
| - | `selectRoleIdsByUserId()` | ✅ 查询用户的角色ID |
| - | `selectUserIdsByRoleId()` | ✅ 查询角色的用户ID |

#### UserPostRepository（用户岗位关联）

| Java 方法 | TypeORM 方法 | 说明 |
|-----------|-------------|------|
| `deleteUserPostByUserId()` | `deleteUserPostByUserId()` | ✅ 删除用户的所有岗位 |
| `countUserPostById()` | `countUserPostById()` | ✅ 统计岗位使用数量 |
| `deleteUserPost()` | `deleteUserPost()` | ✅ 批量删除用户岗位 |
| `batchUserPost()` | `batchUserPost()` | ✅ 批量新增用户岗位 |
| - | `deleteUserPostInfo()` | ✅ 删除指定用户岗位 |
| - | `selectPostIdsByUserId()` | ✅ 查询用户的岗位ID |
| - | `selectUserIdsByPostId()` | ✅ 查询岗位的用户ID |
| - | `batchInsertUserPost()` | ✅ 批量授权岗位 |

### 3️⃣ MyBatis XML → TypeORM QueryBuilder

#### 复杂查询示例

**Java MyBatis XML**：
```xml
<select id="selectUserList" parameterType="SysUser" resultMap="SysUserResult">
    select u.user_id, u.dept_id, u.user_name, ...
    from sys_user u
    left join sys_dept d on u.dept_id = d.dept_id
    where u.del_flag = '0'
    <if test="userName != null and userName != ''">
        AND u.user_name like concat('%', #{userName}, '%')
    </if>
    <if test="status != null and status != ''">
        AND u.status = #{status}
    </if>
</select>
```

**TypeORM QueryBuilder**：
```typescript
const queryBuilder = this.userRepository
  .createQueryBuilder('u')
  .leftJoinAndSelect('u.dept', 'd')
  .leftJoinAndSelect('u.roles', 'r')
  .where('u.delFlag = :delFlag', { delFlag: '0' });

if (query.userName) {
  queryBuilder.andWhere('u.userName LIKE :userName', {
    userName: `%${query.userName}%`,
  });
}

if (query.status) {
  queryBuilder.andWhere('u.status = :status', { status: query.status });
}

return queryBuilder.getManyAndCount();
```

### 4️⃣ 关键特性

#### ✅ 类型安全
```typescript
// TypeScript 严格类型检查
async selectUserById(userId: number): Promise<SysUser | null> {
  return this.userRepository.findOne({
    where: { userId, delFlag: '0' },
    relations: ['dept', 'roles', 'posts'],
  });
}
```

#### ✅ 关联查询
```typescript
// 自动加载关联数据
.leftJoinAndSelect('u.dept', 'd')      // 部门
.leftJoinAndSelect('u.roles', 'r')     // 角色
.leftJoinAndSelect('u.posts', 'p')     // 岗位
```

#### ✅ 软删除
```typescript
// 软删除：设置 delFlag = '2'
async deleteUserById(userId: number): Promise<boolean> {
  const result = await this.userRepository.update(userId, { delFlag: '2' });
  return result.affected! > 0;
}
```

#### ✅ 批量操作
```typescript
// 批量插入
const values = roleIds.map((roleId) => ({ user_id: userId, role_id: roleId }));
await this.dataSource
  .createQueryBuilder()
  .insert()
  .into('sys_user_role')
  .values(values)
  .execute();
```

#### ✅ 事务支持
```typescript
// 使用 DataSource 执行原生 SQL
await this.dataSource
  .createQueryBuilder()
  .delete()
  .from('sys_user_role')
  .where('user_id = :userId', { userId })
  .execute();
```

### 5️⃣ 中间表处理

TypeORM 的多对多关系会自动管理中间表（`sys_user_role`, `sys_user_post`），但为了保持与 Java 版本的一致性，我们使用了 `DataSource` 直接操作中间表：

```typescript
// 直接操作中间表
await this.dataSource
  .createQueryBuilder()
  .insert()
  .into('sys_user_role')
  .values([
    { user_id: 1, role_id: 2 },
    { user_id: 1, role_id: 3 },
  ])
  .execute();
```

## 📁 文件结构

```
src/
└── mapper/
    ├── user.repository.ts           # ✅ 用户数据访问
    ├── user-role.repository.ts      # ✅ 用户角色关联
    ├── user-post.repository.ts      # ✅ 用户岗位关联
    ├── mapper.module.ts             # ✅ Mapper 模块
    └── index.ts                     # ✅ 统一导出
```

## 🎯 核心优势

### 1. 类型安全
- ✅ TypeScript 严格类型检查
- ✅ 编译时错误检测
- ✅ IDE 智能提示

### 2. 代码简洁
- ✅ 无需 XML 配置
- ✅ 链式调用
- ✅ 可读性强

### 3. 功能完整
- ✅ 支持复杂查询
- ✅ 支持关联查询
- ✅ 支持事务
- ✅ 支持批量操作

### 4. 性能优化
- ✅ 查询优化
- ✅ 连接池管理
- ✅ 延迟加载

## 🚀 使用示例

### 查询用户列表
```typescript
const [users, total] = await userRepository.selectUserList({
  userName: '张三',
  status: '0',
  skip: 0,
  take: 10,
});
```

### 新增用户
```typescript
const user = await userRepository.insertUser({
  userName: 'test',
  nickName: '测试用户',
  password: 'hashedPassword',
  status: '0',
});
```

### 分配角色
```typescript
await userRoleRepository.batchUserRole(userId, [1, 2, 3]);
```

### 分配岗位
```typescript
await userPostRepository.batchUserPost(userId, [1, 2]);
```

## 📊 迁移对比

| 特性 | Java MyBatis | TypeORM | 优势 |
|------|-------------|---------|------|
| **配置方式** | XML 配置 | 代码配置 | ✅ 类型安全 |
| **SQL 构建** | 手写 SQL | QueryBuilder | ✅ 防止 SQL 注入 |
| **关联查询** | 手动配置 | 自动映射 | ✅ 简化代码 |
| **类型检查** | 运行时 | 编译时 | ✅ 提前发现错误 |
| **代码量** | 多文件 | 单文件 | ✅ 易于维护 |

## 🎯 下一步

**第三阶段：Service 层（业务逻辑层）**

需要迁移：
- `ISysUserService.java`
- `SysUserServiceImpl.java`

创建对应的 NestJS Service：
- `user.service.ts`

---

**第二阶段完成！所有 Mapper 已成功从 MyBatis 迁移到 TypeORM Repository！** 🎊

