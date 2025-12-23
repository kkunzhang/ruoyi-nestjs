# 项目文件结构说明

本文档详细说明每个目录和文件的作用。

## 根目录文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖和脚本配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `nest-cli.json` | NestJS CLI 配置 |
| `.env` | 环境变量配置（需自行创建） |
| `.env.example` | 环境变量示例 |
| `.gitignore` | Git 忽略文件配置 |
| `.prettierrc` | Prettier 代码格式化配置 |
| `.eslintrc.js` | ESLint 代码检查配置 |
| `README.md` | 项目说明文档 |

## src/ 目录结构

### 核心文件

```
src/
├── main.ts              # 应用入口，配置全局管道、过滤器、Swagger
├── app.module.ts        # 根模块，导入所有子模块
├── app.controller.ts    # 根控制器，健康检查接口
└── app.service.ts       # 根服务
```

### domain/ - 实体层

```
domain/
├── entities/            # Prisma 实体类（从数据库生成）
├── dto/                 # 数据传输对象
│   ├── request/         # 请求 DTO（接收前端数据）
│   └── response/        # 响应 DTO（返回给前端）
└── vo/                  # 视图对象（复杂的展示数据）
```

**作用**：
- 定义数据结构
- 使用 class-validator 进行数据验证
- 使用 Swagger 装饰器生成 API 文档

**示例**：
```typescript
// domain/dto/request/create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @Length(2, 30)
  userName: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(6)
  password: string;
}
```

### mapper/ - 数据访问层

```
mapper/
├── prisma/              # Prisma 查询封装
│   └── user.mapper.ts   # 用户数据访问
└── sql/                 # 复杂 SQL 语句（如需要）
```

**作用**：
- 封装 Prisma 查询操作
- 处理复杂的数据库查询
- 提供统一的数据访问接口

**示例**：
```typescript
// mapper/prisma/user.mapper.ts
@Injectable()
export class UserMapper {
  constructor(private prisma: PrismaService) {}

  async findById(userId: number) {
    return this.prisma.sysUser.findUnique({
      where: { userId },
    });
  }
}
```

### service/ - 业务逻辑层

```
service/
├── system/              # 系统管理模块
│   ├── user.service.ts
│   ├── role.service.ts
│   └── menu.service.ts
└── monitor/             # 系统监控模块
    └── online.service.ts
```

**作用**：
- 实现业务逻辑
- 调用 Mapper 进行数据操作
- 处理事务和复杂业务流程

**示例**：
```typescript
// service/system/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private userMapper: UserMapper,
    private roleMapper: RoleMapper,
  ) {}

  async createUser(dto: CreateUserDto) {
    // 业务逻辑：检查用户名是否存在、加密密码等
    const hashedPassword = await BcryptUtil.hashPassword(dto.password);
    return this.userMapper.create({
      ...dto,
      password: hashedPassword,
    });
  }
}
```

### controller/ - 接口层

```
controller/
├── system/              # 系统管理接口
│   ├── user.controller.ts
│   ├── role.controller.ts
│   └── menu.controller.ts
└── monitor/             # 系统监控接口
    └── online.controller.ts
```

**作用**：
- 定义 HTTP 接口
- 处理请求参数验证
- 调用 Service 层处理业务
- 返回统一格式的响应

**示例**：
```typescript
// controller/system/user.controller.ts
@ApiTags('用户管理')
@Controller('system/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.createUser(dto);
    return AjaxResult.success('新增成功', user);
  }
}
```

### common/ - 通用能力层

```
common/
├── prisma/              # Prisma 数据库连接
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── pagination/          # 分页功能
│   └── dto/
│       ├── page-query.dto.ts    # 分页查询参数
│       └── page-result.dto.ts   # 分页结果
├── response/            # 统一响应格式
│   └── ajax-result.ts
├── auth/                # 权限认证
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── logger/              # 日志系统
│   ├── logger.service.ts
│   └── logger.module.ts
├── filters/             # 全局异常过滤器
│   └── http-exception.filter.ts
├── interceptors/        # 拦截器
│   └── transform.interceptor.ts
├── decorators/          # 自定义装饰器
│   ├── public.decorator.ts          # 公开接口
│   ├── roles.decorator.ts           # 角色权限
│   ├── permissions.decorator.ts     # 权限标识
│   ├── current-user.decorator.ts    # 当前用户
│   └── api-paginated-response.decorator.ts  # 分页响应
├── guards/              # 守卫
│   ├── roles.guard.ts
│   └── permissions.guard.ts
├── constants/           # 常量定义
│   └── http-status.constant.ts
└── utils/               # 工具函数
    ├── bcrypt.util.ts   # 密码加密
    ├── date.util.ts     # 日期处理
    └── string.util.ts   # 字符串处理
```

## prisma/ 目录

```
prisma/
├── schema.prisma        # 数据库模型定义
└── migrations/          # 数据库迁移文件（自动生成）
```

**作用**：
- 定义数据库表结构
- 管理数据库迁移
- 生成类型安全的 Prisma Client

## 文件命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| Module | `*.module.ts` | `user.module.ts` |
| Controller | `*.controller.ts` | `user.controller.ts` |
| Service | `*.service.ts` | `user.service.ts` |
| Mapper | `*.mapper.ts` | `user.mapper.ts` |
| DTO | `*.dto.ts` | `create-user.dto.ts` |
| Entity | `*.entity.ts` | `user.entity.ts` |
| Guard | `*.guard.ts` | `roles.guard.ts` |
| Interceptor | `*.interceptor.ts` | `transform.interceptor.ts` |
| Filter | `*.filter.ts` | `http-exception.filter.ts` |
| Decorator | `*.decorator.ts` | `public.decorator.ts` |
| Util | `*.util.ts` | `string.util.ts` |
| Constant | `*.constant.ts` | `http-status.constant.ts` |

## 模块依赖关系

```
Controller (接口层)
    ↓ 调用
Service (业务层)
    ↓ 调用
Mapper (数据访问层)
    ↓ 调用
Prisma (ORM)
    ↓ 操作
Database (MySQL)
```

## 数据流向

```
前端请求
    ↓
Controller (验证参数、调用 Service)
    ↓
Service (处理业务逻辑、调用 Mapper)
    ↓
Mapper (执行数据库操作)
    ↓
返回数据
    ↓
Service (处理返回数据)
    ↓
Controller (包装成统一响应格式)
    ↓
返回给前端
```

## 后续扩展

当需要添加新功能模块时，按照以下步骤：

1. 在 `prisma/schema.prisma` 中定义数据模型
2. 在 `domain/` 中创建 DTO 和实体
3. 在 `mapper/` 中创建数据访问层
4. 在 `service/` 中创建业务逻辑层
5. 在 `controller/` 中创建接口层
6. 创建对应的 `*.module.ts` 并导入到 `app.module.ts`



