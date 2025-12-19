# 快速开始指南

## 📦 安装依赖

```bash
cd "/Users/mac/Desktop/project/ruoyi 2/nestRuoyi"
npm install
```

## ⚙️ 配置环境

1. 复制环境变量配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，修改数据库连接信息：
```env
DATABASE_URL="mysql://root:你的密码@localhost:3306/ruoyi"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

## 🗄️ 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建数据库迁移（如果数据库已存在表，可跳过）
npm run prisma:migrate

# 可选：打开 Prisma Studio 可视化管理数据库
npm run prisma:studio
```

## 🚀 启动项目

```bash
# 开发模式（热重载）
npm run start:dev
```

启动成功后，你会看到：
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api-docs
```

## 📝 测试接口

访问 Swagger 文档：http://localhost:3000/api-docs

或使用 curl 测试健康检查接口：
```bash
curl http://localhost:3000
```

应该返回：
```
RuoYi NestJS API is running!
```

## 📂 项目结构概览

```
nestRuoyi/
├── 📄 配置文件
│   ├── package.json          # 项目依赖
│   ├── tsconfig.json         # TypeScript 配置
│   ├── nest-cli.json         # NestJS CLI 配置
│   ├── .env                  # 环境变量（需创建）
│   ├── .prettierrc           # 代码格式化
│   └── .eslintrc.js          # 代码检查
│
├── 📁 prisma/                # 数据库
│   └── schema.prisma         # 数据模型定义
│
└── 📁 src/                   # 源代码
    ├── main.ts               # 应用入口
    ├── app.module.ts         # 根模块
    │
    ├── 📁 domain/            # 实体层
    │   ├── entities/         # Prisma 实体
    │   ├── dto/              # 数据传输对象
    │   │   ├── request/      # 请求 DTO
    │   │   └── response/     # 响应 DTO
    │   └── vo/               # 视图对象
    │
    ├── 📁 mapper/            # 数据访问层
    │   ├── prisma/           # Prisma 查询封装
    │   └── sql/              # 复杂 SQL
    │
    ├── 📁 service/           # 业务逻辑层
    │   ├── system/           # 系统管理
    │   └── monitor/          # 系统监控
    │
    ├── 📁 controller/        # 接口层
    │   ├── system/           # 系统管理接口
    │   └── monitor/          # 系统监控接口
    │
    └── 📁 common/            # 通用能力
        ├── prisma/           # 数据库连接
        ├── pagination/       # 分页
        ├── auth/             # 认证
        ├── logger/           # 日志
        ├── filters/          # 异常过滤器
        ├── interceptors/     # 拦截器
        ├── decorators/       # 装饰器
        ├── guards/           # 守卫
        ├── constants/        # 常量
        └── utils/            # 工具类
```

## 🔄 迁移流程

按照以下顺序迁移 Java 代码：

### 1️⃣ Domain（实体）
- 在 `prisma/schema.prisma` 中定义数据模型
- 在 `src/domain/dto/` 中创建 DTO
- 运行 `npm run prisma:generate` 生成类型

### 2️⃣ Mapper（数据访问）
- 在 `src/mapper/prisma/` 中创建 Mapper
- 封装 Prisma 查询操作

### 3️⃣ Service（业务逻辑）
- 在 `src/service/` 中创建 Service
- 实现业务逻辑

### 4️⃣ Controller（接口）
- 在 `src/controller/` 中创建 Controller
- 定义 HTTP 接口

### 5️⃣ 通用能力
- 添加权限验证
- 添加日志记录
- 完善异常处理

## 📚 相关文档

- [README.md](./README.md) - 项目说明
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 详细文件结构说明
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Java 到 NestJS 迁移指南

## 🛠️ 常用命令

```bash
# 开发
npm run start:dev          # 启动开发服务器
npm run build              # 构建生产版本
npm run start:prod         # 启动生产服务器

# 代码质量
npm run lint               # 代码检查
npm run format             # 代码格式化

# 数据库
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 数据库迁移
npm run prisma:studio      # 可视化数据库管理

# 测试
npm run test               # 单元测试
npm run test:e2e           # 端到端测试
npm run test:cov           # 测试覆盖率
```

## ⚠️ 注意事项

1. **数据库连接**：确保 MySQL 已启动，数据库已创建
2. **环境变量**：必须创建 `.env` 文件并配置正确的数据库连接
3. **端口占用**：默认端口 3000，如被占用可在 `.env` 中修改
4. **Node 版本**：建议使用 Node.js 18+ 版本

## 🎯 下一步

1. 准备好 Java 项目的实体类（Entity）
2. 开始迁移第一个模块（建议从用户管理开始）
3. 按照迁移指南逐步完成

## 💡 提示

- 使用 Swagger 文档测试接口：http://localhost:3000/api-docs
- 使用 Prisma Studio 管理数据：`npm run prisma:studio`
- 查看日志了解程序运行状态
- 遇到问题查看 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

准备好了吗？开始迁移你的第一个模块吧！🚀


