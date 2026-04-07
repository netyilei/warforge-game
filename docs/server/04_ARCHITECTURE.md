# 架构设计

> WarForge Server 整体架构设计
>
> 创建日期：2026-04-03
>
> 最后更新：2026-04-06

---

## 架构演进

> **重要说明：** 项目正在进行 DDD 架构升级，详见 [11_DDD_ARCHITECTURE.md](./11_DDD_ARCHITECTURE.md)

当前架构正在从 **扁平结构** 向 **DDD 分层架构** 演进：

| 阶段 | 状态 | 说明 |
|------|------|------|
| 当前架构 | 运行中 | 现有代码可正常运行 |
| DDD 架构 | 进行中 | 新功能按 DDD 架构开发 |
| 迁移完成 | 待定 | 所有代码迁移到 DDD 架构 |

---

## 技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 游戏服务器 | Nakama 3.33.0 | 开源游戏服务器框架 |
| 运行时扩展 | Go 1.26.1 Runtime | 自定义 Match Handler、RPC |
| 游戏框架 | **Hiro v1.32.0** | 成就、任务、排行榜系统 |
| 数据库 | CockroachDB v23 | Nakama 官方推荐，分布式 SQL 数据库 |
| 缓存 | Redis | Nakama 内置缓存 + 自定义缓存 |
| HTTP 框架 | Gin | 管理后台/代理后台 API |
| 对象存储 | AWS SDK for Go v2 | S3 兼容存储（Cloudflare R2、AWS S3） |

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           客户端层                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   管理后台              代理后台              游戏客户端             │
│   (Vue3)               (Vue3)               (Cocos/PixiJS)         │
│       │                    │                      │                 │
│       │ HTTP/REST          │ HTTP/REST            │ WebSocket       │
│       │ (客服WS除外)       │                      │                 │
│       ▼                    ▼                      ▼                 │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      Nginx 反向代理                         │   │
│   │                                                             │   │
│   │  • 管理后台/代理后台 HTTP → Gin Server                      │   │
│   │  • 客服 WebSocket → Nakama Server                           │   │
│   │  • 游戏客户端 WebSocket → Nakama Server                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                    │                    │                │           │
│                    │                    │                │           │
│                    ▼                    ▼                ▼           │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      Gin HTTP Server                        │   │
│   │                                                             │   │
│   │  webadmin/              webproxy/                           │   │
│   │  (管理员后台API)        (代理后台API)                        │   │
│   │                                                             │   │
│   │  注：Gin 仅提供 HTTP API，不提供 WebSocket 服务              │   │
│   │       客服聊天通过 Nakama WebSocket 实现                     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                            │        │
│                                                            │        │
│                                                            ▼        │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      Nakama Server                          │   │
│   │                                                             │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │ nakama/rpc/  (RPC 客户端封装)                       │   │   │
│   │  │                                                     │   │   │
│   │  │  user.go    friend.go    match.go    group.go      │   │   │
│   │  │  (用户)     (好友)       (匹配)       (群组)        │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   │                          │                                  │   │
│   │                          ▼                                  │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │ nakama/games/  (游戏模块)                           │   │   │
│   │  │                                                     │   │   │
│   │  │  common/    texas/    niuniu/    doudizhu/         │   │   │
│   │  │  (通用)     (德州)    (牛牛)      (斗地主)          │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   │                                                             │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │ Nakama 内置能力                                     │   │   │
│   │  │                                                     │   │   │
│   │  │  Matchmaker │ Leaderboard │ Storage │ Chat │ Party │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         数据层                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────────────┐          ┌───────────────────┐             │
│   │   CockroachDB    │          │      Redis        │             │
│   │                   │          │                   │             │
│   │ • 用户数据        │          │ • 会话缓存        │             │
│   │ • Storage Objects │          │ • Match 状态      │             │
│   │ • 管理员数据      │          │ • Admin Token     │             │
│   │ • 代理数据        │          │ • 在线状态        │             │
│   └───────────────────┘          └───────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 客户端与服务端通信关系

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

---

## 双轨认证系统

| 系统 | 用户类型 | 认证方式 | Token 存储 |
|------|----------|----------|------------|
| Nakama 认证 | 游戏玩家 | Nakama Session | Nakama 内部 |
| Admin 认证 | 后台管理员 | 自定义 JWT | Redis |
| Proxy 认证 | 代理用户 | 自定义 JWT | Redis |

---

## 项目目录结构

```
server/
├── cmd/                       # 入口目录
│   └── main.go                # Nakama 模块初始化入口
│
├── nakama/                    # Nakama 服务端相关
│   ├── api/                   # Nakama API 定义
│   │   ├── ws/                # WebSocket 消息定义
│   │   │   ├── opcode.go      # 操作码定义
│   │   │   ├── message.go     # 消息结构定义
│   │   │   └── notify.go      # 通知消息定义
│   │   └── proto/             # Protobuf 定义
│   │
│   ├── rpc/                   # RPC 客户端封装（调用 Nakama 核心 API）
│   │   ├── client.go          # 基础 RPC 客户端
│   │   ├── user.go            # 用户管理 RPC
│   │   ├── friend.go          # 好友系统 RPC
│   │   ├── match.go           # 匹配系统 RPC
│   │   ├── group.go           # 群组/房间 RPC
│   │   └── leaderboard.go     # 排行榜 RPC
│   │
│   ├── hooks/                 # Nakama 钩子函数（服务端运行时）
│   │   ├── match.go           # 匹配钩子
│   │   ├── leaderboard.go     # 排行榜钩子
│   │   └── tournament.go      # 锦标赛钩子
│   │
│   ├── match/                 # 权威匹配器
│   │   └── handler.go         # 匹配处理器
│   │
│   ├── shared/                # 共用工具/类型
│   │   ├── constants.go       # 常量定义
│   │   ├── utils.go           # 工具函数
│   │   └── types.go           # 共用类型/结构体
│   │
│   ├── games/                 # 游戏模块
│   │   ├── common/            # 游戏通用逻辑
│   │   │   ├── base.go        # 游戏基类/接口
│   │   │   ├── room.go        # 通用房间逻辑
│   │   │   └── player.go      # 通用玩家状态
│   │   └── {game_name}/       # 具体游戏目录
│   │       ├── handler.go     # 游戏逻辑处理
│   │       └── match.go       # 游戏匹配逻辑
│   │
│   ├── services/              # 业务服务模块（扩展功能）
│   │   ├── inventory/         # 用户物品/背包
│   │   │   ├── rpc.go         # RPC 接口
│   │   │   ├── storage.go     # Storage 定义
│   │   │   └── logic.go       # 业务逻辑
│   │   ├── shop/              # 商城系统
│   │   ├── mail/              # 邮件系统
│   │   ├── achievement/       # 成就系统
│   │   └── task/              # 任务系统
│   │
│   ├── storage/               # Storage Collection 定义
│   │   └── collections.go     # 全局 Collection 定义
│   │
│   └── event/                 # 事件/消息处理
│       └── notifier.go        # 通知推送
│
├── webadmin/                  # Gin HTTP API（管理员后台）
│   ├── api/                   # 管理后台 API 定义
│   │   ├── v1/                # 版本控制
│   │   └── types.go           # 请求/响应类型定义
│   ├── handlers/              # 处理器
│   ├── middleware.go          # 中间件
│   ├── routes.go              # 路由
│   └── jwtutil/               # JWT 工具
│
├── webproxy/                  # Gin HTTP API（代理后台）
│   ├── api/                   # 代理后台 API 定义
│   │   ├── v1/
│   │   └── types.go
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
├── migrations/                # 数据库迁移模块
│   ├── migration.go           # 迁移接口定义
│   ├── manager.go             # 迁移管理器
│   ├── registry.go            # 迁移注册表
│   └── modules/               # 模块化迁移文件
│       ├── 001_admin.go       # 管理员模块
│       ├── 002_content.go     # 内容模块
│       ├── 003_email.go       # 邮件模块
│       ├── 004_system.go      # 系统模块
│       └── 005_storage.go     # 存储模块
│
├── internal/                  # 私有包（不对外暴露）
│
└── pkg/                       # 公共包（可被外部引用）
```

---

## 模块职责划分

### Nakama 模块 (`nakama/`)

| 目录 | 职责 | 调用方 |
|------|------|--------|
| `api/` | WebSocket/Protobuf 定义 | 游戏客户端 |
| `rpc/` | Nakama 核心 API 封装 | Gin / Nakama 内部 |
| `hooks/` | Nakama 运行时钩子 | Nakama 运行时 |
| `match/` | 权威匹配器 | Nakama 运行时 |
| `games/` | 游戏业务逻辑 | Nakama 运行时 |
| `services/` | 业务扩展模块 | Nakama 运行时 |
| `shared/` | 共用工具和类型 | 所有模块 |

### Gin 模块 (`webadmin/`, `webproxy/`)

| 目录 | 职责 | 用户 |
|------|------|------|
| `webadmin/` | 管理员后台 API | 管理员 |
| `webproxy/` | 代理后台 API | 代理用户 |

### 公共模块

| 目录 | 职责 |
|------|------|
| `database/` | 数据库连接、Redis Key 管理 |
| `models/` | 原生SQL 数据模型 |
| `config/` | 配置加载 |
| `internal/` | 私有包 |
| `pkg/` | 公共包 |

---

## Nakama 提供的能力

| 能力 | Nakama 模块 | 说明 |
|------|-------------|------|
| 用户认证 | Authentication | 设备ID、邮箱、社交账号登录 |
| 好友系统 | Friends | 添加好友、黑名单、在线状态 |
| 匹配系统 | Matchmaker | 实时匹配、房间分配 |
| 房间系统 | Match | 游戏房间、状态同步 |
| 排行榜 | Leaderboard | 全球/好友排行榜 |
| 聊天系统 | Chat | 实时聊天、频道 |
| 存储系统 | Storage | 玩家数据持久化 |
| 群组系统 | Group | 公会、俱乐部 |

---

## 客服系统设计

客服聊天复用 Nakama 聊天系统：

```
客服前端 → 登录 webadmin HTTP API → 获取 JWT + Nakama Session
         → 连接 Nakama WebSocket → 与玩家通信
```

客服账号作为 Nakama 特殊用户，复用 Nakama 聊天能力。
