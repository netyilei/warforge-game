# Match 模块

> 游戏匹配与房间管理
> 
> 创建日期：2026-04-03

## 模块概述

Match 模块负责游戏匹配和房间管理功能。处理玩家匹配、房间创建、游戏状态管理等核心游戏逻辑。

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `modules/match/match.go` | 匹配模块主文件 |

---

## 功能列表

| 功能 | 说明 |
|------|------|
| 玩家匹配 | 根据条件匹配玩家 |
| 房间创建 | 创建游戏房间 |
| 房间管理 | 加入、离开、解散房间 |
| 状态管理 | 游戏状态流转 |
| 结果处理 | 游戏结束结算 |

---

## Match 生命周期

```
┌─────────────┐
│   Created   │  房间创建
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Matching   │  等待玩家加入
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Running   │  游戏进行中
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Ended     │  游戏结束
└─────────────┘
```

---

## 匹配逻辑

### 匹配条件

```go
type MatchCriteria struct {
    GameType    string  // 游戏类型
    MinPlayers  int     // 最少玩家数
    MaxPlayers  int     // 最多玩家数
    MinRating   int     // 最低积分
    MaxRating   int     // 最高积分
    Region      string  // 地区
}
```

### 匹配流程

```go
func (m *Match) MatchPlayer(ctx context.Context, nk runtime.NakamaModule, playerID string, criteria MatchCriteria) error {
    // 1. 查找符合条件的房间
    matches, err := nk.MatchList(ctx, 10, true, "", nil, nil, "")
    
    // 2. 尝试加入现有房间
    for _, match := range matches {
        if m.canJoin(match, criteria) {
            return m.joinMatch(ctx, nk, match.GetMatchId(), playerID)
        }
    }
    
    // 3. 创建新房间
    matchID, err := nk.MatchCreate(ctx, "game_match", map[string]interface{}{
        "game_type": criteria.GameType,
        "max_players": criteria.MaxPlayers,
    })
    
    return m.joinMatch(ctx, nk, matchID, playerID)
}
```

---

## 房间管理

### 创建房间

```go
func CreateMatch(ctx context.Context, nk runtime.NakamaModule, params map[string]interface{}) (string, error) {
    matchID, err := nk.MatchCreate(ctx, "game_match", params)
    if err != nil {
        return "", err
    }
    return matchID, nil
}
```

### 加入房间

```go
func JoinMatch(ctx context.Context, nk runtime.NakamaModule, matchID, playerID string) error {
    _, err := nk.MatchJoin(ctx, matchID, map[string]string{
        "player_id": playerID,
    })
    return err
}
```

### 离开房间

```go
func LeaveMatch(ctx context.Context, nk runtime.NakamaModule, matchID, playerID string) error {
    _, err := nk.MatchLeave(ctx, matchID, map[string]string{
        "player_id": playerID,
    })
    return err
}
```

---

## 状态管理

### 游戏状态

```go
type GameState struct {
    MatchID    string                 `json:"matchId"`
    Status     string                 `json:"status"` // waiting, playing, ended
    Players    []PlayerState          `json:"players"`
    Round      int                    `json:"round"`
    Data       map[string]interface{} `json:"data"`
    CreatedAt  int64                  `json:"createdAt"`
    UpdatedAt  int64                  `json:"updatedAt"`
}

type PlayerState struct {
    PlayerID   string                 `json:"playerId"`
    Status     string                 `json:"status"` // joined, ready, playing, left
    Position   int                    `json:"position"`
    Data       map[string]interface{} `json:"data"`
}
```

### 状态存储

```go
func SaveGameState(ctx context.Context, nk runtime.NakamaModule, state *GameState) error {
    data, _ := json.Marshal(state)
    _, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{
        {
            Collection: "matches",
            Key:        state.MatchID,
            Value:      string(data),
        },
    })
    return err
}
```

---

## 消息处理

### 消息类型

| OpCode | 类型 | 说明 |
|--------|------|------|
| 1 | JOIN | 加入房间 |
| 2 | LEAVE | 离开房间 |
| 3 | READY | 准备 |
| 4 | ACTION | 游戏行动 |
| 5 | CHAT | 聊天消息 |
| 100 | STATE_SYNC | 状态同步 |

### 消息处理示例

```go
func (m *Match) HandleMessage(ctx context.Context, logger runtime.Logger, 
    db *sql.DB, nk runtime.NakamaModule, matchID string, 
    presence runtime.MatchPresence, opCode int64, data []byte) {
    
    switch opCode {
    case 1: // JOIN
        m.handleJoin(ctx, nk, matchID, presence)
    case 2: // LEAVE
        m.handleLeave(ctx, nk, matchID, presence)
    case 4: // ACTION
        m.handleAction(ctx, nk, matchID, presence, data)
    }
}
```

---

## 与 Bot 模块交互

Match 模块可以添加机器人来填补空位：

```go
func (m *Match) AddBotIfNeeded(ctx context.Context, nk runtime.NakamaModule) error {
    if len(m.players) < m.minPlayers {
        botID, err := CreateBot(ctx, nk, BotConfig{
            GameType: m.gameType,
            Difficulty: 3,
        })
        if err != nil {
            return err
        }
        return m.JoinMatch(ctx, nk, m.matchID, botID)
    }
    return nil
}
```

---

## 配置项

```yaml
match:
  max_matches: 1000        # 最大房间数
  match_timeout: 3600      # 房间超时（秒）
  min_players: 2           # 最少玩家数
  max_players: 6           # 最多玩家数
  auto_add_bot: true       # 自动添加机器人
```

---

## 扩展计划

- [ ] 排位赛匹配
- [ ] 好友匹配
- [ ] 房间密码
- [ ] 观战功能
- [ ] 断线重连
