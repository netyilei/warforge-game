# Nakama 功能模块参考

> 本文档列出了 Nakama 框架提供的所有功能模块及其适用场景，帮助开发人员选择合适的模块来完成任务。

---

## 核心模块

### 1. 认证模块 (Authentication)

**功能描述：**
用户身份验证和会话管理。

**适用场景：**
- 用户注册和登录
- 第三方登录（Facebook、Google、GameCenter 等）
- 设备 ID 登录
- 游客登录
- Token 刷新和验证

**API 接口：**
```go
// 生成认证 Token
nk.AuthenticateTokenGenerate(userID, username, expiresAt, vars)

// 验证 Token
nk.AuthenticateToken(token)

// 刷新 Token
nk.AuthenticateTokenRefresh(token, expiresAt)
```

**相关 RPC：**
- `admin_login` - 管理员登录
- `admin_logout` - 管理员登出

---

### 2. 用户模块 (Users)

**功能描述：**
用户信息管理和社交功能。

**适用场景：**
- 获取和更新用户信息
- 用户搜索
- 好友管理
- 黑名单管理
- 用户群组

**API 接口：**
```go
// 获取用户信息
nk.UsersGetId(ctx, userIDs)

// 更新用户信息
nk.UsersUpdateId(ctx, userID, username, displayName, avatarURL, langTag, location, timezone, metadata)

// 搜索用户
nk.UsersSearch(ctx, query, limit, page)

// 获取好友列表
nk.FriendsList(ctx, userID, state, limit, cursor)

// 添加好友
nk.FriendsAdd(ctx, userID, friendIDs)
```

**相关 RPC：**
- `admin_get_user_info` - 获取管理员用户信息

---

### 3. 存储模块 (Storage)

**功能描述：**
玩家数据持久化存储。

**适用场景：**
- 玩家进度保存
- 游戏配置存储
- 用户偏好设置
- 游戏存档
- 共享数据

**API 接口：**
```go
// 写入存储对象
nk.StorageWrite(ctx, writes)

// 读取存储对象
nk.StorageRead(ctx, reads)

// 删除存储对象
nk.StorageDelete(ctx, deletes)

// 列取存储对象
nk.StorageList(ctx, userID, collection, limit, cursor)
```

**数据结构：**
```go
type StorageWrite struct {
    Collection string      // 集合名称
    Key        string      // 键名
    UserID     string      // 用户ID
    Value      interface{} // 值
    Version    string      // 版本号（乐观锁）
}

type StorageRead struct {
    Collection string // 集合名称
    Key        string // 键名
    UserID     string // 用户ID
}
```

**集合示例：**
- `wallet` - 用户钱包数据
- `user_profile` - 用户资料
- `game_settings` - 游戏设置
- `player_progress` - 玩家进度

---

### 4. 钱包模块 (Wallet)

**功能描述：**
虚拟货币和物品管理。

**适用场景：**
- 金币、钻石等虚拟货币
- 物品和道具管理
- 交易历史记录
- 充值和消费

**API 接口：**
```go
// 更新钱包
nk.WalletUpdate(ctx, userID, changes, metadata, ledger)

// 获取钱包
nk.WalletList(ctx, userID)

// 钱包转账
nk.WalletTransfer(ctx, senderUserID, receiverUserID, changes, metadata)
```

**钱包变更示例：**
```go
changes := map[string]interface{}{
    "gold":   100,  // 增加100金币
    "diamond": -50, // 减少50钻石
    "energy": 20,   // 增加20能量
}
```

---

### 5. 匹配模块 (Matches)

**功能描述：**
游戏房间和实时对战。

**适用场景：**
- 创建游戏房间
- 加入和离开房间
- 实时消息广播
- 游戏状态同步
- 匹配管理

**API 接口：**
```go
// 创建匹配
nk.MatchCreate(ctx, module, label)

// 匹配列表
nk.MatchList(ctx, limit, authoritative, label, minSize, maxSize, query)

// 匹配连接
nk.MatchGet(ctx, matchID)

// 发送匹配消息
nk.MatchSignal(ctx, matchID, data)
```

**Match Handler 接口：**
```go
type MatchHandler interface {
    // 匹配初始化
    MatchInit(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, params map[string]interface{}) (interface{}, int, error)
    
    // 玩家加入
    MatchJoin(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, presences []Presence) interface{}
    
    // 玩家离开
    MatchLeave(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, presences []Presence) interface{}
    
    // 游戏循环
    MatchLoop(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, messages []MatchData) interface{}
    
    // 匹配终止
    MatchTerminate(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{}
}
```

---

### 6. 匹配器模块 (Matchmaker)

**功能描述：**
自动匹配玩家。

**适用场景：**
- 自动匹配对手
- 基于技能的匹配
- 队伍匹配
- 匹配取消

**API 接口：**
```go
// 添加到匹配池
nk.MatchmakerAdd(ctx, userID, sessionID, query, minCount, maxCount, stringProperties, numericProperties)

// 从匹配池移除
nk.MatchmakerRemove(ctx, ticket)
```

**匹配属性：**
```go
stringProperties := map[string]string{
    "region": "asia",
    "game_mode": "ranked",
}

numericProperties := map[string]float64{
    "skill": 1500,
    "level": 10,
}
```

---

### 7. 排行榜模块 (Leaderboards)

**功能描述：**
游戏排行榜和计分。

**适用场景：**
- 全球排行榜
- 好友排行榜
- 周榜/月榜
- 分数提交和查询
- 排名奖励

**API 接口：**
```go
// 创建排行榜
nk.LeaderboardCreate(ctx, id, authoritative, sortOrder, resetSchedule, metadata)

// 删除排行榜
nk.LeaderboardDelete(ctx, id)

// 提交分数
nk.LeaderboardRecordWrite(ctx, id, userID, username, score, subscore, metadata)

// 获取排行榜记录
nk.LeaderboardRecordsList(ctx, id, ownerIDs, limit, cursor, expiry)

// 获取玩家周围的排名
nk.LeaderboardRecordsAroundOwner(ctx, id, ownerID, limit)
```

**排序类型：**
- `0` - 降序（分数越高越好）
- `1` - 升序（分数越低越好，如用时）

---

### 8. 事件模块 (Events)

**功能描述：**
游戏事件生成和处理。

**适用场景：**
- 游戏内事件
- 成就跟踪
- 任务系统
- 数据分析
- 实时通知

**API 接口：**
```go
// 生成事件
nk.Event(ctx, &event)

// 事件结构体
type Event struct {
    Name      string                 // 事件名称
    UserID    string                 // 用户ID
    SessionID string                 // 会话ID
    Timestamp int64                  // 时间戳
    Properties map[string]interface{} // 事件属性
}
```

**事件名称示例：**
- `game_start` - 游戏开始
- `game_end` - 游戏结束
- `level_up` - 升级
- `achievement_unlock` - 成就解锁
- `item_purchase` - 物品购买

---

### 9. 通知模块 (Notifications)

**功能描述：**
用户通知和消息。

**适用场景：**
- 系统通知
- 礼物和奖励
- 好友请求
- 游戏邀请
- 活动通知

**API 接口：**
```go
// 发送通知
nk.NotificationsSend(ctx, notifications)

// 通知结构体
type Notification struct {
    UserID     string      // 用户ID
    Subject    string      // 主题
    Content    interface{} // 内容
    Code       int         // 通知代码
    Persistent bool        // 是否持久化
    SenderID   string      // 发送者ID
}
```

**通知代码示例：**
- `1001` - 好友请求
- `1002` - 礼物通知
- `1003` - 游戏邀请
- `1004` - 系统公告
- `1005` - 活动通知

---

### 10. 会话模块 (Sessions)

**功能描述：**
用户会话管理。

**适用场景：**
- 在线状态跟踪
- 会话断开处理
- 在线玩家列表
- 会话变量

**API 接口：**
```go
// 会话断开回调
func (m *MatchHandler) MatchLeave(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, presences []Presence) interface{}

// 会话变量
ctx.Value("user_id")
ctx.Value("username")
ctx.Value("vars")
```

---

### 11. RPC 模块 (RPC)

**功能描述：**
远程过程调用。

**适用场景：**
- 自定义 API 接口
- 客户端-服务端通信
- 服务端-服务端通信
- 定时任务

**API 接口：**
```go
// 注册 RPC
initializer.RegisterRpc(id, func)

// 调用 RPC
nk.Rpc(ctx, id, payload)
```

**RPC 函数签名：**
```go
func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, payload string) (string, error)
```

**RPC 示例：**
```go
// 注册 RPC
if err := initializer.RegisterRpc("get_user_info", getUserInfo); err != nil {
    return err
}

// RPC 实现
func getUserInfo(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, payload string) (string, error) {
    // 处理逻辑
    return result, nil
}
```

---

### 12. 钩子模块 (Hooks)

**功能描述：**
在特定事件点执行自定义代码。

**适用场景：**
- 认证前/后处理
- 消息处理前/后
- 匹配前/后处理
- 存储读写前/后
- 钱包更新前/后

**API 接口：**
```go
// 注册认证前钩子
initializer.RegisterBeforeAuthenticateEmail(func)

// 注册认证后钩子
initializer.RegisterAfterAuthenticateEmail(func)

// 注册消息前钩子
initializer.RegisterBeforeRt(func)

// 注册消息后钩子
initializer.RegisterAfterRt(func)

// 注册存储写前钩子
initializer.RegisterBeforeStorageWrite(func)

// 注册钱包更新后钩子
initializer.RegisterAfterWalletUpdate(func)
```

**钩子示例：**
```go
// 认证后钩子，创建用户钱包
initializer.RegisterAfterAuthenticateEmail(func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, user *User) error {
    // 创建默认钱包
    changes := map[string]interface{}{
        "gold": 1000,
        "diamond": 100,
    }
    metadata := map[string]interface{}{}
    
    _, err := nk.WalletUpdate(ctx, user.ID, changes, metadata, true)
    return err
})
```

---

### 13. 定时任务模块 (Cron Jobs)

**功能描述：**
定时执行任务。

**适用场景：**
- 每日重置
- 排行榜结算
- 活动开始/结束
- 数据清理
- 统计计算

**API 接口：**
```go
// 注册定时任务
initializer.RegisterCron(id, cronexpr, func)

// 定时任务函数
func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule) error
```

**Cron 表达式示例：**
```go
// 每天午夜执行
"0 0 * * *"

// 每小时执行
"0 * * * *"

// 每周一上午9点执行
"0 9 * * 1"

// 每月1日执行
"0 0 1 * *"
```

**定时任务示例：**
```go
initializer.RegisterCron("daily_reset", "0 0 * * *", func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule) error {
    logger.Info("执行每日重置任务")
    
    // 重置每日任务
    _, err := db.Exec(`UPDATE user_daily SET completed = false, progress = 0`)
    return err
})
```

---

### 14. 实时模块 (Realtime)

**功能描述：**
WebSocket 实时通信。

**适用场景：**
- 游戏状态同步
- 聊天消息
- 实时通知
- 在线状态
- 匹配消息

**消息类型：**
```go
// 客户端发送
MatchDataSend  // 发送匹配数据
MatchPresence  // 更新匹配在线状态

// 服务端接收
MatchData      // 匹配数据
MatchPresence  // 匹配在线状态
MatchmakerMatched // 匹配成功
Notifications  // 通知
StatusPresence // 状态在线
```

---

### 15. 状态模块 (Status)

**功能描述：**
用户在线状态和状态消息。

**适用场景：**
- 在线/离线状态
- 自定义状态消息
- 好友状态更新
- 群组状态

**API 接口：**
```go
// 跟随用户状态
nk.StatusFollow(ctx, userID, followUserIDs)

// 取消跟随
nk.StatusUnfollow(ctx, userID, followUserIDs)

// 更新用户状态
nk.StatusUpdate(ctx, userID, status)
```

---

### 16. 聊天模块 (Chat)

**功能描述：**
实时聊天功能。

**适用场景：**
- 房间聊天
- 公会聊天
- 私聊
- 消息历史
- 消息删除

**API 接口：**
```go
// 发送聊天消息
nk.ChatMessageSend(ctx, channelID, userID, content, persistence)

// 更新聊天消息
nk.ChatMessageUpdate(ctx, channelID, messageID, userID, content)

// 删除聊天消息
nk.ChatMessageRemove(ctx, channelID, messageID, userID)

// 获取聊天消息历史
nk.ChatMessageList(ctx, channelID, limit, cursor, forward)
```

**频道类型：**
- `1` - 房间频道
- `2` - 群组频道
- `3` - 私聊频道

---

### 17. 群组模块 (Groups)

**功能描述：**
玩家群组和公会。

**适用场景：**
- 创建和管理公会
- 群组聊天
- 群组活动
- 群组权限
- 成员管理

**API 接口：**
```go
// 创建群组
nk.GroupCreate(ctx, userID, name, creator, description, langTag, private, open, maxCount, avatarURL)

// 更新群组
nk.GroupUpdate(ctx, groupID, name, creator, description, langTag, private, open, maxCount, avatarURL)

// 删除群组
nk.GroupDelete(ctx, groupID)

// 列出群组
nk.GroupsList(ctx, name, limit, cursor)

// 加入群组
nk.GroupUserAdd(ctx, groupID, userID, status)

// 移除群组成员
nk.GroupUserRemove(ctx, groupID, userID)

// 列出群组成员
nk.GroupUsersList(ctx, groupID, limit, cursor)
```

**群组状态：**
- `0` - 超级管理员
- `1` - 管理员
- `2` - 成员
- `3` - 邀请中
- `4` - 申请中

---

### 18. 日志模块 (Logger)

**功能描述：**
日志记录。

**适用场景：**
- 调试信息
- 错误追踪
- 性能监控
- 审计日志

**API 接口：**
```go
// 调试日志
logger.Debug(format, v...)

// 信息日志
logger.Info(format, v...)

// 警告日志
logger.Warn(format, v...)

// 错误日志
logger.Error(format, v...)
```

**日志示例：**
```go
logger.Info("用户登录: %s, IP: %s", userID, ipAddress)
logger.Error("数据库查询失败: %v", err)
logger.Debug("匹配状态: %v", matchState)
```

---

### 19. 数据库模块 (Database)

**功能描述：**
SQL 数据库操作。

**适用场景：**
- 自定义查询
- 事务处理
- 批量操作
- 复杂数据操作

**API 接口：**
```go
// 查询
rows, err := db.Query(query, args...)

// 查询单行
row := db.QueryRow(query, args...)

// 执行
result, err := db.Exec(query, args...)

// 事务
tx, err := db.Begin()
defer tx.Rollback()

// 使用 tx 执行操作
tx.Exec(query, args...)

// 提交事务
tx.Commit()
```

**SQL 示例：**
```go
// 查询用户
var username string
err := db.QueryRow("SELECT username FROM users WHERE id = $1", userID).Scan(&username)

// 更新数据
_, err := db.Exec("UPDATE users SET coins = coins + $1 WHERE id = $2", amount, userID)
```

---

### 20. 上下文模块 (Context)

**功能描述：**
请求上下文和元数据。

**适用场景：**
- 获取用户信息
- 传递请求数据
- 超时控制
- 取消信号

**上下文值：**
```go
// 用户ID
userID := ctx.Value("user_id").(string)

// 用户会话ID
sessionID := ctx.Value("session_id").(string)

// 用户环境
env := ctx.Value("env").(string)

// 客户端IP
clientIP := ctx.Value("client_ip").(string)

// 用户代理
userAgent := ctx.Value("user_agent").(string)

// 过期时间
expiryTime := ctx.Value("expiry_time").(int64)
```

---

## 功能模块选择指南

### 按功能需求选择

| 功能需求 | 推荐模块 | 说明 |
|---------|---------|------|
| 用户登录认证 | Authentication | 处理用户身份验证 |
| 玩家数据存储 | Storage | 保存玩家进度和配置 |
| 游戏房间对战 | Matches | 管理游戏房间和实时通信 |
| 自动匹配玩家 | Matchmaker | 基于规则匹配对手 |
| 排行榜系统 | Leaderboards | 实现游戏排名和计分 |
| 虚拟货币系统 | Wallet | 管理金币、钻石等 |
| 聊天功能 | Chat | 实时聊天和消息历史 |
| 公会/群组 | Groups | 玩家社群管理 |
| 系统通知 | Notifications | 推送游戏通知 |
| 事件追踪 | Events | 游戏事件记录和分析 |
| 定时任务 | Cron Jobs | 每日重置、活动开始等 |
| 自定义 API | RPC | 扩展服务端功能 |
| 数据处理钩子 | Hooks | 在事件点执行自定义逻辑 |
| 在线状态 | Status | 跟踪玩家在线状态 |
| 自定义 SQL | Database | 复杂数据库操作 |

---

### 按游戏类型选择

| 游戏类型 | 核心模块 | 说明 |
|---------|---------|------|
| 实时对战游戏 | Matches, Matchmaker | 德州扑克、MOBA 等 |
| 卡牌游戏 | Storage, Wallet | 保存卡牌和虚拟物品 |
| 休闲游戏 | Leaderboards, Events | 排行榜和事件追踪 |
| RPG 游戏 | Storage, Groups, Chat | 玩家数据、公会、聊天 |
| 竞技游戏 | Matches, Leaderboards | 对战和排名 |
| 社交游戏 | Groups, Chat, Status | 社交功能 |

---

## 模块依赖关系

```
Authentication
    ↓
Users → Storage → Wallet
    ↓         ↓
    ↓      Leaderboards
    ↓         ↓
Matches ← Matchmaker
    ↓
Chat → Groups → Notifications
    ↓
Events → Status
    ↓
Cron Jobs → Database
    ↓
RPC → Hooks
    ↓
Logger
```

---

## 最佳实践

### 1. 模块组合使用

**示例：玩家登录流程**
```
1. Authentication - 验证用户身份
2. Users - 获取用户信息
3. Storage - 读取玩家数据
4. Wallet - 检查钱包余额
5. Events - 记录登录事件
6. Status - 更新在线状态
```

**示例：游戏对战流程**
```
1. Matchmaker - 添加到匹配池
2. Matches - 创建游戏房间
3. Storage - 读取玩家配置
4. Wallet - 扣除入场费
5. Events - 记录游戏开始
6. Matches - 实时游戏同步
7. Wallet - 分配奖励
8. Leaderboards - 更新分数
9. Events - 记录游戏结束
```

### 2. 错误处理

```go
// 总是检查错误
if err := nk.WalletUpdate(ctx, userID, changes, metadata, true); err != nil {
    logger.Error("钱包更新失败: %v", err)
    return "", err
}

// 记录详细日志
logger.Debug("操作: %s, 用户: %s, 结果: %v", action, userID, result)
```

### 3. 性能优化

```go
// 使用批量操作
// 避免循环中调用 API
// 使用缓存减少数据库查询
// 合理使用索引
```

### 4. 安全性

```go
// 验证用户输入
// 检查权限
// 记录审计日志
// 使用事务保证数据一致性
```

---

## 相关文档

- [00_OVERVIEW.md](./00_OVERVIEW.md) - 服务端概述
- [01_ADMIN_MODULE.md](./01_ADMIN_MODULE.md) - 管理后台模块
- [04_ARCHITECTURE.md](./04_ARCHITECTURE.md) - 架构设计
- [05_DATABASE_DESIGN.md](./05_DATABASE_DESIGN.md) - 数据库设计
- [07_PROTOCOL_MAPPING.md](./07_PROTOCOL_MAPPING.md) - 协议映射
- [08_NAKAMA_API_REFERENCE.md](./08_NAKAMA_API_REFERENCE.md) - Nakama API 参考
