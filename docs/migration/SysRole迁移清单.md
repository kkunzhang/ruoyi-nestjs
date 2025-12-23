# SysRole（角色管理）迁移文件清单

## 📋 需要迁移的文件列表

### 1️⃣ Domain 层（实体和关联表）

#### 核心实体
- ✅ **SysRole.java** - 角色实体（已完成）
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysRole.java`
  - 对应：`src/domain/entities/sys-role.entity.ts`
  - 说明：角色表的核心实体类

#### 关联实体（角色相关的关联表）
- **SysRoleMenu.java** - 角色菜单关联
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/domain/SysRoleMenu.java`
  - 说明：角色和菜单的多对多关联表（权限分配）

- **SysRoleDept.java** - 角色部门关联
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/domain/SysRoleDept.java`
  - 说明：角色和部门的多对多关联表（数据权限）

- **SysUserRole.java** - 用户角色关联（已完成）
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/domain/SysUserRole.java`
  - 说明：用户和角色的多对多关联表

#### 依赖实体（已完成）
- ✅ **SysMenu.java** - 菜单实体（已完成）
- ✅ **SysDept.java** - 部门实体（已完成）
- ✅ **SysUser.java** - 用户实体（已完成）

---

### 2️⃣ Mapper 层（数据访问）

#### Mapper 接口
- **SysRoleMapper.java** - 角色 Mapper 接口
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysRoleMapper.java`
  - 说明：定义角色数据访问方法

#### Mapper XML
- **SysRoleMapper.xml** - 角色 SQL 映射文件
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/resources/mapper/system/SysRoleMapper.xml`
  - 说明：包含所有 SQL 查询语句

#### 关联 Mapper
- **SysRoleMenuMapper.java** + **SysRoleMenuMapper.xml**
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysRoleMenuMapper.java`
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/resources/mapper/system/SysRoleMenuMapper.xml`

- **SysRoleDeptMapper.java** + **SysRoleDeptMapper.xml**
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysRoleDeptMapper.java`
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/resources/mapper/system/SysRoleDeptMapper.xml`

- ⚠️ **SysUserRoleMapper.java** - 用户角色关联（部分完成）
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysUserRoleMapper.java`
  - 对应：`src/mapper/user-role.repository.ts`（需要补充方法）

---

### 3️⃣ Service 层（业务逻辑）

#### Service 接口
- **ISysRoleService.java** - 角色服务接口
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/service/ISysRoleService.java`
  - 说明：定义角色业务方法

#### Service 实现
- **SysRoleServiceImpl.java** - 角色服务实现
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/service/impl/SysRoleServiceImpl.java`
  - 说明：实现角色业务逻辑

---

### 4️⃣ Controller 层（接口）

- **SysRoleController.java** - 角色控制器
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysRoleController.java`
  - 说明：角色管理的 HTTP 接口

---

## 📊 接口清单（15个接口）

### 基础 CRUD（7个）

| 序号 | HTTP 方法 | 路径 | 说明 | 权限 |
|------|----------|------|------|------|
| 1 | GET | `/system/role/list` | 获取角色列表（分页） | system:role:list |
| 2 | GET | `/system/role/:roleId` | 获取角色详情 | system:role:query |
| 3 | POST | `/system/role` | 新增角色 | system:role:add |
| 4 | PUT | `/system/role` | 修改角色 | system:role:edit |
| 5 | DELETE | `/system/role/:roleIds` | 删除角色（批量） | system:role:remove |
| 6 | PUT | `/system/role/changeStatus` | 修改角色状态 | system:role:edit |
| 7 | GET | `/system/role/optionselect` | 获取角色选择框列表 | system:role:query |

### 数据权限（2个）

| 序号 | HTTP 方法 | 路径 | 说明 | 权限 |
|------|----------|------|------|------|
| 8 | PUT | `/system/role/dataScope` | 修改数据权限 | system:role:edit |
| 9 | GET | `/system/role/deptTree/:roleId` | 获取角色部门树 | system:role:query |

### 用户授权（5个）

| 序号 | HTTP 方法 | 路径 | 说明 | 权限 |
|------|----------|------|------|------|
| 10 | GET | `/system/role/authUser/allocatedList` | 已分配用户列表 | system:role:list |
| 11 | GET | `/system/role/authUser/unallocatedList` | 未分配用户列表 | system:role:list |
| 12 | PUT | `/system/role/authUser/cancel` | 取消授权用户 | system:role:edit |
| 13 | PUT | `/system/role/authUser/cancelAll` | 批量取消授权 | system:role:edit |
| 14 | PUT | `/system/role/authUser/selectAll` | 批量选择授权 | system:role:edit |

### 导出（1个）

| 序号 | HTTP 方法 | 路径 | 说明 | 权限 |
|------|----------|------|------|------|
| 15 | POST | `/system/role/export` | 导出角色数据 | system:role:export |

---

## 🎯 迁移顺序建议（5个阶段）

### 第一阶段：关联实体准备 ⚠️

**目标**：创建角色相关的关联表实体

**需要创建的文件**：
1. `src/domain/entities/sys-role-menu.entity.ts` - 角色菜单关联实体
2. `src/domain/entities/sys-role-dept.entity.ts` - 角色部门关联实体

**参考实体**：
- Java: `SysRoleMenu.java`, `SysRoleDept.java`
- 已完成: `sys-user-role.entity.ts`（可参考）

**预计时间**：30 分钟

---

### 第二阶段：Mapper 层迁移 🔴

**目标**：创建角色相关的 Repository

**需要创建的文件**：
1. `src/mapper/role.repository.ts` - 角色 Repository（已部分完成，需补充）
2. `src/mapper/role-menu.repository.ts` - 角色菜单关联 Repository
3. `src/mapper/role-dept.repository.ts` - 角色部门关联 Repository

**需要实现的方法**（参考 SysRoleMapper.java）：
```typescript
// role.repository.ts
- selectRoleList() - 查询角色列表
- selectRoleById() - 根据ID查询角色
- selectRolesByUserId() - 根据用户ID查询角色列表
- selectRoleAll() - 查询所有角色
- selectRoleListByUserId() - 根据用户ID查询角色选择框列表
- checkRoleNameUnique() - 校验角色名称是否唯一
- checkRoleKeyUnique() - 校验角色权限是否唯一
- insertRole() - 新增角色
- updateRole() - 修改角色
- updateRoleStatus() - 修改角色状态
- deleteRoleById() - 删除角色
- deleteRoleByIds() - 批量删除角色
```

**预计时间**：2-3 小时

---

### 第三阶段：Service 层迁移 🔴

**目标**：实现角色业务逻辑

**需要创建的文件**：
1. `src/service/role.service.ts` - 角色服务
2. `src/service/role.service.spec.ts` - 单元测试（可选）

**需要实现的方法**（参考 ISysRoleService.java）：
```typescript
// role.service.ts
- selectRoleList() - 查询角色列表
- selectRoleById() - 根据ID查询角色
- selectRolesByUserId() - 根据用户ID查询角色
- selectRoleAll() - 查询所有角色
- selectRoleListByUserId() - 根据用户ID查询角色列表
- checkRoleNameUnique() - 校验角色名称
- checkRoleKeyUnique() - 校验角色权限
- checkRoleAllowed() - 校验角色是否允许操作
- checkRoleDataScope() - 校验角色是否有数据权限
- countUserRoleByRoleId() - 统计角色使用数量
- insertRole() - 新增角色
- updateRole() - 修改角色
- updateRoleStatus() - 修改状态
- authDataScope() - 修改数据权限
- deleteRoleById() - 删除角色
- deleteRoleByIds() - 批量删除
- deleteAuthUser() - 取消授权用户
- deleteAuthUsers() - 批量取消授权
- insertAuthUsers() - 批量选择授权
```

**业务逻辑重点**：
- 角色名称、角色权限唯一性校验
- 超级管理员角色保护（不允许修改/删除）
- 数据权限校验
- 角色与菜单、部门的关联关系处理
- 角色与用户的授权关系处理

**预计时间**：3-4 小时

---

### 第四阶段：Controller 层迁移 🔴

**目标**：实现角色管理 RESTful API

**需要创建的文件**：
1. `src/controller/role.controller.ts` - 角色控制器
2. `src/controller/dto/role-query.dto.ts` - 角色查询 DTO
3. `src/controller/dto/create-role.dto.ts` - 创建角色 DTO
4. `src/controller/dto/update-role.dto.ts` - 更新角色 DTO
5. `src/controller/dto/change-role-status.dto.ts` - 修改状态 DTO
6. `src/controller/dto/auth-data-scope.dto.ts` - 数据权限 DTO
7. `src/controller/dto/auth-user.dto.ts` - 用户授权 DTO

**需要实现的接口**（15个，见上方接口清单）

**Swagger 文档**：
- 使用 `@ApiTags('角色管理')`
- 每个接口添加 `@ApiOperation`
- 每个 DTO 添加 `@ApiProperty`

**权限控制**：
- 使用 `@RequirePermissions` 装饰器
- 使用 `@Log` 装饰器记录操作日志

**预计时间**：3-4 小时

---

### 第五阶段：测试与优化 ✅

**目标**：测试所有功能，确保与前端对接

**测试清单**：
- [ ] Swagger 文档访问：`http://localhost:3000/api-docs`
- [ ] 角色列表查询（分页、排序、筛选）
- [ ] 角色详情查询
- [ ] 新增角色（含菜单权限、数据权限）
- [ ] 修改角色
- [ ] 修改角色状态
- [ ] 修改数据权限
- [ ] 删除角色（单个、批量）
- [ ] 角色选择框列表
- [ ] 角色部门树
- [ ] 已分配用户列表
- [ ] 未分配用户列表
- [ ] 取消授权（单个、批量）
- [ ] 批量选择授权
- [ ] 导出角色数据（可选）

**优化项**：
- 响应格式与前端对齐
- 错误提示与前端对齐
- 性能优化（如有必要）

**预计时间**：1-2 小时

---

## 📊 文件统计

| 层级 | 文件数量 | 说明 |
|------|---------|------|
| Domain（实体） | 2 个 | SysRoleMenu + SysRoleDept（SysRole 已完成） |
| Mapper（数据访问） | 6 个 | 3个 Repository |
| Service（业务） | 2 个 | 1个服务 + 1个测试（可选） |
| Controller（接口） | 8 个 | 1个控制器 + 7个 DTO |
| **总计** | **18 个文件** | |

---

## 🔗 依赖关系

### 已完成（可直接使用）
- ✅ `SysRole` 实体（部分字段可能需要补充）
- ✅ `SysUser` 实体
- ✅ `SysMenu` 实体
- ✅ `SysDept` 实体
- ✅ `UserRepository`
- ✅ `UserService`

### 需要补充
- ⚠️ `RoleRepository` - 已创建但方法不完整
- ⚠️ `MenuRepository` - 需要补充角色菜单关联查询
- ⚠️ `DeptRepository` - 需要补充角色部门关联查询

---

## ⏱️ 预计总工作量

| 阶段 | 预计时间 | 优先级 |
|------|---------|--------|
| 第一阶段：关联实体 | 30 分钟 | 🔴 高 |
| 第二阶段：Mapper 层 | 2-3 小时 | 🔴 高 |
| 第三阶段：Service 层 | 3-4 小时 | 🔴 高 |
| 第四阶段：Controller 层 | 3-4 小时 | 🔴 高 |
| 第五阶段：测试优化 | 1-2 小时 | 🟡 中 |
| **总计** | **10-14 小时** | |

---

## 🚀 下一步行动

### 方式一：完整迁移（推荐）
一次性完成所有 5 个阶段，确保角色管理功能完整可用。

### 方式二：分阶段迁移
按照上述 5 个阶段逐步进行，每完成一个阶段测试后再进行下一阶段。

### 方式三：自动读取迁移
提供若依原版的文件路径，自动读取并迁移。

---

## 📝 重要提示

### 与用户管理的关联
角色管理与用户管理紧密相关：
1. 用户授权功能需要调用 `UserService`
2. 用户列表筛选需要支持按角色筛选
3. 建议先完成用户管理，再迁移角色管理（✅ 已完成）

### 前端对接要点
1. **接口路径**：必须与 Java 版本完全一致
2. **请求参数**：必须与 Java 版本完全一致
3. **返回数据**：必须与 Java 版本完全一致
4. **权限标识**：必须与 Java 版本完全一致

### 关键业务逻辑
1. **超级管理员保护**：`roleId = 1` 的角色不允许修改/删除
2. **角色名称唯一**：新增/修改时校验
3. **角色权限唯一**：新增/修改时校验
4. **数据权限**：支持 5 种数据范围（全部、自定义、本部门、本部门及以下、仅本人）
5. **菜单权限**：通过 `sys_role_menu` 关联
6. **用户授权**：通过 `sys_user_role` 关联

---

**准备好开始了吗？我可以立即开始迁移！** 🎊

