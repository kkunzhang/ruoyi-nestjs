# Service 层（业务逻辑层）

这里存放业务逻辑，对应 Java 的 Service 层。

## 目录结构
```
service/
├── system/           # 系统管理模块服务
├── monitor/          # 系统监控模块服务
└── ...               # 其他业务模块
```

## 迁移说明
- Java 的 `@Service` → NestJS 的 `@Injectable()`
- 业务逻辑保持一致
- 使用 Mapper 层进行数据操作


