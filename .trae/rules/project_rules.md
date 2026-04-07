# WarForge 项目架构规则

> **AI 助手必须严格遵守红线规则。红线规则详见：[RED_LINES.md](docs/RED_LINES.md)**

---

## 关键文件索引

| 用途 | 文件路径 |
|------|----------|
| 红线规则 | `docs/RED_LINES.md` |
| Redis Key 定义 | `server/database/redis_keys.go` |
| 领域实体 | `server/internal/domain/*/` |
| Repository 实现 | `server/internal/infrastructure/persistence/*/` |
| Gin 路由(v1) | `server/internal/interfaces/http/webadmin/router/v1/router.go` |
| Gin 路由(v2) | `server/internal/interfaces/http/webadmin/router/v2/router.go` |
| Auth 中间件 | `server/internal/interfaces/http/webadmin/middleware/v1/auth.go` |
| RBAC 中间件 | `server/internal/interfaces/http/webadmin/middleware/v1/rbac.go` |
| JWT 工具 | `server/internal/interfaces/http/webadmin/auth/jwt.go` |
| Nakama RPC | `server/internal/interfaces/nakama/rpc/*.go` |
| Nakama 匹配器 | `server/internal/interfaces/nakama/match/*.go` |
| 配置文件 | `server/config/config.yaml` |
| 数据库迁移 | `server/migrations/modules/*.go` |

---

## 目录结构 (DDD 分层架构)

```
server/
├── cmd/                           # 入口程序
│   ├── nakama/main.go             # Nakama 服务入口
│   └── webadmin/main.go           # WebAdmin 独立服务入口
├── config/                        # 配置管理
├── database/                      # 数据库连接 + Redis Key
├── internal/                      # 内部模块 (DDD 分层)
│   ├── domain/                    # 领域层
│   │   ├── admin/                 # 管理员领域
│   │   ├── user/                  # 用户领域
│   │   ├── content/               # 内容管理领域
│   │   ├── system/                # 系统配置领域
│   │   ├── bot/                   # 机器人领域
│   │   └── shared/                # 共享值对象
│   ├── application/               # 应用层
│   │   └── admin/                 # 管理用例
│   ├── infrastructure/            # 基础设施层
│   │   ├── database/              # 数据库基础设施
│   │   ├── nakama/                # Nakama 适配器
│   │   ├── persistence/           # 持久化实现 (SQL)
│   │   │   ├── admin/             # 管理员 Repository
│   │   │   ├── system/            # 系统 Repository
│   │   │   ├── content/           # 内容 Repository
│   │   │   └── user/              # 用户 Repository
│   │   └── storage/               # 存储服务
│   └── interfaces/                # 接口层
│       ├── http/                  # HTTP 接口
│       │   └── webadmin/          # 管理后台 HTTP API
│       │       ├── handlers/      # 请求处理器
│       │       ├── middleware/    # 中间件
│       │       ├── router/        # 路由配置
│       │       ├── auth/          # JWT 认证
│       │       └── response/      # 响应格式化
│       └── nakama/                # Nakama 接口
│           ├── rpc/               # RPC 处理器
│           └── match/             # 匹配处理器
├── pkg/                           # 公共包
│   ├── logger/                    # 日志工具
│   ├── crypto/                    # 加密工具
│   └── errors/                    # 错误处理
├── utils/                         # 工具函数
├── tools/                         # 辅助工具
└── migrations/                    # 数据库迁移
```

---

## DDD 分层说明

### 领域层 (Domain)

- 包含业务核心逻辑和规则
- 定义领域实体、值对象、聚合根
- 定义仓库接口（Repository Interface）
- 不依赖任何外部框架

### 应用层 (Application)

- 编排领域对象完成业务用例
- 定义用例（Use Case）接口和实现
- 处理事务边界
- 调用领域服务和仓库

### 基础设施层 (Infrastructure)

- 实现仓库接口
- 提供数据库连接、缓存、消息队列等
- 实现外部服务适配器

### 接口层 (Interfaces)

- 处理外部请求（HTTP、WebSocket、RPC）
- 数据转换（DTO ↔ 领域对象）
- 路由配置和中间件

---

## 客户端通信架构

| 客户端 | 通信方式 | 经过 Nginx | 目标服务 |
|--------|----------|------------|----------|
| 管理后台 | HTTP/REST | ✅ | Gin (webadmin) |
| 管理后台(客服) | WebSocket | ✅ | Nakama Server |
| 代理后台 | HTTP/REST | ✅ | Gin (webproxy) |
| 游戏客户端 | WebSocket | ✅ | Nakama Server |

**关键点**：

- Gin 仅服务于管理后台和代理后台的 HTTP API
- 所有 WebSocket 连接（游戏客户端、客服）都直接连接 Nakama
- 客户端不与 Gin 直接通信，全部通过 Nginx 反向代理
- 在docker中运行服务端，本地环境运行node

---

## 服务部署模式

### 模式一：一体化部署

- Nakama 和 WebAdmin 在同一进程
- 适用于开发环境和小规模部署

### 模式二：分离部署

- WebAdmin 作为独立服务运行
- 适用于多机部署和负载均衡
- 共享同一份配置文件

---

## 开发规范

### 包导入规则

- 领域层：`warforge-server/internal/domain/*`
- 应用层：`warforge-server/internal/application/*`
- 基础设施层：`warforge-server/internal/infrastructure/*`
- 接口层：`warforge-server/internal/interfaces/*`
- 公共包：`warforge-server/pkg/*`
- 数据库工具：`warforge-server/database`
- 配置：`warforge-server/config`

### 命名约定

- 领域实体：`Entity`（如 `User`, `AdminUser`）
- 值对象：`VO` 后缀（如 `Money`, `GameType`）
- 仓库接口：`Repository`
- 用例：`UseCase` 后缀（如 `GetUserUseCase`）
- 服务：`Service` 后缀（如 `UserService`）

---

## 数据库迁移模块

### 模块架构

```
server/migrations/
├── migration.go           # 迁移接口定义
├── manager.go             # 迁移管理器
├── registry.go            # 迁移注册表
└── modules/               # 模块化迁移文件
    ├── 001_admin.go       # 管理员模块 (用户、角色、权限)
    ├── 002_content.go     # 内容模块 (语言、内容、Banner)
    ├── 003_email.go       # 邮件模块 (配置、模板、日志)
    ├── 004_system.go      # 系统模块 (系统配置)
    └── 005_storage.go     # 存储模块 (存储配置、上传记录)
```

### 迁移接口

```go
type Migration interface {
    Version() string      // 版本号 (如 "001")
    Module() string       // 模块名 (如 "admin")
    Up(db *sql.DB) error  // 创建/更新表结构
    Down(db *sql.DB) error // 回滚（可选）
    Seed(db *sql.DB) error // 插入默认数据
}
```

### 配置开关

```yaml
# config/config.yaml
migration:
  auto_run: true   # 是否自动运行迁移（生产环境建议关闭）
  auto_seed: true  # 是否自动插入默认数据
```

### 迁移执行流程

1. 服务启动时检查配置 `migration.auto_run`
2. 创建版本控制表 `wf_schema_migrations`
3. 扫描 `modules/` 目录下的迁移文件
4. 按版本号排序执行未执行的迁移
5. 记录执行结果到版本控制表

### 添加新迁移模块

1. 在 `migrations/modules/` 创建新文件，如 `006_newmodule.go`
2. 实现 `Migration` 接口
3. 在 `init()` 函数中注册：`migrations.Register(NewNewModuleMigration())`

### 版本控制表

```sql
CREATE TABLE wf_schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
);
```

### 默认数据

每个迁移模块的 `Seed()` 方法负责插入默认数据：

- 使用 `INSERT ... ON CONFLICT DO NOTHING` 避免重复插入
- 使用 `INSERT ... ON CONFLICT DO UPDATE` 更新已有数据
- 可通过配置 `auto_seed` 控制是否执行
