# DDD 架构设计

> WarForge Server 领域驱动设计（Domain-Driven Design）架构文档
>
> 创建日期：2026-04-06
>
> 最后更新：2026-04-06

---

## 概述

本文档描述 WarForge Server 的 DDD 分层架构设计，旨在解决当前架构的职责不清、扩展困难、多机部署复杂等问题。

### 设计目标

| 目标 | 说明 |
|------|------|
| **职责清晰** | 每个目录有明确的职责边界 |
| **易于扩展** | 新增游戏/功能不影响现有代码 |
| **独立部署** | Gin 服务可独立编译和部署 |
| **多机支持** | 配置统一管理，支持分布式部署 |
| **易于测试** | 领域层纯业务逻辑，易于单元测试 |

---

## 架构分层

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           接口层 (Interfaces Layer)                          │
│                                                                             │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐       │
│   │     Nakama 接口              │    │      HTTP 接口              │       │
│   │                             │    │                             │       │
│   │  ├── rpc/    RPC 处理器     │    │  ├── webadmin/  管理后台    │       │
│   │  ├── match/  Match Handler  │    │  └── webproxy/  代理后台    │       │
│   │  └── hooks/  生命周期钩子   │    │                             │       │
│   └─────────────────────────────┘    └─────────────────────────────┘       │
│                    │                            │                           │
│                    └────────────┬───────────────┘                           │
│                                 ▼                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                           应用层 (Application Layer)                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         应用服务 (App Services)                       │   │
│   │                                                                     │   │
│   │   GameAppService    PlayerAppService    AdminAppService            │   │
│   │   BotAppService     InventoryAppService                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                           领域层 (Domain Layer)                              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                           领域模型                                   │   │
│   │                                                                     │   │
│   │   Entities          Value Objects       Domain Services            │   │
│   │   (实体)            (值对象)            (领域服务)                  │   │
│   │                                                                     │   │
│   │   Repository Interfaces (仓储接口)                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                        基础设施层 (Infrastructure Layer)                      │
│                                                                             │
│   ┌───────────────────────┐  ┌───────────────────────┐                    │
│   │    持久化实现          │  │    外部服务            │                    │
│   │                       │  │                       │                    │
│   │  CockroachDB Repo     │  │  Nakama Client        │                    │
│   │  Redis Repo           │  │  Email Service        │                    │
│   │                       │  │  Storage Service      │                    │
│   └───────────────────────┘  └───────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
server/
├── cmd/                              # 应用入口（独立编译）
│   ├── nakama/                       # Nakama 插件入口
│   │   └── main.go                   # 编译为 warforge.so
│   │
│   └── webadmin/                     # Gin 服务入口（独立进程）
│       └── main.go                   # 编译为 webadmin.exe
│
├── config/                           # 统一配置
│   ├── config.yaml                   # 配置文件
│   ├── config.go                     # 配置结构定义
│   └── loader.go                     # 配置加载器（支持环境变量覆盖）
│
├── internal/                         # 私有包（不对外暴露）
│   │
│   ├── domain/                       # 【领域层】核心业务逻辑
│   │   │
│   │   ├── shared/                   # 共享领域概念
│   │   │   ├── entity.go             # Entity 基础接口
│   │   │   ├── value_object.go       # ValueObject 基础接口
│   │   │   ├── repository.go         # Repository 基础接口
│   │   │   └── errors.go             # 领域错误定义
│   │   │
│   │   ├── user/                     # 用户领域
│   │   │   ├── user.go               # User 实体
│   │   │   ├── player.go             # Player 实体（游戏玩家）
│   │   │   ├── admin.go              # Admin 实体
│   │   │   ├── role.go               # Role 实体
│   │   │   ├── permission.go         # Permission 实体
│   │   │   ├── value_objects.go      # 值对象（UserID, Username 等）
│   │   │   ├── repository.go         # 仓储接口
│   │   │   ├── service.go            # 领域服务
│   │   │   └── events.go             # 领域事件
│   │   │
│   │   ├── game/                     # 游戏领域
│   │   │   │
│   │   │   ├── shared/               # 游戏共享概念
│   │   │   │   ├── game.go           # Game 基础实体
│   │   │   │   ├── room.go           # Room 房间实体
│   │   │   │   ├── match.go          # Match 比赛实体
│   │   │   │   ├── player.go         # GamePlayer 游戏内玩家
│   │   │   │   ├── bet.go            # Bet 下注实体
│   │   │   │   └── value_objects.go  # Chip, Card 等值对象
│   │   │   │
│   │   │   ├── texas/                # 德州扑克领域
│   │   │   │   ├── game.go           # TexasGame 实体
│   │   │   │   ├── room.go           # TexasRoom 实体
│   │   │   │   ├── hand.go           # 牌型值对象
│   │   │   │   ├── rules.go          # 德州规则
│   │   │   │   ├── repository.go     # 仓储接口
│   │   │   │   └── service.go        # 领域服务
│   │   │   │
│   │   │   ├── niuniu/               # 牛牛领域
│   │   │   │   ├── game.go
│   │   │   │   ├── room.go
│   │   │   │   ├── hand.go
│   │   │   │   ├── rules.go
│   │   │   │   ├── repository.go
│   │   │   │   └── service.go
│   │   │   │
│   │   │   └── slots/                # 老虎机领域（HTTP 下注游戏）
│   │   │       ├── game.go           # SlotsGame 实体
│   │   │       ├── spin.go           # Spin 逻辑
│   │   │       ├── reels.go          # 轮盘配置
│   │   │       ├── repository.go
│   │   │       └── service.go
│   │   │
│   │   ├── gameconfig/               # 游戏配置领域
│   │   │   ├── game.go               # GameDefinition 游戏定义
│   │   │   ├── room_template.go      # RoomTemplate 房间模板
│   │   │   ├── tournament.go         # Tournament 比赛配置
│   │   │   ├── bot_config.go         # BotConfig 机器人配置
│   │   │   ├── winrate_config.go     # WinRateConfig 胜率配置
│   │   │   ├── repository.go         # 仓储接口
│   │   │   └── service.go            # 领域服务
│   │   │
│   │   ├── bot/                      # 机器人领域
│   │   │   ├── bot.go                # Bot 实体
│   │   │   ├── strategy.go           # AI 策略接口
│   │   │   ├── value_objects.go      # Difficulty 等值对象
│   │   │   ├── repository.go         # 仓储接口
│   │   │   └── service.go            # 领域服务
│   │   │
│   │   └── inventory/                # 背包领域
│   │       ├── inventory.go          # Inventory 实体
│   │       ├── item.go               # Item 实体
│   │       ├── value_objects.go      # ItemID, Quantity 等值对象
│   │       ├── repository.go         # 仓储接口
│   │       └── service.go            # 领域服务
│   │
│   ├── application/                  # 【应用层】用例/应用服务
│   │   │
│   │   ├── shared/                   # 共享应用概念
│   │   │   ├── dto.go                # DTO 基础结构
│   │   │   └── mapper.go             # Mapper 基础接口
│   │   │
│   │   ├── game/                     # 游戏应用服务
│   │   │   ├── service.go            # GameAppService
│   │   │   ├── dto.go                # 请求/响应 DTO
│   │   │   ├── commands.go           # 命令对象
│   │   │   └── queries.go            # 查询对象
│   │   │
│   │   ├── player/                   # 玩家管理应用服务
│   │   │   ├── service.go            # PlayerAppService
│   │   │   ├── dto.go
│   │   │   ├── commands.go
│   │   │   └── queries.go
│   │   │
│   │   └── admin/                    # 管理应用服务
│   │       ├── service.go            # AdminAppService
│   │       ├── dto.go
│   │       ├── commands.go
│   │       └── queries.go
│   │
│   ├── infrastructure/               # 【基础设施层】
│   │   │
│   │   ├── persistence/              # 持久化实现
│   │   │   ├── cockroachdb/          # CockroachDB 实现
│   │   │   │   ├── user_repo.go      # UserRepository 实现
│   │   │   │   ├── game_repo.go      # GameRepository 实现
│   │   │   │   ├── gameconfig_repo.go
│   │   │   │   ├── bot_repo.go
│   │   │   │   └── inventory_repo.go
│   │   │   │
│   │   │   └── redis/                # Redis 实现
│   │   │       ├── session_repo.go   # 会话仓储
│   │   │       ├── cache_repo.go     # 缓存仓储
│   │   │       └── keys.go           # Redis Key 定义
│   │   │
│   │   ├── nakama/                   # Nakama 基础设施
│   │   │   ├── client.go             # Nakama API 客户端封装
│   │   │   ├── storage.go            # Storage 操作封装
│   │   │   ├── matchmaker.go         # 匹配器封装
│   │   │   └── notifier.go           # 通知器封装
│   │   │
│   │   ├── external/                 # 外部服务
│   │   │   ├── email/                # 邮件服务
│   │   │   │   └── sender.go
│   │   │   ├── storage/              # 对象存储
│   │   │   │   └── s3.go
│   │   │   └── payment/              # 支付服务
│   │   │       └── gateway.go
│   │   │
│   │   └── database/                 # 数据库连接
│   │       ├── cockroachdb.go        # CockroachDB 连接
│   │       └── redis.go              # Redis 连接
│   │
│   └── interfaces/                   # 【接口层】入口点
│       │
│       ├── nakama/                   # Nakama 接口
│       │   ├── rpc/                  # RPC 处理器
│       │   │   ├── handler.go        # RPC 基础处理器
│       │   │   ├── game_rpc.go       # 游戏 RPC
│       │   │   ├── player_rpc.go     # 玩家管理 RPC
│       │   │   └── auth_rpc.go       # 认证 RPC
│       │   │
│       │   ├── match/                # Match Handler
│       │   │   ├── handler.go        # Match 处理器
│       │   │   ├── dispatcher.go     # 消息分发器
│       │   │   ├── texas_match.go    # 德州 Match
│       │   │   └── niuniu_match.go   # 牛牛 Match
│       │   │
│       │   └── hooks/                # 生命周期钩子
│       │       └── hooks.go          # 钩子处理器
│       │
│       └── http/                     # HTTP 接口
│           │
│           ├── webadmin/             # 管理后台 API
│           │   ├── handler/          # 处理器
│           │   │   ├── auth.go       # 认证处理
│           │   │   ├── admin.go      # 管理员处理
│           │   │   ├── player.go     # 玩家管理处理
│           │   │   ├── game.go       # 游戏管理处理
│           │   │   └── gameconfig.go # 游戏配置处理
│           │   ├── middleware/       # 中间件
│           │   │   ├── auth.go
│           │   │   ├── permission.go
│           │   │   └── logger.go
│           │   ├── router/           # 路由定义（独立目录）
│           │   │   ├── router.go     # 主路由
│           │   │   ├── admin.go      # 管理员路由
│           │   │   ├── player.go     # 玩家路由
│           │   │   └── game.go       # 游戏路由
│           │   ├── dto.go            # HTTP DTO
│           │   └── response.go       # 响应封装
│           │
│           └── webproxy/             # 代理后台 API
│               ├── handler/
│               ├── middleware/
│               └── router/
│
├── pkg/                              # 公共包（可被外部引用）
│   ├── errors/                       # 错误处理
│   │   ├── errors.go                 # 错误定义
│   │   └── codes.go                  # 错误码
│   │
│   ├── logger/                       # 日志
│   │   └── logger.go                 # 日志封装
│   │
│   ├── crypto/                       # 加密
│   │   ├── jwt.go                    # JWT 工具
│   │   └── hash.go                   # 密码哈希
│   │
│   └── utils/                        # 工具函数
│       ├── json.go                   # JSON 工具
│       └── time.go                   # 时间工具
│
├── migrations/                       # 数据库迁移
│
└── docker/                           # Docker 配置
    ├── Dockerfile
    └── Dockerfile.webadmin           # Gin 服务独立 Dockerfile
```

---

## 多机部署架构

### 部署拓扑

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              多机部署架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐     ┌─────────────────────┐                      │
│   │   游戏服务器集群     │     │   管理后台服务器     │                      │
│   │   (Nakama 集群)      │     │   (Gin 独立服务)     │                      │
│   │                     │     │                     │                      │
│   │  • Nakama Server    │     │  • Gin HTTP Server  │                      │
│   │  • Go Plugin        │     │  • WebAdmin API     │                      │
│   │  • Match Handler    │     │  • WebProxy API     │                      │
│   │  • WebSocket        │     │                     │                      │
│   │                     │     │                     │                      │
│   │  IP: 10.0.1.x       │     │  IP: 10.0.2.x       │                      │
│   └──────────┬──────────┘     └──────────┬──────────┘                      │
│              │                           │                                  │
│              │    ┌──────────────────────┼──────────────────────┐          │
│              │    │                      │                      │          │
│              ▼    ▼                      ▼                      ▼          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        共享基础设施                                  │  │
│   │                                                                     │  │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │  │
│   │   │ CockroachDB │    │    Redis    │    │  配置中心    │            │  │
│   │   │  (数据层)    │    │   (缓存)    │    │ (config.yaml)│            │  │
│   │   │             │    │             │    │             │            │  │
│   │   │ IP: 10.0.0.x│    │ IP: 10.0.0.y│    │ 共享存储/NFS │            │  │
│   │   └─────────────┘    └─────────────┘    └─────────────┘            │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 配置管理

```yaml
# config/config.yaml

# 服务标识
server:
  id: "game-server-1"
  mode: "nakama"  # nakama | webadmin

# Nakama 配置（Nakama 插件使用）
nakama:
  host: "${NAKAMA_HOST:127.0.0.1}"
  port: ${NAKAMA_PORT:8202}
  http_key: "${NAKAMA_HTTP_KEY:defaultkey}"

# 数据库配置（共享）
database:
  host: "${DB_HOST:127.0.0.1}"
  port: ${DB_PORT:26257}
  name: "${DB_NAME:nakama}"
  user: "${DB_USER:nakama}"
  password: "${DB_PASSWORD:nakama}"

# Redis 配置（共享）
redis:
  host: "${REDIS_HOST:127.0.0.1}"
  port: ${REDIS_PORT:6379}
  password: "${REDIS_PASSWORD:}"
  db: ${REDIS_DB:0}

# WebAdmin 配置（Gin 服务使用）
webadmin:
  enabled: true
  port: ${WEBADMIN_PORT:8201}
  secret_key: "${WEBADMIN_SECRET:your-secret-key}"

# WebProxy 配置（Gin 服务使用）
webproxy:
  enabled: true
  port: ${WEBPROXY_PORT:8207}
  secret_key: "${WEBPROXY_SECRET:your-proxy-secret-key}"

# 外部服务配置
external:
  email:
    host: "${EMAIL_HOST:smtp.example.com}"
    port: ${EMAIL_PORT:587}
  storage:
    endpoint: "${STORAGE_ENDPOINT:s3.example.com}"
    bucket: "${STORAGE_BUCKET:warforge}"
```

### 环境变量覆盖

```bash
# Nakama 服务器环境变量
export NAKAMA_HOST=10.0.1.10
export DB_HOST=10.0.0.5
export REDIS_HOST=10.0.0.6

# WebAdmin 服务器环境变量
export DB_HOST=10.0.0.5
export REDIS_HOST=10.0.0.6
export WEBADMIN_PORT=8201
```

---

## 领域层设计

### 实体定义示例

```go
// internal/domain/user/user.go
package user

type User struct {
    id          UserID
    username    Username
    displayName string
    avatarURL   string
    status      UserStatus
    metadata    map[string]interface{}
    createdAt   time.Time
    updatedAt   time.Time
}

func (u *User) Ban(reason string) error {
    if u.status == StatusBanned {
        return ErrAlreadyBanned
    }
    u.status = StatusBanned
    u.metadata["ban_reason"] = reason
    u.updatedAt = time.Now()
    return nil
}

func (u *User) Unban() error {
    if u.status != StatusBanned {
        return ErrNotBanned
    }
    u.status = StatusActive
    delete(u.metadata, "ban_reason")
    u.updatedAt = time.Now()
    return nil
}
```

### 仓储接口定义

```go
// internal/domain/user/repository.go
package user

type Repository interface {
    FindByID(ctx context.Context, id UserID) (*User, error)
    FindByUsername(ctx context.Context, username Username) (*User, error)
    Save(ctx context.Context, user *User) error
    Delete(ctx context.Context, id UserID) error
    List(ctx context.Context, filter UserFilter) ([]*User, int64, error)
}
```

### 游戏配置领域

```go
// internal/domain/gameconfig/game.go
package gameconfig

type GameType string

const (
    GameTypeWebSocket GameType = "websocket"
    GameTypeHTTP      GameType = "http"
)

type GameDefinition struct {
    id           string
    name         string
    gameType     GameType
    matchModule  string      // WS 游戏的 Match Handler 名称
    httpEndpoint string      // HTTP 游戏的 API 端点
    enabled      bool
}

// internal/domain/gameconfig/room_template.go
type RoomTemplate struct {
    id            string
    gameID        string
    name          string
    minBet        int64
    maxBet        int64
    minPlayers    int
    maxPlayers    int
    botEnabled    bool
    botMinCount   int
    botMaxCount   int
    botDifficulty string
}

// internal/domain/gameconfig/bot_config.go
type BotConfig struct {
    id           string
    gameID       string
    difficulty   string
    behaviorType string
    targetWinRate float64
}
```

---

## 应用层设计

### 应用服务示例

```go
// internal/application/player/service.go
package player

type AppService struct {
    userRepo    user.Repository
    gameRepo    game.Repository
    nakama      *nakama.Client
}

func NewAppService(
    userRepo user.Repository,
    gameRepo game.Repository,
    nakama *nakama.Client,
) *AppService {
    return &AppService{
        userRepo: userRepo,
        gameRepo: gameRepo,
        nakama:   nakama,
    }
}

func (s *AppService) GetPlayer(ctx context.Context, query GetPlayerQuery) (*PlayerDTO, error) {
    u, err := s.userRepo.FindByID(ctx, query.UserID)
    if err != nil {
        return nil, err
    }
    return ToDTO(u), nil
}

func (s *AppService) BanPlayer(ctx context.Context, cmd BanPlayerCommand) error {
    u, err := s.userRepo.FindByID(ctx, cmd.UserID)
    if err != nil {
        return err
    }
    
    if err := u.Ban(cmd.Reason); err != nil {
        return err
    }
    
    if err := s.userRepo.Save(ctx, u); err != nil {
        return err
    }
    
    s.nakama.SessionLogout(ctx, u.ID().String())
    
    return nil
}
```

---

## 接口层设计

### Nakama RPC 适配器

```go
// internal/interfaces/nakama/rpc/player_rpc.go
package rpc

type PlayerRPCHandler struct {
    playerApp *player.AppService
}

func NewPlayerRPCHandler(playerApp *player.AppService) *PlayerRPCHandler {
    return &PlayerRPCHandler{playerApp: playerApp}
}

func (h *PlayerRPCHandler) GetPlayer(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    var req GetPlayerRequest
    if err := json.Unmarshal([]byte(payload), &req); err != nil {
        return "", err
    }
    
    result, err := h.playerApp.GetPlayer(ctx, player.GetPlayerQuery{
        UserID: req.UserID,
    })
    if err != nil {
        return "", err
    }
    
    return jsonMarshal(result), nil
}
```

### Gin HTTP 适配器

```go
// internal/interfaces/http/webadmin/handler/player.go
package handler

type PlayerHandler struct {
    playerApp *player.AppService
}

func NewPlayerHandler(playerApp *player.AppService) *PlayerHandler {
    return &PlayerHandler{playerApp: playerApp}
}

func (h *PlayerHandler) GetPlayer(c *gin.Context) {
    userID := c.Param("id")
    
    result, err := h.playerApp.GetPlayer(c.Request.Context(), player.GetPlayerQuery{
        UserID: userID,
    })
    if err != nil {
        response.Error(c, err)
        return
    }
    
    response.Success(c, result)
}
```

### 路由独立目录

```go
// internal/interfaces/http/webadmin/router/router.go
package router

func RegisterRoutes(r *gin.Engine, handlers *Handlers, middlewares *Middlewares) {
    api := r.Group("/api-v1")
    api.Use(middlewares.OperationLog)
    
    registerAuthRoutes(api, handlers, middlewares)
    registerAdminRoutes(api, handlers, middlewares)
    registerPlayerRoutes(api, handlers, middlewares)
    registerGameRoutes(api, handlers, middlewares)
}

// internal/interfaces/http/webadmin/router/player.go
package router

func registerPlayerRoutes(rg *gin.RouterGroup, handlers *Handlers, m *Middlewares) {
    players := rg.Group("/players", m.Auth)
    {
        players.GET("", handlers.Player.List)
        players.GET("/:id", handlers.Player.Get)
        players.PUT("/:id/ban", handlers.Player.Ban)
        players.PUT("/:id/unban", handlers.Player.Unban)
    }
}
```

---

## 潜在问题与解决方案

### 问题 1：Nakama 与 DDD 的适配

**问题：** Nakama 要求 Match Handler 有特定签名，DDD 可能增加复杂度

**解决方案：** 使用适配器模式

```go
// interfaces/nakama/match/texas_match.go
type TexasMatchAdapter struct {
    gameService *game.AppService
}

func (a *TexasMatchAdapter) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
    return a.gameService.InitTexasMatch(ctx, params)
}
```

### 问题 2：跨游戏交互

**问题：** 玩家在多个游戏间切换、共享货币

**解决方案：** 通过领域服务协调

```go
// domain/user/service.go
type UserService struct {
    userRepo     Repository
    inventorySvc *inventory.Service
}

func (s *UserService) TransferChips(ctx context.Context, fromGame, toGame string, userID UserID, amount int64) error {
    // 协调多个领域
}
```

### 问题 3：配置爆炸

**问题：** 游戏多了配置表会很多

**解决方案：** 建立配置继承机制

```go
type RoomTemplate struct {
    ParentID  *string  // 继承父模板
    Overrides map[string]interface{}  // 覆盖配置
}

func (t *RoomTemplate) Resolve() *ResolvedRoomTemplate {
    if t.ParentID != nil {
        parent := t.repo.FindByID(t.ParentID)
        return parent.Merge(t.Overrides)
    }
    return t.ToResolved()
}
```

### 问题 4：HTTP 游戏与 WebSocket 游戏统一管理

**问题：** 老虎机等 HTTP 游戏不需要 Match Handler

**解决方案：** 通过 GameType 区分

```go
type GameDefinition struct {
    GameType     GameType  // websocket | http
    MatchModule  string    // WS 游戏使用
    HTTPEndpoint string    // HTTP 游戏使用
}

func (g *GameDefinition) IsWebSocket() bool {
    return g.GameType == GameTypeWebSocket
}
```

---

## 迁移计划

### Phase 3.5.1: 创建领域层框架

**任务清单：**

- [ ] 创建 `internal/domain/shared/` 目录
- [ ] 定义 Entity、ValueObject、Repository 接口
- [ ] 定义领域错误类型
- [ ] 创建 `internal/domain/user/` 用户领域
- [ ] 创建 `internal/domain/gameconfig/` 游戏配置领域

### Phase 3.5.2: 创建基础设施层

**任务清单：**

- [ ] 创建 `internal/infrastructure/persistence/cockroachdb/`
- [ ] 实现 UserRepository
- [ ] 实现 GameConfigRepository
- [ ] 创建 `internal/infrastructure/nakama/` Nakama 客户端封装

### Phase 3.5.3: 创建应用层

**任务清单：**

- [ ] 创建 `internal/application/player/` 玩家应用服务
- [ ] 创建 `internal/application/game/` 游戏应用服务
- [ ] 定义 DTO 和 Mapper

### Phase 3.5.4: 重构接口层

**任务清单：**

- [ ] 创建 `internal/interfaces/nakama/rpc/` RPC 适配器
- [ ] 创建 `internal/interfaces/nakama/match/` Match 适配器
- [ ] 创建 `internal/interfaces/http/webadmin/` HTTP 适配器
- [ ] 分离 Admin 路由到独立目录

### Phase 3.5.5: Gin 服务独立化

**任务清单：**

- [ ] 创建 `cmd/webadmin/main.go` 独立入口
- [ ] 配置支持环境变量覆盖
- [ ] 支持多机部署配置

### Phase 3.5.6: 迁移现有代码

**迁移映射表：**

| 原路径 | 新路径 |
|--------|--------|
| `modules/admin/` | `internal/domain/admin/` |
| `modules/bot/` | `internal/domain/bot/` |
| `nakama/rpc/` | `internal/interfaces/nakama/rpc/` |
| `nakama/match/` | `internal/interfaces/nakama/match/` |
| `nakama/hooks/` | `internal/interfaces/nakama/hooks/` |
| `webadmin/` | `internal/interfaces/http/webadmin/` |
| `models/` | `internal/domain/*/entity.go` |
| `database/` | `internal/infrastructure/persistence/` |

---

## 验收标准

| 标准 | 验证方式 |
|------|----------|
| 所有现有功能正常运行 | 运行现有测试用例 |
| Gin 服务可独立编译和部署 | `go build -o webadmin.exe ./cmd/webadmin` |
| 配置文件支持多机部署 | 环境变量覆盖测试 |
| 新增游戏只需添加目录 | 创建测试游戏验证 |
| 测试覆盖领域层核心逻辑 | 单元测试覆盖率 > 80% |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [00_OVERVIEW.md](./00_OVERVIEW.md) | 服务端概述 |
| [04_ARCHITECTURE.md](./04_ARCHITECTURE.md) | 架构设计 |
| [05_DATABASE_DESIGN.md](./05_DATABASE_DESIGN.md) | 数据库设计 |
| [task_plan.md](../../task_plan.md) | 开发任务计划 |
