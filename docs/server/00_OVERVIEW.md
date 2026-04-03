# WarForge Server 概述

> WarForge 游戏服务器端 - 基于 Nakama 的游戏后端服务
>
> 创建日期：2026-04-03

## 项目简介

WarForge Server 是基于 Nakama 游戏服务器框架开发的游戏后端服务，提供用户认证、游戏匹配、机器人 AI、实时通信等功能。采用 Go 语言开发，作为 Nakama 的插件运行。

---

## 技术选型

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| Go | 1.26.1 | 编程语言 |
| Nakama | 3.33.0 | 游戏服务器框架 |
| nakama-common | v1.45.0 | Nakama 运行时 API |
| CockroachDB | - | 分布式 SQL 数据库 |

### 依赖库

| 库 | 版本 | 说明 |
|------|------|------|
| golang.org/x/crypto | v0.49.0 | 密码加密（bcrypt） |
| google.golang.org/protobuf | v1.36.11 | Protocol Buffers |

---

## 目录结构

```
d:\geme\server\
├── adapter/                 # 适配器层
│   └── adapter.go           # 适配器接口定义
├── cmd/                     # 程序入口
│   └── main.go              # 主程序（用于本地测试）
├── config/                  # 配置文件
│   └── config.yaml          # 服务器配置
├── docker/                  # Docker 相关
│   ├── Dockerfile           # Docker 构建文件
│   └── setup.bat            # Docker 构建脚本
├── migrations/              # 数据库迁移
│   └── 001_admin_rbac.sql   # RBAC 权限系统表结构
├── modules/                 # 功能模块
│   ├── admin/               # 管理后台模块
│   │   └── admin.go         # 认证、RBAC、路由
│   ├── bot/                 # 机器人模块
│   │   ├── bot.go           # 机器人管理
│   │   ├── init.go          # 初始化
│   │   ├── niuniu_ai.go     # 牛牛 AI
│   │   └── texas_ai.go      # 德州 AI
│   ├── hiro/                # Hiro 模块
│   │   └── hiro.go          # Hiro 相关功能
│   ├── hooks/               # 钩子模块
│   │   └── hooks.go         # 事件钩子
│   ├── match/               # 匹配模块
│   │   └── match.go         # 游戏匹配逻辑
│   └── rpc/                 # RPC 模块
│       └── rpc.go           # RPC 注册
└── go.mod                   # Go 模块定义
```

---

## 核心模块说明

### 1. Admin 模块 (`modules/admin/`)

管理后台相关功能，包括：

| 功能 | 说明 |
|------|------|
| 用户认证 | 登录、Token 管理 |
| RBAC 权限 | 角色、权限管理 |
| 动态路由 | 基于权限的菜单路由 |

**RPC 函数**：

- `admin_login` - 管理员登录
- `admin_get_user_info` - 获取用户信息
- `admin_refresh_token` - 刷新 Token
- `admin_get_routes` - 获取动态路由
- `admin_check_route` - 检查路由权限

### 2. Bot 模块 (`modules/bot/`)

游戏机器人 AI，包括：

| 功能 | 说明 |
|------|------|
| 牛牛 AI | 牛牛游戏机器人逻辑 |
| 德州 AI | 德州扑克机器人逻辑 |
| 机器人管理 | 创建、配置、控制机器人 |

### 3. Match 模块 (`modules/match/`)

游戏匹配功能：

| 功能 | 说明 |
|------|------|
| 匹配逻辑 | 玩家匹配算法 |
| Match 创建 | 创建游戏房间 |
| 状态管理 | 游戏状态流转 |

### 4. Hooks 模块 (`modules/hooks/`)

事件钩子：

| 钩子 | 说明 |
|------|------|
| 用户注册钩子 | 用户注册后处理 |
| 用户登录钩子 | 用户登录后处理 |
| 匹配钩子 | 匹配事件处理 |

---

## 运行方式

### Docker 方式（推荐）

```bash
# 构建镜像
cd docker
./setup.bat

# 或手动构建
docker build -t warforge-server .
```

### 本地开发

```bash
# 进入项目目录
cd server

# 下载依赖
go mod tidy

# 编译插件（需要在 Linux 环境）
go build -buildmode=plugin -o warforge_server.so
```

---

## 数据库迁移

### 迁移文件

| 文件 | 说明 |
|------|------|
| `001_admin_rbac.sql` | RBAC 权限系统表结构 |

### 执行迁移

```bash
# 使用 CockroachDB 客户端
cockroach sql --host=localhost:26257 --database=nakama < migrations/001_admin_rbac.sql
```

---

## 配置说明

### config.yaml

```yaml
# 服务器配置示例
nakama:
  host: "127.0.0.1"
  port: 7350
  
database:
  host: "localhost"
  port: 26257
  name: "nakama"
```

---

## 与前端通信

### RPC 调用

前端通过 Nakama HTTP API 调用服务端 RPC：

```
POST /v2/rpc/{rpc_id}
Authorization: Bearer {token}
Content-Type: application/json

{request_body}
```

### WebSocket

前端通过 Nakama WebSocket 进行实时通信：

```
ws://localhost:7350/ws?token={token}
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./00_OVERVIEW.md) | 项目概述（本文档） |
| [01_ADMIN_MODULE.md](./01_ADMIN_MODULE.md) | 管理后台模块（认证、RBAC） |
| [02_BOT_MODULE.md](./02_BOT_MODULE.md) | 机器人模块（AI 逻辑） |
| [03_MATCH_MODULE.md](./03_MATCH_MODULE.md) | 匹配模块（游戏匹配） |
| [04_ARCHITECTURE.md](./04_ARCHITECTURE.md) | 架构设计（技术栈、目录结构） |
| [05_DATABASE_DESIGN.md](./05_DATABASE_DESIGN.md) | 数据库设计（表结构、Redis Key） |
| [06_TEST_ENVIRONMENT.md](./06_TEST_ENVIRONMENT.md) | 测试环境配置（Docker、验证） |
| [07_PROTOCOL_MAPPING.md](./07_PROTOCOL_MAPPING.md) | 协议映射（老客户端兼容） |
| [08_NAKAMA_API_REFERENCE.md](./08_NAKAMA_API_REFERENCE.md) | Nakama API 参考（Runtime 接口） |

> 💡 新增模块时，请在此表格中添加文档链接，文件命名格式：`NN_模块名称.md`

---

## 开发规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| RPC 函数 | snake_case | `admin_login` |
| Go 函数 | camelCase | `adminLogin` |
| 结构体 | PascalCase | `RouteItem` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PLAYERS` |

### 模块规范

- 每个模块放在 `modules/` 下独立目录
- 模块入口文件与目录同名
- 导出 `InitModule` 函数供主程序调用

### 错误处理

```go
// 返回 JSON 格式错误
if err != nil {
    return `{"error":"Database error"}`, nil
}
```

---

## 相关链接

- [Nakama 官方文档](https://heroiclabs.com/docs/nakama/)
- [Nakama Go Runtime](https://heroiclabs.com/docs/nakama/server-framework/go-runtime/)
- [nakama-common API](https://pkg.go.dev/github.com/heroiclabs/nakama-common/runtime)
- [CockroachDB 文档](https://www.cockroachlabs.com/docs/)
