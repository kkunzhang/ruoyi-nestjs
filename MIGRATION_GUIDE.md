# Java 到 NestJS 迁移指南

本文档说明如何将 RuoYi-Vue 的 Java 代码迁移到 NestJS。

## 迁移流程

### 第一步：Domain（实体层）

#### Java Entity → Prisma Schema + TypeScript DTO

**Java 代码示例**：
```java
@Entity
@Table(name = "sys_user")
public class SysUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "user_name", length = 30, nullable = false)
    private String userName;
    
    @Column(name = "nick_name", length = 30, nullable = false)
    private String nickName;
    
    @Column(name = "email", length = 50)
    private String email;
    
    @Column(name = "status", length = 1)
    private String status;
    
    @Column(name = "create_time")
    private Date createTime;
}
```

**迁移到 Prisma Schema**：
```prisma
model SysUser {
  userId     BigInt    @id @default(autoincrement()) @map("user_id")
  userName   String    @map("user_name") @db.VarChar(30)
  nickName   String    @map("nick_name") @db.VarChar(30)
  email      String?   @db.VarChar(50)
  status     String?   @default("0") @db.Char(1)
  createTime DateTime? @default(now()) @map("create_time")
  
  @@map("sys_user")
}
```

**创建 TypeScript DTO**：
```typescript
// domain/dto/request/create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @Length(2, 30)
  userName: string;

  @ApiProperty({ description: '昵称' })
  @IsString()
  @Length(2, 30)
  nickName: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
```

#### 注解对照表

| Java | NestJS/Prisma | 说明 |
|------|---------------|------|
| `@Entity` | `model` in Prisma | 实体定义 |
| `@Table(name="...")` | `@@map("...")` | 表名映射 |
| `@Id` | `@id` | 主键 |
| `@GeneratedValue` | `@default(autoincrement())` | 自增 |
| `@Column(name="...")` | `@map("...")` | 字段映射 |
| `@NotNull` / `nullable=false` | 不加 `?` | 非空字段 |
| `nullable=true` | 加 `?` | 可空字段 |
| `@NotBlank` | `@IsNotEmpty()` | 非空验证 |
| `@Size(min=2, max=30)` | `@Length(2, 30)` | 长度验证 |
| `@Email` | `@IsEmail()` | 邮箱验证 |
| `@Pattern(regexp="...")` | `@Matches(/.../)` | 正则验证 |

### 第二步：Mapper（数据访问层）

#### MyBatis Mapper → Prisma Client

**Java Mapper 示例**：
```java
@Mapper
public interface SysUserMapper {
    SysUser selectUserById(Long userId);
    
    List<SysUser> selectUserList(SysUser user);
    
    int insertUser(SysUser user);
    
    int updateUser(SysUser user);
    
    int deleteUserById(Long userId);
}
```

**迁移到 NestJS Mapper**：
```typescript
// mapper/prisma/user.mapper.ts
@Injectable()
export class UserMapper {
  constructor(private prisma: PrismaService) {}

  async selectUserById(userId: bigint) {
    return this.prisma.sysUser.findUnique({
      where: { userId },
    });
  }

  async selectUserList(query: PageQueryDto) {
    const { pageNum, pageSize } = query;
    const skip = (pageNum - 1) * pageSize;
    
    return this.prisma.sysUser.findMany({
      skip,
      take: pageSize,
    });
  }

  async insertUser(data: any) {
    return this.prisma.sysUser.create({ data });
  }

  async updateUser(userId: bigint, data: any) {
    return this.prisma.sysUser.update({
      where: { userId },
      data,
    });
  }

  async deleteUserById(userId: bigint) {
    return this.prisma.sysUser.delete({
      where: { userId },
    });
  }
}
```

#### Prisma 查询对照

| MyBatis | Prisma | 说明 |
|---------|--------|------|
| `selectOne` | `findUnique()` | 查询单条 |
| `selectList` | `findMany()` | 查询多条 |
| `insert` | `create()` | 插入 |
| `update` | `update()` | 更新 |
| `delete` | `delete()` | 删除 |
| `WHERE id = ?` | `where: { id }` | 条件查询 |
| `LIMIT ?, ?` | `skip, take` | 分页 |
| `ORDER BY` | `orderBy` | 排序 |

### 第三步：Service（业务逻辑层）

#### Java Service → NestJS Service

**Java Service 示例**：
```java
@Service
public class SysUserService {
    @Autowired
    private SysUserMapper userMapper;
    
    public SysUser selectUserById(Long userId) {
        return userMapper.selectUserById(userId);
    }
    
    public int insertUser(SysUser user) {
        // 加密密码
        user.setPassword(SecurityUtils.encryptPassword(user.getPassword()));
        return userMapper.insertUser(user);
    }
}
```

**迁移到 NestJS Service**：
```typescript
// service/system/user.service.ts
@Injectable()
export class UserService {
  constructor(private userMapper: UserMapper) {}

  async selectUserById(userId: bigint) {
    return this.userMapper.selectUserById(userId);
  }

  async insertUser(dto: CreateUserDto) {
    // 加密密码
    const hashedPassword = await BcryptUtil.hashPassword(dto.password);
    
    return this.userMapper.insertUser({
      ...dto,
      password: hashedPassword,
    });
  }
}
```

#### 注解对照

| Java | NestJS | 说明 |
|------|--------|------|
| `@Service` | `@Injectable()` | 服务标记 |
| `@Autowired` | `constructor(private ...)` | 依赖注入 |
| `@Transactional` | Prisma 事务 | 事务处理 |

### 第四步：Controller（接口层）

#### Java Controller → NestJS Controller

**Java Controller 示例**：
```java
@RestController
@RequestMapping("/system/user")
public class SysUserController {
    @Autowired
    private ISysUserService userService;
    
    @GetMapping("/{userId}")
    public AjaxResult getInfo(@PathVariable Long userId) {
        return AjaxResult.success(userService.selectUserById(userId));
    }
    
    @PostMapping
    public AjaxResult add(@RequestBody SysUser user) {
        return toAjax(userService.insertUser(user));
    }
    
    @GetMapping("/list")
    public TableDataInfo list(SysUser user) {
        startPage();
        List<SysUser> list = userService.selectUserList(user);
        return getDataTable(list);
    }
}
```

**迁移到 NestJS Controller**：
```typescript
// controller/system/user.controller.ts
@ApiTags('用户管理')
@Controller('system/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':userId')
  @ApiOperation({ summary: '查询用户详情' })
  async getInfo(@Param('userId') userId: string) {
    const user = await this.userService.selectUserById(BigInt(userId));
    return AjaxResult.success(user);
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  async add(@Body() dto: CreateUserDto) {
    const result = await this.userService.insertUser(dto);
    return AjaxResult.success('新增成功', result);
  }

  @Get('list')
  @ApiOperation({ summary: '查询用户列表' })
  async list(@Query() query: PageQueryDto) {
    const { rows, total } = await this.userService.selectUserList(query);
    return new PageResultDto(rows, total);
  }
}
```

#### 注解对照

| Java | NestJS | 说明 |
|------|--------|------|
| `@RestController` | `@Controller()` | 控制器 |
| `@RequestMapping("/path")` | `@Controller('path')` | 路由前缀 |
| `@GetMapping` | `@Get()` | GET 请求 |
| `@PostMapping` | `@Post()` | POST 请求 |
| `@PutMapping` | `@Put()` | PUT 请求 |
| `@DeleteMapping` | `@Delete()` | DELETE 请求 |
| `@PathVariable` | `@Param()` | 路径参数 |
| `@RequestParam` | `@Query()` | 查询参数 |
| `@RequestBody` | `@Body()` | 请求体 |

### 第五步：通用能力

#### 分页

**Java 分页**：
```java
startPage();
List<SysUser> list = userService.selectUserList(user);
return getDataTable(list);
```

**NestJS 分页**：
```typescript
const { pageNum, pageSize } = query;
const skip = (pageNum - 1) * pageSize;

const [rows, total] = await Promise.all([
  this.prisma.sysUser.findMany({ skip, take: pageSize }),
  this.prisma.sysUser.count(),
]);

return new PageResultDto(rows, total);
```

#### 权限验证

**Java 权限**：
```java
@PreAuthorize("@ss.hasPermi('system:user:add')")
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.insertUser(user));
}
```

**NestJS 权限**：
```typescript
@RequirePermissions('system:user:add')
@Post()
async add(@Body() dto: CreateUserDto) {
  const result = await this.userService.insertUser(dto);
  return AjaxResult.success('新增成功', result);
}
```

#### 日志记录

**Java 日志**：
```java
@Log(title = "用户管理", businessType = BusinessType.INSERT)
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.insertUser(user));
}
```

**NestJS 日志**：
```typescript
// 使用拦截器或装饰器实现
@Log({ title: '用户管理', businessType: 'INSERT' })
@Post()
async add(@Body() dto: CreateUserDto) {
  const result = await this.userService.insertUser(dto);
  return AjaxResult.success('新增成功', result);
}
```

## 类型映射

| Java | TypeScript | Prisma |
|------|------------|--------|
| `Long` | `bigint` | `BigInt` |
| `Integer` | `number` | `Int` |
| `String` | `string` | `String` |
| `Date` | `Date` | `DateTime` |
| `Boolean` | `boolean` | `Boolean` |
| `Double` | `number` | `Float` |
| `BigDecimal` | `Decimal` from `decimal.js` | `Decimal` |

## 常见问题

### 1. BigInt 处理

Java 的 `Long` 对应 TypeScript 的 `bigint`，需要特殊处理：

```typescript
// 从字符串转换
const userId = BigInt('123456789');

// 返回给前端时转为字符串
return {
  userId: user.userId.toString(),
};
```

### 2. 日期格式化

```typescript
import { DateUtil } from '@/common/utils/date.util';

const formattedDate = DateUtil.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
```

### 3. 事务处理

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.sysUser.create({ data: userData });
  await tx.sysUserRole.create({ data: userRoleData });
});
```

### 4. 复杂查询

```typescript
// 使用原生 SQL
const users = await this.prisma.$queryRaw`
  SELECT * FROM sys_user WHERE user_name LIKE ${`%${keyword}%`}
`;
```

## 迁移检查清单

- [ ] Prisma Schema 定义完成
- [ ] DTO 创建并添加验证
- [ ] Mapper 实现所有数据访问方法
- [ ] Service 实现所有业务逻辑
- [ ] Controller 实现所有接口
- [ ] URL 路径与 Java 版本一致
- [ ] 请求参数与 Java 版本一致
- [ ] 响应格式与 Java 版本一致
- [ ] 权限验证已添加
- [ ] 日志记录已添加
- [ ] 异常处理已完善
- [ ] 使用 Swagger 测试接口
- [ ] 与前端联调通过

## 下一步

完成基础结构搭建后，可以开始迁移具体的业务模块。建议按照以下顺序：

1. 用户管理（sys_user）
2. 角色管理（sys_role）
3. 菜单管理（sys_menu）
4. 部门管理（sys_dept）
5. 其他模块...

每迁移一个模块，都要确保：
- 接口路径一致
- 参数格式一致
- 返回数据一致
- 业务逻辑一致


