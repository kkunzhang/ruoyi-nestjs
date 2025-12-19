# Controller 层（接口层）

这里存放 HTTP 接口，对应 Java 的 Controller 层。

## 目录结构
```
controller/
├── system/           # 系统管理模块接口
├── monitor/          # 系统监控模块接口
└── ...               # 其他业务模块
```

## 迁移说明
- Java 的 `@RestController` → NestJS 的 `@Controller()`
- Java 的 `@GetMapping` → NestJS 的 `@Get()`
- Java 的 `@PostMapping` → NestJS 的 `@Post()`
- **URL 路径必须与 Java 版本完全一致**
- **请求参数和响应结构必须与 Java 版本完全一致**


