# Findings: 研究发现

> 记录所有重要发现，防止上下文丢失

---

## 老系统架构分析

### 服务分布
- 20+ 微服务，过度拆分
- 通信复杂，维护困难
- pp-game-texas: 德州扑克核心
- pp-srs-*: WebSocket 网关层
- pp-robot-*: 机器人服务

### 协议格式

**API 协议:**
```json
// 请求
POST /api/xxx
{ "param1": "value1" }

// 响应
{ "code": 0, "msg": "", "data": {...}, "request_id": "xxx" }
```

**WebSocket 协议:**
```json
// 客户端发送
{ "m": "GSC_CM_Bet", "d": "{\"value\":\"100\"}" }

// 服务端推送
{ "msgName": "GSC_CM_Bet", "data": {...} }
```

---

## 德州扑克核心逻辑

### 游戏流程
```
等待玩家 → 买入 → 准备 → 发牌 → 下注轮次 → 结算 → 等待
```

### 下注类型
| Type | 说明 |
|------|------|
| 0 | 弃牌 (Fold) |
| 1 | 过牌 (Check) |
| 2 | 跟注 (Call) |
| 3 | 加注 (Raise) |
| 4 | 全押 (All-in) |

### 牌型等级
```
皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌
```

---

## Nakama 关键概念

### Match Handler
```go
type MatchHandler interface {
    MatchInit(ctx, match) (interface{}, int, error)
    MatchJoin(ctx, match, presences, isSelf, state) interface{}
    MatchLeave(ctx, match, presences, state) interface{}
    MatchLoop(ctx, match, messages, state) interface{}
    MatchTerminate(ctx, match, graceSeconds, state) interface{}
}
```

### Storage Object
```go
// Collection: "wallet"
// Key: "{user_id}"
// Value: { "gold": "1000", "diamond": "100" }
```

### OpCode 规则
- 1-99: 系统保留
- 100-199: 客户端发送
- 200-299: 服务端推送

---

## 协议映射要点

### API 映射
| 老 API | Nakama RPC |
|--------|------------|
| /api/login/guest | /v2/rpc/auth_guest |
| /api/user/info | /v2/rpc/user_info |
| /api/club/list | /v2/rpc/club_list |

### WS 映射
| 老消息 | OpCode |
|--------|--------|
| GSC_CM_Bet | 101 |
| GSC_Ready | 103 |
| GSC_RoomInfo | 201 |
| GSC_GameResult | 205 |

---

## 数据迁移策略

### 迁移范围
- ✅ 用户基本信息
- ✅ 金币余额
- ❌ 游戏历史记录（保留老系统）

### 迁移方式
1. 新系统启动，老系统保持只读
2. 用户登录时从老系统拉取数据
3. 新数据写入新系统
4. 双写期间保持同步

---

## 风险点

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 协议不兼容 | 老客户端无法使用 | 翻译层完整映射 |
| 数据迁移丢失 | 用户资产丢失 | 只迁移必要数据，老系统保留 |
| 性能问题 | 游戏卡顿 | Nakama 原生高性能，压力测试验证 |

---

## Nakama 已解决的问题

### 使用 Nakama 后，以下问题无需自己处理：

| 问题 | Nakama 解决方案 |
|------|-----------------|
| 状态同步 | Match Handler 内置广播机制 |
| 并发控制 | Go 协程 + Nakama 框架保证 |
| 房间管理 | Match 生命周期管理 |
| 匹配系统 | Matchmaker 内置 |
| 断线重连 | Presence 机制 |
| 消息推送 | WebSocket 内置 |
| 排行榜 | Leaderboard API |
| 聊天系统 | Chat API |

### 我们只需要做：

1. **读懂老代码协议** - 参考 `docs/OLD_CODE_INDEX.md`
2. **设计翻译层映射** - 参考 `docs/06_PROTOCOL_MAPPING.md`
3. **实现游戏逻辑** - 德州扑克 Match Handler

### 游戏逻辑迁移风险实际可控

之前认为"高风险"是基于自研框架的假设。使用 Nakama 后：

```
原风险项              Nakama 解决
─────────────────────────────────────
状态同步复杂    →    Match Handler 内置
并发竞态条件    →    Go 协程 + 框架保证
房间管理        →    Match 生命周期
断线重连        →    Presence 机制
消息推送        →    WebSocket 内置
─────────────────────────────────────
剩余工作        →    游戏规则 + 翻译层
```

**结论**：游戏逻辑迁移风险从"高"降为"中"，主要工作是翻译层和游戏规则实现。
