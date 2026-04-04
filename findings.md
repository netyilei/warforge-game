# Findings: 研究发现

> 记录所有重要发现，防止上下文丢失

---

## 路由配置发现 (2026-04-04)

### 动态路由机制

WarForge Admin 采用动态路由模式，路由由后端根据用户权限动态生成：

1. **前端路由为准**：elegant-router 根据文件结构自动生成路由
2. **数据库必须匹配**：`admin_permissions.code` 必须与前端路由名称一致
3. **组件路径格式**：
   - 一级菜单（有子菜单）：`layout.base`
   - 二级菜单：`view.{路由名}`
   - 首页特殊：`layout.base$view.home`

### 常见路由错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 登录后跳转 404 | home 组件路径错误 | 使用 `layout.base$view.home` |
| 菜单点击无反应 | code 与路由名不匹配 | 使用下划线分隔，如 `storage_config` |
| 权限层级混乱 | parent_id 设置错误 | 确保 parent_id 与文件目录结构一致 |

### 迁移脚本编码问题

PowerShell 的 `Get-Content` 管道传输可能导致 UTF-8 编码问题：

```powershell
# 错误方式
Get-Content file.sql | docker exec -i cockroach cockroach sql

# 正确方式
docker cp file.sql cockroach:/tmp/file.sql
docker exec cockroach cockroach sql -f /tmp/file.sql
```

---

## 数据库设计发现 (2026-04-04)

### NULL 值处理

CockroachDB（PostgreSQL 兼容）中 NULL 值需要特殊处理：

```go
// 错误：无法接收 NULL
type Permission struct {
    Path string
}

// 正确：使用指针类型
type Permission struct {
    Path *string
}

// 或使用 sql.NullString
type Permission struct {
    Path sql.NullString
}
```

### 迁移脚本最佳实践

1. 使用 `IF NOT EXISTS` 创建表
2. 使用 `ON CONFLICT DO NOTHING` 插入数据
3. 使用 `ON CONFLICT DO UPDATE` 更新已存在的数据

```sql
CREATE TABLE IF NOT EXISTS my_table (...);

INSERT INTO my_table (id, name) VALUES (1, 'test')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

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

### 使用 Nakama 后，以下问题无需自己处理

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

### 我们只需要做

1. **读懂老代码协议** - 参考 `docs/old_client/01_OLD_CODE_INDEX.md`
2. **设计翻译层映射** - 参考 `docs/server/07_PROTOCOL_MAPPING.md`
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
