# WarForge Server 概述

> WarForge 游戏服务器端 - 基于 Nakama 的游戏后端服务
>
> 创建日期：2026-04-03
>
> 最后更新：2026-04-04

**数据库名称：** `nakama`

## 项目简介

WarForge Server 是基于 Nakama 游戏服务器框架开发的游戏后端服务，提供用户认证、游戏匹配、机器人 AI、实时通信等功能。采用 Go 语言开发，包含 Nakama 运行时扩展和 Gin HTTP API 服务。

---

## 技术选型

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| Go | 1.26.1 | 编程语言 |
| Nakama | 3.33.0 | 游戏服务器框架 |
| nakama-common | v1.45.0 | Nakama 运行时 API |
| Gin | v1.9.1 | HTTP 框架（管理后台/代理后台） |
| CockroachDB | - | 分布式 SQL 数据库 |

### 依赖库

| 库 | 版本 | 说明 |
|------|------|------|
| golang-jwt/jwt | v5.2.0 | JWT 认证 |
| golang.org/x/crypto | v0.49.0 | 密码加密（bcrypt） |
| google.golang.org/protobuf | v1.36.11 | Protocol Buffers |

---

## 目录结构

```
server/
├── cmd/                       # 入口目录
│   └── main.go                # Nakama 模块初始化入口
│
├── nakama/                    # Nakama 服务端相关
│   ├── api/                   # Nakama API 定义（WebSocket/Protobuf）
│   ├── rpc/                   # RPC 客户端封装（调用 Nakama 核心 API）
│   ├── hooks/                 # Nakama 钩子函数（服务端运行时）
│   ├── match/                 # 权威匹配器
│   ├── shared/                # 共用工具/类型
│   ├── games/                 # 游戏模块
│   │   ├── common/            # 游戏通用逻辑
│   │   └── {game_name}/       # 具体游戏目录
│   ├── services/              # 业务服务模块（背包、商城、邮件等）
│   ├── storage/               # Storage Collection 定义
│   └── event/                 # 事件/消息处理
│
├── webadmin/                  # Gin HTTP API（管理员后台）
│   ├── api/                   # 管理后台 API 定义
│   ├── handlers/              # 处理器
│   ├── middleware.go          # 中间件
│   ├── routes.go              # 路由
│   └── jwtutil/               # JWT 工具
│
├── webproxy/                  # Gin HTTP API（代理后台）
│   ├── api/                   # 代理后台 API 定义
│   ├── handlers/
│   ├── middleware.go
│   └── routes.go
│
├── database/                  # 数据库连接 + Redis Key
│   ├── database.go            # 数据库连接 初始化
│   └── redis_keys.go          # Redis Key 统一定义
│
├── models/                    # 数据模型（原生SQL）
│   ├── admin_user.go          # 管理员用户
│   ├── admin_role.go          # 角色
│   ├── admin_permission.go    # 权限
│   └── admin_relations.go     # 关联表
│
├── config/                    # 配置文件和加载
│   └── config.yaml            # 服务器配置
│
├── migrations/                # 数据库迁移文件
│
├── internal/                  # 私有包（不对外暴露）
│
└── pkg/                       # 公共包（可被外部引用）
```

---

## 核心模块说明

### 1. Nakama 模块 (`nakama/`)

Nakama 服务端相关功能，包括：

| 目录 | 功能 | 说明 |
|------|------|------|
| `api/` | API 定义 | WebSocket 消息、Protobuf 定义 |
| `rpc/` | RPC 封装 | Nakama 核心 API 客户端封装 |
| `hooks/` | 钩子函数 | 运行时事件钩子 |
| `match/` | 匹配器 | 权威匹配器 |
| `games/` | 游戏逻辑 | 游戏房间、状态同步 |
| `services/` | 业务服务 | 背包、商城、邮件等扩展功能 |
| `shared/` | 共用代码 | 常量、工具、类型 |

### 2. WebAdmin 模块 (`webadmin/`)

管理员后台 HTTP API，包括：

| 功能 | 说明 |
|------|------|
| 用户认证 | 登录、JWT Token 管理 |
| RBAC 权限 | 角色、权限管理 |
| 动态路由 | 基于权限的菜单路由 |
| 管理员管理 | 管理员 CRUD |
| 存储管理 | 存储配置管理 |

### 3. WebProxy 模块 (`webproxy/`)

代理后台 HTTP API，包括：

| 功能 | 说明 |
|------|------|
| 代理认证 | 登录、JWT Token 管理 |
| 代理管理 | 代理层级、佣金统计 |
| 玩家管理 | 代理下玩家管理 |

---

## 双轨认证系统

| 系统 | 用户类型 | 认证方式 | Token 存储 |
|------|----------|----------|------------|
| Nakama 认证 | 游戏玩家 | Nakama Session | Nakama 内部 |
| Admin 认证 | 后台管理员 | 自定义 JWT | Redis |
| Proxy 认证 | 代理用户 | 自定义 JWT | Redis |

---

## 配置说明

### config.yaml 主要配置项

```yaml
# Nakama 配置
nakama:
  host: "127.0.0.1"
  port: 7350
  http_key: "defaultkey"

# 数据库配置
database:
  host: "127.0.0.1"
  port: 26257
  name: "nakama"
  user: "nakama"
  password: "nakama"

# Redis 配置
redis:
  host: "127.0.0.1"
  port: 6379
  db: 0

# WebAdmin 配置
web_admin:
  enabled: true
  port: 9527
  secret_key: "your-secret-key"

# WebProxy 配置
web_proxy:
  enabled: true
  port: 9528
  secret_key: "your-proxy-secret-key"
```

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [04_ARCHITECTURE.md](./04_ARCHITECTURE.md) | 架构设计 |
| [05_DATABASE_DESIGN.md](./05_DATABASE_DESIGN.md) | 数据库设计 |
| [08_NAKAMA_API_REFERENCE.md](./08_NAKAMA_API_REFERENCE.md) | Nakama API 参考 |
| [09_NAKAMA_MODULES.md](./09_NAKAMA_MODULES.md) | Nakama 模块参考 |
