# Task Plan: Nakama 游戏服务器开发

## Goal

使用 Nakama 框架重构德州扑克游戏服务器，通过协议翻译层兼容老客户端，最终实现：

1. 老客户端无缝切换到新服务器
2. 新客户端使用 Nakama 原生协议
3. 支持多游戏扩展（德州、牛牛、斗地主、麻将）

---

## 开发策略

**渐进式开发，风险可控：**

```
管理后台 → API翻译层 → 非游戏功能测试 → 游戏逻辑迁移 → 客户端重构
   ↓           ↓             ↓               ↓              ↓
  低风险      中风险        验证通过         高风险         最后一步
```

---

## Phases

### Phase 1: 基础设施搭建

**Status:** `completed`
**Goal:** 完成项目初始化和开发环境

**Tasks:**

- [x] 创建项目目录结构
- [x] 配置 docker-compose.yml (Nakama + CockroachDB + Redis)
- [x] 初始化 Go Module
- [x] 编写 main.go 入口文件
- [x] 验证 Nakama 控制台可访问
- [x] 创建 Docker 构建脚本 (build-and-deploy.bat)
- [x] 配置 CockroachDB 数据库
- [x] 配置 Redis 缓存
- [x] 实现数据库迁移脚本

**Files Created:**

```
game-server/
├── cmd/main.go
├── modules/
├── storage/
├── adapter/
├── config/
├── docker/
│   ├── Dockerfile
│   └── setup.bat
└── build-and-deploy.bat
```

---

### Phase 2: Admin 管理后台 Web

**Status:** `completed`
**Goal:** 实现管理后台前端界面

**Tasks:**

- [x] 创建 admin-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 登录页面
- [x] 布局框架 (侧边栏 + 头部 + 内容区)
- [x] 用户管理页面
- [x] 管理员管理页面
- [x] 角色管理页面
- [x] 权限管理页面
- [ ] 代理管理页面
- [ ] 系统配置页面
- [ ] 数据统计页面
- [x] RBAC 权限系统
- [x] 动态路由
- [x] 主题切换（明暗模式）
- [x] 多标签页
- [x] 国际化支持
- [x] Vite 代理配置
- [x] 状态管理 (Pinia)

**Tech Stack:**

- Vue 3 + TypeScript
- Naive UI 组件库
- Pinia 状态管理
- Axios / Alova 请求封装
- UnoCSS 原子化 CSS
- Elegant Router 自动路由

---

### Phase 2.1: Proxy 代理管理后台 Web

**Status:** `completed`
**Goal:** 实现代理管理后台前端界面

**Tasks:**

- [x] 创建 proxy-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 复制 admin-web 基础框架
- [x] 配置独立端口 (8207)
- [x] 更新项目配置和描述
- [x] 登录页面
- [x] 布局框架
- [x] 代理专属页面
- [x] 权限控制

---

### Phase 3: Admin API 接口

**Status:** `completed`
**Goal:** 实现管理后台所需的后端接口

**Tasks:**

- [x] 管理员认证模块
  - [x] 管理员登录/登出
  - [x] JWT Token 验证
  - [x] 权限中间件
- [x] RBAC 权限管理
  - [x] 角色管理
  - [x] 权限管理
  - [x] 动态路由生成
- [x] 目录重构
  - [x] 创建 nakama/ 目录结构
  - [x] 创建 nakama/rpc/ RPC 接口实现
  - [x] 创建 nakama/api/ws/ WebSocket 消息定义
  - [x] 创建 nakama/shared/ 共用工具
  - [x] 创建 nakama/games/common/ 游戏通用逻辑
  - [x] 创建 nakama/services/ 业务服务模块
  - [x] 创建 nakama/hooks/ 钩子函数
  - [x] 创建 nakama/match/ 权威匹配器
  - [x] 创建 nakama/storage/ Storage Collection 定义
  - [x] 创建 nakama/event/ 事件处理
  - [x] 创建 webproxy/ 目录结构
  - [x] 创建 internal/ 和 pkg/ 目录
  - [x] 更新 main.go 引用新包路径
  - [x] 添加中文注释到所有新文件
  - [x] 添加代码注释红线规则到 RED_LINES.md
- [x] 内容管理模块
  - [x] 内容分类 CRUD
  - [x] Banner 管理
  - [x] Banner 位置管理
- [x] 语言管理模块
  - [x] 语言列表
  - [x] 语言启用/禁用
  - [x] 默认语言设置
- [x] 存储管理模块
  - [x] 存储配置 CRUD
  - [x] 上传记录查询
- [x] 操作日志
  - [x] 操作日志记录中间件
  - [x] 操作日志查询接口
- [x] 数据库迁移
  - [x] 整合迁移脚本 (000_init_complete.sql)
  - [x] 内容管理相关表
  - [x] 语言表
  - [x] 存储相关表
  - [x] 操作日志表
- [x] 文档更新
  - [x] 路由配置指南 (ROUTE_CONFIGURATION_GUIDE.md)
  - [x] 开发问题记录 (DEVELOPMENT_ISSUES.md)
  - [x] 更新 RBAC 系统文档
  - [x] 更新数据库设计文档
  - [x] 更新前端概述文档

**Target Directory Structure:**

```
server/
├── cmd/
│   └── main.go
├── nakama/
│   ├── api/ws/
│   ├── rpc/
│   ├── hooks/
│   ├── match/
│   ├── shared/
│   ├── games/common/
│   ├── services/
│   ├── storage/
│   └── event/
├── webadmin/
│   ├── api/v1/
│   ├── handlers/
│   ├── middleware.go
│   ├── routes.go
│   └── jwtutil/
├── webproxy/
│   ├── api/v1/
│   ├── handlers/
│   ├── middleware.go
│   └── routes.go
├── database/
├── models/
├── config/
├── migrations/
├── internal/
└── pkg/
```

---

### Phase 3.5: DDD 架构升级

**Status:** `in_progress`
**Goal:** 将项目升级为领域驱动设计（DDD）分层架构

**背景：**

当前架构存在以下问题：

- `modules/` 和 `nakama/` 目录职责重叠
- 缺少 `internal/` 和 `pkg/` 目录的规范使用
- 游戏模块分散，缺少统一管理
- Gin 服务与 Nakama 插件耦合
- 多机部署配置管理困难

**目标架构：**

```
server/
├── cmd/                              # 应用入口（独立编译）
│   ├── nakama/main.go                # Nakama 插件入口 → warforge.so
│   └── webadmin/main.go              # Gin 服务入口 → webadmin.exe
│
├── config/                           # 统一配置（支持多机部署）
│
├── internal/                         # 私有包
│   ├── domain/                       # 【领域层】核心业务逻辑
│   │   ├── shared/                   # 共享领域概念
│   │   ├── user/                     # 用户领域
│   │   ├── game/                     # 游戏领域
│   │   │   ├── shared/               # 游戏共享逻辑
│   │   │   ├── texas/                # 德州扑克
│   │   │   ├── niuniu/               # 牛牛
│   │   │   └── slots/                # 老虎机（HTTP 游戏）
│   │   ├── gameconfig/               # 游戏配置领域
│   │   ├── bot/                      # 机器人领域
│   │   └── inventory/                # 背包领域
│   │
│   ├── application/                  # 【应用层】用例/应用服务
│   │   ├── game/                     # 游戏应用服务
│   │   ├── player/                   # 玩家管理应用服务
│   │   └── admin/                    # 管理应用服务
│   │
│   ├── infrastructure/               # 【基础设施层】
│   │   ├── persistence/              # 持久化实现
│   │   ├── nakama/                   # Nakama 基础设施
│   │   └── external/                 # 外部服务
│   │
│   └── interfaces/                   # 【接口层】入口点
│       ├── nakama/                   # Nakama 接口
│       │   ├── rpc/                  # RPC 处理器
│       │   ├── match/                # Match Handler
│       │   └── hooks/                # 生命周期钩子
│       └── http/                     # HTTP 接口
│           ├── webadmin/             # 管理后台 API
│           └── webproxy/             # 代理后台 API
│
└── pkg/                              # 公共包
```

**Tasks:**

- [x] Phase 3.5.1: 创建领域层框架
  - [x] 创建 internal/domain/shared/ 基础结构
  - [x] 定义 Entity、ValueObject、Repository 接口
  - [x] 定义领域错误类型
  - [x] 创建 internal/domain/user/ 用户领域
  - [x] 创建 internal/domain/gameconfig/ 游戏配置领域

- [x] Phase 3.5.2: 创建基础设施层
  - [x] 创建 internal/infrastructure/persistence/cockroachdb/
  - [x] 实现 UserRepository
  - [x] 创建 internal/infrastructure/nakama/ Nakama 客户端封装
  - [x] 创建 internal/infrastructure/database/ 数据库连接

- [x] Phase 3.5.3: 创建应用层
  - [x] 创建 internal/application/player/ 玩家应用服务
  - [x] 创建 internal/application/game/ 游戏应用服务
  - [x] 创建 internal/application/admin/ 管理应用服务
  - [x] 定义 DTO 和 Mapper

- [x] Phase 3.5.4: 重构接口层
  - [x] 创建 internal/interfaces/nakama/rpc/ RPC 适配器
  - [x] 创建 internal/interfaces/nakama/match/ Match 适配器
  - [x] 创建 internal/interfaces/http/webadmin/ HTTP 适配器
  - [x] 分离 Admin 路由到独立目录

- [x] Phase 3.5.5: Gin 服务独立化
  - [x] 创建 cmd/webadmin/main.go 独立入口
  - [x] 创建 cmd/nakama/main.go 独立入口
  - [x] 配置支持环境变量覆盖

- [ ] Phase 3.5.6: 迁移现有代码
  - [ ] 迁移 modules/admin → internal/domain/admin
  - [ ] 迁移 modules/bot → internal/domain/bot
  - [ ] 迁移 nakama/rpc → internal/interfaces/nakama/rpc
  - [ ] 迁移 nakama/match → internal/interfaces/nakama/match
  - [ ] 迁移 webadmin → internal/interfaces/http/webadmin

- [x] Phase 3.5.7: 文档更新
  - [x] 创建 docs/server/11_DDD_ARCHITECTURE.md
  - [x] 更新 docs/server/04_ARCHITECTURE.md
  - [x] 更新 docs/server/00_OVERVIEW.md
  - [x] 更新 README.md

**已完成文件：**

```
server/
├── cmd/
│   ├── nakama/main.go              # Nakama 插件入口
│   └── webadmin/main.go            # Gin 服务入口
│
├── internal/
│   ├── domain/
│   │   ├── shared/
│   │   │   ├── entity.go           # Entity 基础接口
│   │   │   ├── value_object.go     # ValueObject 接口
│   │   │   ├── repository.go       # Repository 接口
│   │   │   └── errors.go           # 领域错误
│   │   ├── user/
│   │   │   ├── user.go             # 用户实体
│   │   │   ├── value_objects.go    # 值对象
│   │   │   ├── repository.go       # 仓储接口
│   │   │   └── service.go          # 领域服务
│   │   └── gameconfig/
│   │       ├── game.go             # 游戏定义
│   │       ├── room_template.go    # 房间模板
│   │       ├── tournament.go       # 比赛配置
│   │       ├── bot_config.go       # 机器人配置
│   │       ├── winrate_config.go   # 胜率配置
│   │       ├── repository.go       # 仓储接口
│   │       └── service.go          # 领域服务
│   │
│   ├── application/
│   │   ├── shared/
│   │   │   └── usecase.go          # 用例基础接口
│   │   ├── player/
│   │   │   └── user_usecase.go     # 用户用例
│   │   ├── admin/
│   │   │   └── game_usecase.go     # 游戏管理用例
│   │   └── game/
│   │       └── game_usecase.go     # 游戏用例
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── db.go               # 数据库连接
│   │   ├── persistence/
│   │   │   ├── cockroachdb/
│   │   │   │   └── user_repository.go
│   │   │   └── redis/
│   │   │       └── client.go       # Redis 客户端
│   │   └── nakama/
│   │       └── adapter.go          # Nakama 适配器
│   │
│   └── interfaces/
│       ├── nakama/
│       │   ├── rpc/
│       │   │   └── game_rpc.go     # 游戏 RPC
│       │   └── match/
│       │       └── match_handler.go # Match Handler
│       └── http/
│           └── webadmin/
│               ├── handler/
│               │   ├── game_handler.go
│               │   └── user_handler.go
│               ├── middleware/
│               │   └── middleware.go
│               └── router/
│                   └── router.go
│
└── pkg/
    ├── errors/
    │   └── errors.go               # 应用错误
    ├── logger/
    │   └── logger.go               # 日志工具
    ├── crypto/
    │   └── crypto.go               # 加密工具
    └── utils/
        └── utils.go                # 工具函数
```

**详细施工流程：**

```
Step 1: 创建目录结构
────────────────────────────────────────────────────────────────
mkdir -p server/internal/domain/shared
mkdir -p server/internal/domain/user
mkdir -p server/internal/domain/game/shared
mkdir -p server/internal/domain/game/texas
mkdir -p server/internal/domain/game/niuniu
mkdir -p server/internal/domain/game/slots
mkdir -p server/internal/domain/gameconfig
mkdir -p server/internal/domain/bot
mkdir -p server/internal/domain/inventory

mkdir -p server/internal/application/shared
mkdir -p server/internal/application/game
mkdir -p server/internal/application/player
mkdir -p server/internal/application/admin

mkdir -p server/internal/infrastructure/persistence/cockroachdb
mkdir -p server/internal/infrastructure/persistence/redis
mkdir -p server/internal/infrastructure/nakama
mkdir -p server/internal/infrastructure/external/email
mkdir -p server/internal/infrastructure/external/storage
mkdir -p server/internal/infrastructure/database

mkdir -p server/internal/interfaces/nakama/rpc
mkdir -p server/internal/interfaces/nakama/match
mkdir -p server/internal/interfaces/nakama/hooks
mkdir -p server/internal/interfaces/http/webadmin/handler
mkdir -p server/internal/interfaces/http/webadmin/middleware
mkdir -p server/internal/interfaces/http/webadmin/router
mkdir -p server/internal/interfaces/http/webproxy/handler
mkdir -p server/internal/interfaces/http/webproxy/middleware
mkdir -p server/internal/interfaces/http/webproxy/router

mkdir -p server/cmd/nakama
mkdir -p server/cmd/webadmin

mkdir -p server/pkg/errors
mkdir -p server/pkg/logger
mkdir -p server/pkg/crypto
mkdir -p server/pkg/utils

Step 2: 创建领域层基础文件
────────────────────────────────────────────────────────────────
创建 internal/domain/shared/entity.go
创建 internal/domain/shared/value_object.go
创建 internal/domain/shared/repository.go
创建 internal/domain/shared/errors.go

Step 3: 创建用户领域
────────────────────────────────────────────────────────────────
创建 internal/domain/user/user.go
创建 internal/domain/user/player.go
创建 internal/domain/user/admin.go
创建 internal/domain/user/role.go
创建 internal/domain/user/permission.go
创建 internal/domain/user/value_objects.go
创建 internal/domain/user/repository.go
创建 internal/domain/user/service.go
创建 internal/domain/user/events.go

Step 4: 创建游戏配置领域
────────────────────────────────────────────────────────────────
创建 internal/domain/gameconfig/game.go
创建 internal/domain/gameconfig/room_template.go
创建 internal/domain/gameconfig/tournament.go
创建 internal/domain/gameconfig/bot_config.go
创建 internal/domain/gameconfig/winrate_config.go
创建 internal/domain/gameconfig/repository.go
创建 internal/domain/gameconfig/service.go

Step 5: 创建基础设施层
────────────────────────────────────────────────────────────────
创建 internal/infrastructure/database/cockroachdb.go
创建 internal/infrastructure/database/redis.go
创建 internal/infrastructure/persistence/cockroachdb/user_repo.go
创建 internal/infrastructure/persistence/cockroachdb/gameconfig_repo.go
创建 internal/infrastructure/persistence/redis/keys.go
创建 internal/infrastructure/persistence/redis/session_repo.go

Step 6: 创建应用层
────────────────────────────────────────────────────────────────
创建 internal/application/shared/dto.go
创建 internal/application/shared/mapper.go
创建 internal/application/player/service.go
创建 internal/application/player/dto.go
创建 internal/application/player/commands.go
创建 internal/application/player/queries.go

Step 7: 创建接口层适配器
────────────────────────────────────────────────────────────────
创建 internal/interfaces/nakama/rpc/handler.go
创建 internal/interfaces/nakama/rpc/player_rpc.go
创建 internal/interfaces/http/webadmin/handler/player.go
创建 internal/interfaces/http/webadmin/middleware/auth.go
创建 internal/interfaces/http/webadmin/router/router.go
创建 internal/interfaces/http/webadmin/router/player.go

Step 8: 创建公共包
────────────────────────────────────────────────────────────────
创建 pkg/errors/errors.go
创建 pkg/errors/codes.go
创建 pkg/logger/logger.go
创建 pkg/crypto/jwt.go
创建 pkg/crypto/hash.go

Step 9: 迁移入口文件
────────────────────────────────────────────────────────────────
移动 cmd/main.go → cmd/nakama/main.go
创建 cmd/webadmin/main.go

Step 10: 更新配置
────────────────────────────────────────────────────────────────
更新 config/config.go 支持环境变量
更新 config/loader.go 支持多机部署
```

**验收标准：**

- [ ] 所有现有功能正常运行
- [ ] Gin 服务可独立编译和部署
- [ ] 配置文件支持多机部署
- [ ] 新增游戏只需添加 domain/game/{game_name}/ 目录
- [ ] 测试覆盖领域层核心逻辑

**详细文档：** [docs/server/11_DDD_ARCHITECTURE.md](./docs/server/11_DDD_ARCHITECTURE.md)

---

### Phase 4: Storage Schema 定义

**Status:** `pending`
**Goal:** 定义 Nakama Storage 数据结构

**Tasks:**

- [ ] storage/user.go - 用户数据
- [ ] storage/wallet.go - 钱包数据
- [ ] storage/club.go - 俱乐部数据
- [ ] storage/match.go - 比赛数据
- [ ] storage/config.go - 系统配置
- [ ] storage/admin.go - 管理员数据

---

### Phase 5: 客户端 API 翻译层

**Status:** `pending`
**Goal:** 实现老客户端 API 兼容

**Tasks:**

- [ ] adapter/protocol/old_api.go - 老 API 协议定义
- [ ] adapter/protocol/mapping.go - 协议映射表
- [ ] adapter/api_adapter.go - API 翻译层
- [ ] 登录接口翻译
  - [ ] 游客登录
  - [ ] 账号登录
  - [ ] 手机登录
  - [ ] 钱包登录
- [ ] 用户接口翻译
  - [ ] 用户信息
  - [ ] 资产查询
  - [ ] 设置修改
- [ ] 大厅接口翻译
  - [ ] 大厅信息
  - [ ] 公告列表
  - [ ] 活动列表
- [ ] 充值接口翻译
  - [ ] 充值地址
  - [ ] 充值记录
  - [ ] 提现申请

**Files to Create:**

```
adapter/
├── protocol/
│   ├── old_api.go
│   └── mapping.go
├── api_adapter.go
└── response.go
```

---

### Phase 6: 客户端 WebSocket 翻译层

**Status:** `pending`
**Goal:** 实现老客户端 WebSocket 兼容（非游戏部分）

**Tasks:**

- [ ] adapter/protocol/old_ws.go - 老 WS 协议定义
- [ ] adapter/ws_adapter.go - WS 翻译层
- [ ] 连接认证
- [ ] 心跳保活
- [ ] 大厅消息推送
- [ ] 用户状态同步
- [ ] 聊天消息

**Files to Create:**

```
adapter/
├── protocol/
│   └── old_ws.go
├── ws_adapter.go
└── ws_handler.go
```

---

### Phase 7: 非游戏功能测试

**Status:** `pending`
**Goal:** 验证客户端非游戏功能正常

**测试清单:**

- [ ] 登录流程
  - [ ] 游客登录
  - [ ] 账号登录
  - [ ] 手机登录
  - [ ] Token 刷新
- [ ] 用户功能
  - [ ] 用户信息获取
  - [ ] 昵称/头像修改
  - [ ] 资产显示正确
- [ ] 大厅功能
  - [ ] 大厅信息加载
  - [ ] 公告显示
  - [ ] 活动入口
- [ ] 充值功能
  - [ ] 充值地址获取
  - [ ] 充值记录查询
  - [ ] 提现申请
- [ ] 管理后台
  - [ ] 用户管理正常
  - [ ] 配置修改生效
  - [ ] 客服系统可用

**验收标准:**

- 老客户端能正常登录
- 所有非游戏功能正常使用
- 管理后台能管理所有非游戏内容

---

### Phase 8: 游戏逻辑迁移

**Status:** `pending`
**Goal:** 将老服务端游戏逻辑迁移到 Go

**Tasks:**

- [ ] 共享模块开发
  - [ ] shared/opcodes/opcodes.go - OpCode 常量定义
  - [ ] shared/cards/deck.go - 牌组逻辑
  - [ ] shared/cards/hand_rank.go - 牌型判断
  - [ ] shared/room/room_base.go - 房间基类
  - [ ] shared/player/player_state.go - 玩家状态
- [ ] 德州扑克 Match Handler
  - [ ] match/match_texas.go - Match Handler 框架
  - [ ] MatchInit - 房间初始化
  - [ ] MatchJoin - 玩家加入
  - [ ] MatchLeave - 玩家离开
  - [ ] MatchLoop - 游戏循环
  - [ ] 发牌逻辑
  - [ ] 下注轮次逻辑
  - [ ] 奖池分配逻辑
- [ ] 游戏相关 RPC
  - [ ] rpc/rpc_club.go - 俱乐部 RPC
  - [ ] rpc/rpc_match.go - 比赛 RPC
  - [ ] rpc/rpc_room.go - 房间 RPC
- [ ] 游戏 WS 翻译
  - [ ] 游戏房间消息
  - [ ] 游戏操作消息
  - [ ] 游戏结果消息

**Files to Create:**

```
modules/
├── match/
│   └── match_texas.go
├── rpc/
│   ├── rpc_club.go
│   ├── rpc_match.go
│   └── rpc_room.go
└── shared/
    ├── opcodes/
    ├── cards/
    ├── room/
    └── player/
```

---

### Phase 9: 游戏功能测试

**Status:** `pending`
**Goal:** 验证老客户端游戏功能正常

**测试清单:**

- [ ] 房间功能
  - [ ] 创建房间
  - [ ] 加入房间
  - [ ] 退出房间
  - [ ] 解散房间
- [ ] 德州扑克
  - [ ] 发牌正确
  - [ ] 下注流程
  - [ ] 牌型判断
  - [ ] 奖池分配
  - [ ] 结算正确
- [ ] 俱乐部
  - [ ] 创建俱乐部
  - [ ] 成员管理
  - [ ] 房间模板
- [ ] 比赛
  - [ ] 报名
  - [ ] 比赛流程
  - [ ] 排名奖励

**验收标准:**

- 老客户端游戏功能完全正常
- 服务端重构完成

---

### Phase 10: 客户端重构

**Status:** `pending`
**Goal:** 开发新客户端，使用 Nakama 原生协议

**Tasks:**

- [ ] 新客户端架构设计
- [ ] 使用 Nakama SDK
- [ ] 原生协议适配
- [ ] 功能迁移
- [ ] UI/UX 优化

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| 开发顺序 | 管理后台优先 | 风险最低，不涉及游戏核心 |
| 协议兼容方式 | 翻译层适配 | 老客户端无需修改 |
| 游戏服务器框架 | Nakama 3.x | 成熟框架，内置 Match/Matchmaker/Storage |
| 德州扑克 OpCode | 100-149/200-249 | 预留扩展空间 |
| 数据存储 | Nakama Storage | 原生支持，无需额外设计 |
| 数据库 | CockroachDB | 分布式 SQL，PostgreSQL 兼容，Nakama 官方推荐 |
| 前端框架 | Vue 3 + NaiveUI | 现代化，TypeScript 支持，组件丰富 |
| 构建工具 | Vite | 快速启动，热更新，开发体验好 |

---

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| Git 子模块无法添加 | admin-web 和 proxy-web 被识别为子模块 | 删除 .git 目录，重新添加为普通文件 |
| 403 Forbidden after login | 组件路径格式错误 | 更新为 "layout.base$view.home" 格式 |
| 仪表盘权限问题 | 所有管理员都需要仪表盘权限 | 前端不检查仪表盘权限 |
| Docker 构建效率低 | 每次修改都重新构建镜像 | 创建 build-and-deploy.bat，使用卷挂载 |
| Go 版本不兼容 | Nakama 插件需要特定 Go 版本 | 更新 go.mod 为 Go 1.26.1 |
| PostgreSQL 引用 | 文档中使用 PostgreSQL 但实际使用 CockroachDB | 更新所有文档为 CockroachDB |

---

## Dependencies

```
Phase 1 (基础设施)
    ↓
Phase 2 (Admin Web) ← Phase 3 (Admin API) ← Phase 4 (Schema)
    ↓                         ↓
Phase 2.1 (Proxy Web)
    ↓
Phase 5 (API翻译层) ← Phase 6 (WS翻译层)
    ↓
Phase 7 (非游戏测试) ← 验收通过
    ↓
Phase 8 (游戏逻辑迁移)
    ↓
Phase 9 (游戏测试) ← 验收通过
    ↓
Phase 10 (客户端重构)
```

---

## Current Focus

**Phase:** 3 (Completed)
**Task:** Admin API 接口开发已完成
**Next Action:** Phase 4 - Storage Schema 定义，或继续完善管理后台功能

---

## Completed Tasks

### 文档整理 (2026-04-03)

- [x] 创建 docs/server/ 目录结构
- [x] 创建 docs/admin-web/ 目录结构
- [x] 创建 docs/old_client/ 目录结构
- [x] 整合服务端文档到 docs/server/
- [x] 整合管理后台文档到 docs/admin-web/
- [x] 整合老客户端文档到 docs/old_client/
- [x] 删除已整合的旧文档
- [x] 更新 README.md 文档索引
- [x] 更新 docs/00_OVERVIEW.md
- [x] 更新 DEVELOPMENT.md 开发文档
- [x] 更新所有数据库引用为 CockroachDB
- [x] 更新架构图和技术选型

### 开发流程优化 (2026-04-03)

- [x] 创建 Docker 构建脚本 (build-and-deploy.bat)
- [x] 优化 Go 插件开发流程
- [x] 配置 Vite 代理和头信息保留
- [x] 修复组件路径格式问题
- [x] 实现仪表盘权限豁免
- [x] 创建 proxy-web 项目框架

### Git 问题修复 (2026-04-03)

- [x] 解决 admin-web 和 proxy-web 子模块问题
- [x] 删除 .git 目录，重新添加为普通文件

### Phase 1: 基础设施搭建

- [x] 创建项目目录结构
- [x] 配置 docker-compose.yml (Nakama + CockroachDB + Redis)
- [x] 初始化 Go Module
- [x] 编写 main.go 入口文件
- [x] 验证 Nakama 控制台可访问
- [x] 配置 CockroachDB 数据库
- [x] 配置 Redis 缓存
- [x] 实现数据库迁移脚本

### Phase 2: Admin 管理后台 Web

- [x] 创建 admin-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 登录页面
- [x] 布局框架 (侧边栏 + 头部 + 内容区)
- [x] RBAC 权限系统
- [x] 动态路由
- [x] 主题切换（明暗模式）
- [x] 多标签页
- [x] 国际化支持
- [x] Vite 代理配置
- [x] 状态管理 (Pinia)

### Phase 2.1: Proxy 代理管理后台 Web

- [x] 创建 proxy-web 项目 (Vue3 + TypeScript + NaiveUI)
- [x] 复制 admin-web 基础框架
- [x] 配置独立端口 (8207)
- [x] 更新项目配置和描述

### Phase 3: Admin API 接口 (进行中)

- [x] 管理员认证模块
  - [x] 管理员登录/登出
  - [x] JWT Token 验证
  - [x] 权限中间件
- [x] RBAC 权限管理
  - [x] 角色管理
  - [x] 权限管理
  - [x] 动态路由生成
- [ ] 用户管理接口
  - [ ] 用户列表/搜索
  - [ ] 用户详情
  - [ ] 用户禁用/启用
  - [ ] 用户资产查询
