# Mapper 层（数据访问层）

这里存放数据库操作逻辑，对应 Java 的 MyBatis Mapper。

## 目录结构
```
mapper/
├── prisma/           # Prisma 查询封装
└── sql/              # 复杂 SQL 语句（如需要）
```

## 迁移说明
- Java 的 `@Mapper` 接口 → Prisma Client 封装
- MyBatis XML 的 SQL → Prisma 查询方法或原生 SQL
- 支持分页、排序、条件查询等


