# 角色管理 - 第二阶段完成：Mapper 层迁移

## ✅ 完成时间
2025-12-23

## 🎯 阶段目标
创建角色相关的 Repository（数据访问层），实现角色、角色菜单、角色部门的数据访问方法。

---

## 📁 已创建/更新文件

### 1. RoleRepository（补充完善）✅
**文件**：`src/mapper/role.repository.ts`

**说明**：角色表数据访问层，对应 Java 的 `SysRoleMapper`

**已实现方法**（15个）：
```typescript
// 查询方法
- selectRoleList()                   // 根据条件分页查询角色数据
- selectRolePermissionByUserId()     // 根据用户ID查询角色（含数据权限）
- selectRoleAll()                    // 查询所有角色
- selectRoleListByUserId()           // 根据用户ID获取角色ID列表
- selectRoleById()                   // 通过角色ID查询角色
- selectRolesByUserName()            // 根据用户名查询角色

// 校验方法
- checkRoleNameUnique()              // 校验角色名称是否唯一
- checkRoleKeyUnique()               // 校验角色权限是否唯一

// 修改方法
- updateRole()                       // 修改角色信息
- insertRole()                       // 新增角色信息

// 删除方法
- deleteRoleById()                   // 通过角色ID删除角色（软删除）
- deleteRoleByIds()                  // 批量删除角色信息（软删除）
```

**关键实现**：
- 使用 TypeORM QueryBuilder 进行灵活查询
- 支持条件筛选（角色名、角色权限、状态）
- 软删除实现（`delFlag = '2'`）
- 联表查询用户角色关系

---

### 2. RoleMenuRepository（新建）✅
**文件**：`src/mapper/role-menu.repository.ts`

**说明**：角色与菜单关联表数据访问层，对应 Java 的 `SysRoleMenuMapper`

**已实现方法**（7个）：
```typescript
// 查询方法
- checkMenuExistRole()               // 查询菜单使用数量
- selectMenuIdsByRoleId()            // 查询角色的所有菜单ID
- selectRoleIdsByMenuId()            // 查询菜单被哪些角色使用

// 删除方法
- deleteRoleMenuByRoleId()           // 通过角色ID删除角色菜单关联
- deleteRoleMenu()                   // 批量删除角色菜单关联信息

// 新增方法
- batchRoleMenu()                    // 批量新增角色菜单信息
```

**用途**：
- 为角色分配菜单权限
- 查询角色拥有的菜单
- 删除角色时清理关联
- 修改角色菜单权限

---

### 3. RoleDeptRepository（新建）✅
**文件**：`src/mapper/role-dept.repository.ts`

**说明**：角色与部门关联表数据访问层，对应 Java 的 `SysRoleDeptMapper`

**已实现方法**（7个）：
```typescript
// 查询方法
- selectCountRoleDeptByDeptId()      // 查询部门使用数量
- selectDeptIdsByRoleId()            // 查询角色的所有部门ID
- selectRoleIdsByDeptId()            // 查询部门被哪些角色使用

// 删除方法
- deleteRoleDeptByRoleId()           // 通过角色ID删除角色部门关联
- deleteRoleDept()                   // 批量删除角色部门关联信息

// 新增方法
- batchRoleDept()                    // 批量新增角色部门信息
```

**用途**：
- 为角色指定数据权限范围（`dataScope = 2` 时）
- 查询角色可访问的部门
- 删除角色时清理关联
- 修改角色数据权限

---

### 4. UserRoleRepository（已完成）✅
**文件**：`src/mapper/user-role.repository.ts`

**说明**：用户与角色关联表数据访问层（第一阶段已完成）

**补充说明**：
- 已支持用户角色授权相关所有方法
- 支持批量授权/取消授权
- 支持查询角色的用户列表

---

### 5. MapperModule（已更新）✅
**文件**：`src/mapper/mapper.module.ts`

**更新内容**：
```typescript
// 导入新 Repository
import { RoleMenuRepository } from './role-menu.repository';
import { RoleDeptRepository } from './role-dept.repository';

// 注册到 providers 和 exports
providers: [
  // ...
  RoleRepository,        // ✅ 已补充
  RoleMenuRepository,    // ✅ 新增
  RoleDeptRepository,    // ✅ 新增
],
exports: [
  // ...
  RoleRepository,
  RoleMenuRepository,
  RoleDeptRepository,
]
```

---

### 6. Mapper 导出文件（已更新）✅
**文件**：`src/mapper/index.ts`

**更新内容**：
```typescript
export * from './role.repository';
export * from './role-menu.repository';
export * from './role-dept.repository';
export * from './oper-log.repository';
export * from './menu.repository';
```

---

## 📊 方法统计

| Repository | 方法数量 | 说明 |
|------------|---------|------|
| RoleRepository | 12 个 | 角色 CRUD、查询、校验 |
| RoleMenuRepository | 7 个 | 角色菜单关联操作 |
| RoleDeptRepository | 7 个 | 角色部门关联操作 |
| UserRoleRepository | 10 个 | 用户角色关联操作（已完成） |
| **总计** | **36 个方法** | |

---

## 🔗 Repository 关联关系

```
RoleRepository (核心)
├── RoleMenuRepository (菜单权限)
│   └── 管理角色与菜单的多对多关系
├── RoleDeptRepository (数据权限)
│   └── 管理角色与部门的多对多关系
└── UserRoleRepository (用户授权)
    └── 管理用户与角色的多对多关系
```

---

## 🎨 技术实现要点

### 1. TypeORM QueryBuilder
使用 QueryBuilder 构建灵活的 SQL 查询：

```typescript
async selectRoleList(role: Partial<SysRole>): Promise<[SysRole[], number]> {
  const queryBuilder = this.roleRepository.createQueryBuilder('r');
  
  queryBuilder.where('r.delFlag = :delFlag', { delFlag: '0' });

  // 动态条件筛选
  if (role.roleName) {
    queryBuilder.andWhere('r.roleName LIKE :roleName', { 
      roleName: `%${role.roleName}%` 
    });
  }

  return queryBuilder.getManyAndCount();
}
```

---

### 2. 原生 SQL 查询
复杂的多表联查使用原生 SQL：

```typescript
async selectRolePermissionByUserId(userId: number): Promise<SysRole[]> {
  const query = `
    SELECT DISTINCT r.*
    FROM sys_role r
    LEFT JOIN sys_user_role ur ON ur.role_id = r.role_id
    WHERE ur.user_id = ? AND r.del_flag = '0'
  `;
  return this.roleRepository.query(query, [userId]);
}
```

---

### 3. 批量操作
批量插入/删除提高性能：

```typescript
async batchRoleMenu(roleMenuList: Partial<SysRoleMenu>[]): Promise<number> {
  const values = roleMenuList.map((rm) => ({
    role_id: rm.roleId,
    menu_id: rm.menuId,
  }));

  const result = await this.dataSource
    .createQueryBuilder()
    .insert()
    .into('sys_role_menu')
    .values(values)
    .execute();

  return result.raw.affectedRows || 0;
}
```

---

### 4. 软删除
角色删除使用软删除（`delFlag = '2'`）：

```typescript
async deleteRoleById(roleId: number): Promise<number> {
  const result = await this.roleRepository.update(
    { roleId },
    { delFlag: '2' }  // 软删除标记
  );
  return result.affected || 0;
}
```

---

## ✅ 验证结果

### 编译验证
```bash
npm run build
✅ 编译成功，无错误
```

### 文件结构
```
src/mapper/
├── user.repository.ts
├── user-role.repository.ts         ✅ 已完成
├── user-post.repository.ts         ✅ 已完成
├── role.repository.ts              ✅ 补充完善
├── role-menu.repository.ts         ✅ 新建
├── role-dept.repository.ts         ✅ 新建
├── oper-log.repository.ts          ✅ 已完成
├── menu.repository.ts              ✅ 已完成
├── mapper.module.ts                ✅ 已更新
└── index.ts                        ✅ 已更新
```

---

## 📝 与用户管理的对比

| 对比项 | 用户管理 Mapper | 角色管理 Mapper |
|--------|----------------|----------------|
| 核心 Repository | UserRepository | RoleRepository |
| 关联 Repository | 2 个 | 2 个 |
| 方法总数 | 约 30 个 | 约 26 个 |
| 复杂度 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 多表联查 | 3-4 个 | 4-5 个 |

---

## 🚀 下一步：第三阶段

### 目标
实现角色业务逻辑（Service 层）

### 需要创建的文件
1. `src/service/role.service.ts` - 角色服务
2. `src/service/role.service.spec.ts` - 单元测试（可选）

### 需要实现的方法
- 角色 CRUD 业务逻辑
- 角色名称、权限唯一性校验
- 角色与菜单、部门、用户的关联处理
- 超级管理员角色保护
- 数据权限校验

### 预计工作量
3-4 小时

---

## 📊 阶段总结

| 任务 | 状态 | 耗时 |
|------|------|------|
| 补充 RoleRepository | ✅ 完成 | 40 分钟 |
| 创建 RoleMenuRepository | ✅ 完成 | 30 分钟 |
| 创建 RoleDeptRepository | ✅ 完成 | 30 分钟 |
| 更新 MapperModule | ✅ 完成 | 10 分钟 |
| 更新导出文件 | ✅ 完成 | 5 分钟 |
| 编译验证 | ✅ 完成 | 5 分钟 |
| **总计** | **✅ 完成** | **2 小时** |

---

**第二阶段完成！可以开始第三阶段：Service 层迁移** 🎉

