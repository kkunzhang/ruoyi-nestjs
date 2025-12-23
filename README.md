# RuoYi NestJS 版本

这是将 RuoYi-Vue (Java/Spring Boot) 迁移到 NestJS 的项目。

## 📚 文档导航

- 📖 [快速开始指南](docs/guides/QUICK_START.md) - 新手入门
- 🏗️ [项目结构说明](docs/guides/PROJECT_STRUCTURE.md) - 了解项目架构
- 🔄 [迁移指南](docs/guides/MIGRATION_GUIDE.md) - Java → NestJS 迁移参考
- 💾 [TypeORM 使用说明](docs/guides/README-TypeORM.md) - 数据库操作指南
- 📊 [迁移进度对比](docs/optimization/迁移进度对比.md) - 查看待完成工作
- ✅ [项目完成总结](docs/completion/项目完成总结-最终版.md) - 已完成功能总览
- 🔧 [后续优化 TODO](docs/optimization/后续优化TODO.md) - 待优化项清单

更多文档请查看 [docs/](docs/) 文件夹。

## 技术栈

- **框架**: NestJS v11 (Node.js 20)
- **语言**: TypeScript (严格类型)
- **ORM**: TypeORM (连接 MySQL)
- **API 文档**: Swagger (@nestjs/swagger)
- **校验**: class-validator + class-transformer
- **认证**: JWT + Passport

## 项目结构

```
nestRuoyi/
├── prisma/                    # Prisma 数据库配置
│   └── schema.prisma         # 数据库模型定义
├── src/
│   ├── main.ts               # 应用入口
│   ├── app.module.ts         # 根模块
│   ├── domain/               # 实体层（对应 Java Entity）
│   │   ├── entities/         # Prisma 实体类
│   │   ├── dto/              # 数据传输对象
│   │   │   ├── request/      # 请求 DTO
│   │   │   └── response/     # 响应 DTO
│   │   └── vo/               # 视图对象
│   ├── mapper/               # 数据访问层（对应 MyBatis Mapper）
│   │   ├── prisma/           # Prisma 查询封装
│   │   └── sql/              # 复杂 SQL 语句
│   ├── service/              # 业务逻辑层（对应 Java Service）
│   │   ├── system/           # 系统管理模块
│   │   └── monitor/          # 系统监控模块
│   ├── controller/           # 接口层（对应 Java Controller）
│   │   ├── system/           # 系统管理接口
│   │   └── monitor/          # 系统监控接口
│   └── common/               # 通用能力层
│       ├── prisma/           # Prisma 数据库连接
│       ├── pagination/       # 分页功能
│       ├── auth/             # 权限认证
│       ├── logger/           # 日志系统
│       ├── filters/          # 全局异常过滤器
│       ├── interceptors/     # 拦截器
│       ├── decorators/       # 自定义装饰器
│       ├── guards/           # 守卫
│       ├── pipes/            # 管道
│       ├── constants/        # 常量定义
│       └── utils/            # 工具函数
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
├── nest-cli.json             # NestJS CLI 配置
└── .env                      # 环境变量（需自行创建）
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

修改数据库连接等配置：

```env
DATABASE_URL="mysql://root:password@localhost:3306/ruoyi"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移（首次需要创建数据库）
npm run prisma:migrate
```

### 4. 启动项目

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 5. 访问 API 文档

启动后访问：http://localhost:3000/api-docs

## 迁移顺序

按照以下顺序逐步迁移 Java 代码：

1. ✅ **Domain（实体）** - 定义数据模型和 DTO
2. **Mapper（SQL 逻辑）** - 实现数据访问层
3. **Service（业务）** - 实现业务逻辑
4. **Controller（接口）** - 实现 HTTP 接口
5. **通用能力** - 完善分页、权限、日志等功能

## 核心原则

1. **业务逻辑对齐**：完全理解 Java 代码的业务意图，并在 NestJS 中还原
2. **接口一致性**：URL 路径、请求参数、返回数据结构必须与 Java 版本完全一致
3. **类型安全**：充分利用 TypeScript 的类型系统
4. **代码规范**：遵循 NestJS 最佳实践

## 常用命令

```bash
# 开发
npm run start:dev          # 启动开发服务器（热重载）
npm run build              # 构建生产版本
npm run start:prod         # 启动生产服务器

# 代码质量
npm run lint               # 运行 ESLint
npm run format             # 格式化代码

# 测试
npm run test               # 运行单元测试
npm run test:e2e           # 运行端到端测试
npm run test:cov           # 生成测试覆盖率报告

# Prisma
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 运行数据库迁移
npm run prisma:studio      # 打开 Prisma Studio（数据库可视化工具）
```

## 开发规范

### 命名规范

- **文件名**：kebab-case（如 `user.service.ts`）
- **类名**：PascalCase（如 `UserService`）
- **变量/函数**：camelCase（如 `getUserById`）
- **常量**：UPPER_SNAKE_CASE（如 `MAX_PAGE_SIZE`）

### 目录规范

- 每个模块包含：`*.module.ts`、`*.controller.ts`、`*.service.ts`
- DTO 文件放在 `domain/dto/` 目录
- 实体文件放在 `domain/entities/` 目录

### 注释规范

- 使用 JSDoc 注释类和方法
- 使用 Swagger 装饰器描述 API

## 注意事项

1. **数据库字段映射**：Java 的驼峰命名需要映射到 MySQL 的下划线命名
2. **日期处理**：Java 的 `Date` 对应 TypeScript 的 `Date`
3. **BigInt 处理**：MySQL 的 `BIGINT` 在 Prisma 中为 `BigInt` 类型
4. **NULL 处理**：TypeScript 严格模式下需要正确处理 `null` 和 `undefined`

## 📊 项目进度

### ✅ 已完成（29%）

- ✅ **基础架构**：实体层、Mapper 层、Service 层、Controller 层
- ✅ **用户管理**：完整的用户 CRUD、权限管理、密码重置
- ✅ **认证授权**：JWT 认证、权限验证、角色验证、数据权限
- ✅ **操作日志**：日志记录、日志持久化
- ✅ **全局功能**：异常处理、统一响应、数据验证、验证码

### 🔴 待完成（高优先级）

- [ ] 角色管理（12个接口）
- [ ] 菜单管理（8个接口，包含动态路由）
- [ ] 部门管理（7个接口）
- [ ] 操作日志查询（4个接口）

### 🟡 待完成（中优先级）

- [ ] 岗位管理、字典管理、参数配置
- [ ] 个人中心、登录日志、在线用户

详细进度请查看：[迁移进度对比](docs/optimization/迁移进度对比.md)

## 许可证

MIT



