# SysUser（用户管理）迁移文件清单

## 📋 需要迁移的文件列表

### 1️⃣ Domain 层（实体和关联表）

#### 核心实体
- ✅ **SysUser.java** - 用户实体
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysUser.java`
  - 说明：用户表的核心实体类

#### 关联实体（用户相关的关联表）
- **SysUserRole.java** - 用户角色关联
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/domain/SysUserRole.java`
  - 说明：用户和角色的多对多关联表

- **SysUserPost.java** - 用户岗位关联
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/domain/SysUserPost.java`
  - 说明：用户和岗位的多对多关联表

#### 依赖实体（需要先迁移）
- **SysDept.java** - 部门实体
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysDept.java`
  - 说明：用户表有外键关联到部门表

- **SysRole.java** - 角色实体
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysRole.java`
  - 说明：通过 SysUserRole 关联

- **SysPost.java** - 岗位实体
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/domain/SysPost.java`
  - 说明：通过 SysUserPost 关联

### 2️⃣ Mapper 层（数据访问）

#### Mapper 接口
- **SysUserMapper.java** - 用户 Mapper 接口
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysUserMapper.java`
  - 说明：定义用户数据访问方法

#### Mapper XML
- **SysUserMapper.xml** - 用户 SQL 映射文件
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/resources/mapper/system/SysUserMapper.xml`
  - 说明：包含所有 SQL 查询语句

#### 关联 Mapper
- **SysUserRoleMapper.java** + **SysUserRoleMapper.xml**
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysUserRoleMapper.java`
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/resources/mapper/system/SysUserRoleMapper.xml`

- **SysUserPostMapper.java** + **SysUserPostMapper.xml**
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/mapper/SysUserPostMapper.java`
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/resources/mapper/system/SysUserPostMapper.xml`

### 3️⃣ Service 层（业务逻辑）

#### Service 接口
- **ISysUserService.java** - 用户服务接口
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/service/ISysUserService.java`
  - 说明：定义用户业务方法

#### Service 实现
- **SysUserServiceImpl.java** - 用户服务实现
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/service/impl/SysUserServiceImpl.java`
  - 说明：实现用户业务逻辑

### 4️⃣ Controller 层（接口）

- **SysUserController.java** - 用户控制器
  - 路径：`/Users/mac/Desktop/project/ruoyi 2/RuoYi-Vue/ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysUserController.java`
  - 说明：用户管理的 HTTP 接口

---

## 🎯 迁移顺序建议

### 阶段一：基础实体（必须先迁移）
1. **SysDept** - 部门（用户依赖）
2. **SysRole** - 角色（用户依赖）
3. **SysPost** - 岗位（用户依赖）

### 阶段二：核心实体
4. **SysUser** - 用户（核心）

### 阶段三：关联表
5. **SysUserRole** - 用户角色关联
6. **SysUserPost** - 用户岗位关联

### 阶段四：业务逻辑
7. **SysUserMapper** - 数据访问层
8. **SysUserService** - 业务逻辑层
9. **SysUserController** - 接口层

---

## 📊 文件统计

| 层级 | 文件数量 | 说明 |
|------|---------|------|
| Domain（实体） | 6 个 | SysUser + 依赖实体 + 关联表 |
| Mapper（数据访问） | 6 个 | 3个接口 + 3个XML |
| Service（业务） | 2 个 | 1个接口 + 1个实现 |
| Controller（接口） | 1 个 | HTTP 接口 |
| **总计** | **15 个文件** | |

---

## 🚀 下一步

你可以选择：

### 方式一：完整迁移（推荐）
一次性提供所有文件，我帮你完成整个用户模块的迁移

### 方式二：分步迁移
1. 先迁移依赖实体（SysDept, SysRole, SysPost）
2. 再迁移 SysUser 实体
3. 然后迁移 Mapper
4. 接着迁移 Service
5. 最后迁移 Controller

### 方式三：我自动读取
我可以直接读取这些文件并自动迁移（需要你确认）

---

**你想用哪种方式？我可以立即开始！** 🎊

