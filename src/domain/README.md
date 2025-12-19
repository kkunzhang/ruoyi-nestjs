# Domain 层（实体层）

这里存放从 Java 实体类迁移过来的 TypeScript 实体定义。

## 目录结构
```
domain/
├── entities/          # Prisma 实体类（对应 Java 的 @Entity）
├── dto/              # 数据传输对象（对应 Java 的 DTO）
│   ├── request/      # 请求 DTO
│   └── response/     # 响应 DTO
└── vo/               # 视图对象（对应 Java 的 VO）
```

## 迁移说明
- Java 的 `@Entity` → Prisma Schema + TypeScript Entity
- Java 的 `@Column` → Prisma 字段定义
- Java 的验证注解 → class-validator 装饰器


