# Bot 模块

> 游戏机器人 AI：牛牛、德州扑克
> 
> 创建日期：2026-04-03
> 
> 最后更新：2026-04-06

## 模块概述

Bot 模块负责游戏机器人的管理和 AI 逻辑实现。支持多种游戏的机器人 AI，包括牛牛和德州扑克。

---

## DDD 架构文件结构

| 层级 | 文件路径 | 说明 |
|------|----------|------|
| **领域层** | `internal/domain/bot/` | 机器人领域实体 |
| | `internal/domain/bot/bot.go` | 机器人实体定义 |
| | `internal/domain/bot/niuniu_ai.go` | 牛牛游戏 AI |
| | `internal/domain/bot/texas_ai.go` | 德州扑克 AI |
| **接口层** | `internal/interfaces/nakama/rpc/` | Nakama RPC 接口 |
| | `internal/interfaces/nakama/match/` | Match Handler |

---

## 功能列表

| 功能 | 说明 |
|------|------|
| 机器人创建 | 创建游戏机器人 |
| 机器人配置 | 配置机器人行为参数 |
| AI 决策 | 根据游戏状态做出决策 |
| 机器人控制 | 启动、停止、移除机器人 |

---

## 机器人类型

### 牛牛机器人

牛牛游戏的 AI 机器人。

**决策逻辑**：
- 分析手牌组合
- 计算最优出牌策略
- 模拟真实玩家行为

**配置参数**：
```go
type NiuniuBotConfig struct {
    Difficulty  int     // 难度等级 1-5
    ThinkTime   int     // 思考时间（毫秒）
    BluffRate   float64 // 诈唬概率
}
```

### 德州机器人

德州扑克的 AI 机器人。

**决策逻辑**：
- 手牌强度评估
- 位置策略
- 下注策略
- 诈唬判断

**配置参数**：
```go
type TexasBotConfig struct {
    Difficulty   int     // 难度等级 1-5
    ThinkTime    int     // 思考时间（毫秒）
    Aggression   float64 // 激进度
    BluffRate    float64 // 诈唬概率
    FoldThreshold float64 // 弃牌阈值
}
```

---

## AI 算法

### 牛牛 AI

```go
// 决策函数
func (ai *NiuniuAI) MakeDecision(state *GameState) BotAction {
    // 1. 评估手牌
    handStrength := ai.EvaluateHand(state.Cards)
    
    // 2. 计算胜率
    winRate := ai.CalculateWinRate(handStrength, state)
    
    // 3. 做出决策
    if winRate > ai.config.ConfidenceThreshold {
        return BotAction{Type: "bet", Amount: ai.calculateBetAmount(winRate)}
    }
    
    return BotAction{Type: "fold"}
}
```

### 德州 AI

```go
// 决策函数
func (ai *TexasAI) MakeDecision(state *GameState) BotAction {
    // 1. 评估手牌强度
    handStrength := ai.EvaluateHand(state.Hand, state.Board)
    
    // 2. 考虑位置因素
    positionBonus := ai.GetPositionBonus(state.Position)
    
    // 3. 计算期望值
    ev := ai.CalculateEV(handStrength, positionBonus, state.PotOdds)
    
    // 4. 做出决策
    if ev > 0 {
        return ai.decideBetOrRaise(ev, state)
    }
    
    return ai.decideCheckOrFold(state)
}
```

---

## 机器人管理

### 创建机器人

```go
func CreateBot(ctx context.Context, nk runtime.NakamaModule, config BotConfig) (string, error) {
    // 1. 生成机器人 ID
    botID := uuid.New().String()
    
    // 2. 创建机器人用户
    _, _, _, err := nk.AuthenticateCustom(ctx, botID, "Bot_"+botID[:8], true)
    if err != nil {
        return "", err
    }
    
    // 3. 存储机器人配置
    configData, _ := json.Marshal(config)
    _, err = nk.StorageWrite(ctx, []*runtime.StorageWrite{
        {
            Collection: "bots",
            Key:        botID,
            Value:      string(configData),
        },
    })
    
    return botID, err
}
```

### 移除机器人

```go
func RemoveBot(ctx context.Context, nk runtime.NakamaModule, botID string) error {
    // 1. 从存储中删除配置
    err := nk.StorageDelete(ctx, []*runtime.StorageDelete{
        {
            Collection: "bots",
            Key:        botID,
        },
    })
    return err
}
```

---

## 与 Match 模块交互

机器人通过 Match 模块参与游戏：

```
1. Match 创建游戏房间
2. 添加机器人到房间
3. 游戏开始，机器人接收游戏状态
4. AI 做出决策，发送行动
5. 游戏结束，机器人离开房间
```

---

## 配置项

### 全局配置

```yaml
bot:
  max_bots_per_match: 5    # 每局最大机器人数
  default_difficulty: 3    # 默认难度
  enable_chat: false       # 是否启用聊天
```

---

## 扩展计划

- [ ] 更多游戏 AI（斗地主、麻将）
- [ ] 机器学习优化决策
- [ ] 机器人行为统计
- [ ] 动态难度调整
