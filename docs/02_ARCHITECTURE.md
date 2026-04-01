# 架构设计

## 技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 游戏服务器 | Nakama 3.x | 开源游戏服务器框架 |
| 运行时扩展 | Go Runtime | 自定义 Match Handler、RPC |
| 数据库 | PostgreSQL | Nakama 内置存储 |
| 缓存 | Redis | Nakama 内置缓存 |
| 协议翻译层 | **内置模块** | `adapter/` 目录，老客户端兼容 |

> **翻译器设计决策**：翻译器作为 Nakama 内置模块（`adapter/`），而非独立服务。
>
> - ✅ 单一服务，部署简单
> - ✅ 无额外网络延迟
> - ✅ 新客户端重构后，删除 `adapter/` 目录即可

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           客户端层                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   老客户端                        新客户端                           │
│   (Cocos)                        (Vue3 + PixiJS)                    │
│       │                              │                              │
│       │ 老协议                       │ Nakama 原生协议               │
│       │ {m, d}                      │ WebSocket/HTTP                │
│       ▼                              │                              │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      Nakama Server                          │   │
│   │                                                             │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │ adapter/  (翻译器模块 - 老客户端兼容)               │   │   │
│   │  │                                                     │   │   │
│   │  │  老协议:              内部调用:                     │   │   │
│   │  │  {m:"GSC_Bet",d:...} ──▶ Match Handler             │   │   │
│   │  │  POST /api/user/login ──▶ RPC Function             │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   │                          │                                  │   │
│   │                          ▼                                  │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │ modules/  (核心模块)                                │   │   │
│   │  │                                                     │   │   │
│   │  │  match/    rpc/    hooks/    shared/               │   │   │
│   │  │  (游戏)   (API)   (钩子)    (共享)                 │   │   │
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
│   │    PostgreSQL     │          │      Redis        │             │
│   │                   │          │                   │             │
│   │ • 用户数据        │          │ • 会话缓存        │             │
│   │ • Storage Objects │          │ • Match 状态      │             │
│   │ • 俱乐部数据      │          │ • 在线状态        │             │
│   │ • 交易记录        │          │ • 排行榜缓存      │             │
│   └───────────────────┘          └───────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **清理路径**：新客户端重构完成后，只需删除 `adapter/` 目录，老客户端协议支持即移除。

---

## 项目目录结构

```
game-server/
├── cmd/
│   └── main.go                    # 入口文件
│
├── modules/                       # Nakama Go Runtime 模块
│   │
│   ├── match/                     # Match Handlers (游戏房间)
│   │   ├── match_texas.go         # 德州扑克
│   │   ├── match_niuniu.go        # 牛牛
│   │   ├── match_doudizhu.go      # 斗地主
│   │   └── match_majiang.go       # 麻将
│   │
│   ├── rpc/                       # RPC 函数 (HTTP API)
│   │   ├── rpc_user.go            # 用户相关
│   │   ├── rpc_club.go            # 俱乐部相关
│   │   ├── rpc_match.go           # 比赛相关
│   │   ├── rpc_payment.go         # 支付相关
│   │   └── rpc_admin.go           # 管理后台
│   │
│   ├── hooks/                     # 钩子函数
│   │   ├── hook_auth.go           # 认证钩子
│   │   ├── hook_storage.go        # 存储钩子
│   │   └── hook_match.go          # 匹配钩子
│   │
│   └── shared/                    # 共享模块
│       ├── cards/
│       │   ├── deck.go            # 牌组
│       │   └── hand_rank.go       # 牌型判断
│       ├── room/
│       │   └── room_base.go       # 房间基类
│       └── player/
│           └── player_state.go    # 玩家状态
│
├── adapter/                       # 协议翻译层 (老客户端兼容)
│   ├── adapter.go                 # 适配器主入口
│   ├── api_adapter.go             # API 协议转换
│   ├── ws_adapter.go              # WebSocket 协议转换
│   └── protocol/
│       ├── old_api.go             # 老 API 协议定义
│       ├── old_ws.go              # 老 WS 协议定义
│       └── mapping.go             # 协议映射表
│
├── storage/                       # Storage Schema 定义
│   ├── user.go                    # 用户数据结构
│   ├── club.go                    # 俱乐部数据结构
│   ├── match.go                   # 比赛数据结构
│   └── item.go                    # 道具数据结构
│
├── config/
│   └── config.yaml                # Nakama 配置
│
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

---

## 协议翻译层设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                        协议翻译层架构                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   老客户端请求                                                      │
│       │                                                             │
│       ▼                                                             │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     API Adapter                              │   │
│   │                                                              │   │
│   │   老协议:                      Nakama RPC:                   │   │
│   │   POST /api/user/login   ──▶  POST /v2/rpc/user_login       │   │
│   │   POST /api/user/info    ──▶  POST /v2/rpc/user_info        │   │
│   │   POST /api/club/list    ──▶  POST /v2/rpc/club_list        │   │
│   │                                                              │   │
│   │   响应转换:                                                  │   │
│   │   Nakama: {result: {...}}  ──▶  老协议: {code:0, data:{...}}│   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     WS Adapter                               │   │
│   │                                                              │   │
│   │   老协议 WS:                  Nakama Match:                  │   │
│   │   {m:"GSC_CM_Bet", d:...} ──▶  OpCode: 101, data: {...}     │   │
│   │   {m:"GSC_Ready", d:...} ──▶  OpCode: 102, data: {...}      │   │
│   │                                                              │   │
│   │   消息名称映射表:                                            │   │
│   │   ├── GSC_CM_Bet      ──▶  OpCode 101                       │   │
│   │   ├── GSC_CM_Buyin    ──▶  OpCode 102                       │   │
│   │   ├── GSC_Ready       ──▶  OpCode 103                       │   │
│   │   └── GSC_Chat        ──▶  OpCode 104                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Storage Schema 设计

### 用户数据

```go
// storage/user.go

// 用户基本信息
type UserStorage struct {
    UserID      int64  `json:"user_id"`
    NickName    string `json:"nick_name"`
    IconUrl     string `json:"icon_url"`
    Sex         int    `json:"sex"`
    CountryCode string `json:"country_code"`
    PhoneNumber string `json:"phone_number"`
}

// 用户钱包
type WalletStorage struct {
    UserID   int64  `json:"user_id"`
    Gold     string `json:"gold"`      // 金币
    Diamond  string `json:"diamond"`   // 钻石
    USDT     string `json:"usdt"`      // USDT
    Score    string `json:"score"`     // 积分
}

// Storage Key: "user_wallet:{user_id}"
// Collection: "wallet"
// Key: "{user_id}"
```

### 俱乐部数据

```go
// storage/club.go

type ClubStorage struct {
    ClubID     int64  `json:"club_id"`
    Code       string `json:"code"`
    BossUserID int64  `json:"boss_user_id"`
    Name       string `json:"name"`
    Desc       string `json:"desc"`
    IconUrl    string `json:"icon_url"`
}

type ClubMemberStorage struct {
    ClubID  int64   `json:"club_id"`
    Members []Member `json:"members"`
}

type Member struct {
    UserID     int64 `json:"user_id"`
    Type       int   `json:"type"`       // 成员类型
    Job        int   `json:"job"`        // 职位
    JoinTime   int64 `json:"join_time"`
}

// Collection: "club"
// Key: "{club_id}"
```

---

## Match Handler OpCode 定义

```go
// modules/shared/opcodes/opcodes.go

package opcodes

const (
    // 德州扑克 OpCode
    TexasBet         = 101  // 下注
    TexasBuyin       = 102  // 买入
    TexasReady       = 103  // 准备
    TexasChat        = 104  // 聊天
    TexasFold        = 105  // 弃牌
    TexasCheck       = 106  // 过牌
    TexasCall        = 107  // 跟注
    TexasRaise       = 108  // 加注
    TexasAllin       = 109  // 全押

    // 服务端推送 OpCode
    TexasRoomInfo    = 201  // 房间信息
    TexasGameStart   = 202  // 游戏开始
    TexasDealCard    = 203  // 发牌
    TexasBetTurn     = 204  // 轮到操作
    TexasGameResult  = 205  // 游戏结果
    TexasGameEnd     = 206  // 游戏结束
    TexasUserEnter   = 207  // 用户进入
    TexasUserExit    = 208  // 用户退出
    TexasScoreChange = 209  // 分数变化
)
```

---

## 部署架构

### 开发环境

```yaml
# docker-compose.yml
version: '3'
services:
  nakama:
    image: heroiclabs/nakama:3.18.0
    ports:
      - "7349:7349"   # API
      - "7350:7350"   # HTTP
      - "7351:7351"   # WebSocket
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nakama
      POSTGRES_USER: nakama
      POSTGRES_PASSWORD: nakama

  redis:
    image: redis:7
```

### 生产环境

```
┌─────────────────────────────────────────────────────────────────────┐
│                         负载均衡器                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
     │  Nakama-1   │     │  Nakama-2   │     │  Nakama-3   │
     │  (游戏节点) │     │  (游戏节点) │     │  (游戏节点) │
     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌─────────────┐         ┌─────────────┐
             │ PostgreSQL  │         │    Redis    │
             │  (Primary)  │         │  (Cluster)  │
             └─────────────┘         └─────────────┘
```

---

## 老服务迁移对照

| 老服务 | Nakama 对应模块 |
|--------|-----------------|
| pp-login | Nakama Authenticate + hook_auth.go |
| pp-user-service | rpc_user.go + Storage |
| pp-game-texas | match_texas.go |
| pp-match-logic | Nakama Matchmaker |
| pp-club | rpc_club.go + Storage |
| pp-robot-env | 独立机器人服务 |
| pp-srs-node | Nakama 内置 |
| pp-srs-layer | Nakama 内置 |
| pp-srs-dispatcher | Nakama 内置 |
| pp-chat-service | Nakama Chat API |
