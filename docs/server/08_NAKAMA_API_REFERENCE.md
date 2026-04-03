# Nakama-Common v1.45.0 Runtime API Reference

> 本文档基于 nakama-common v1.45.0 整理，用于项目开发参考
>
> 生成日期：2026-04-03

**数据库名称：** `nakama`

## 官方文档链接

- [pkg.go.dev - runtime](https://pkg.go.dev/github.com/heroiclabs/nakama-common/runtime)
- [pkg.go.dev - api](https://pkg.go.dev/github.com/heroiclabs/nakama-common/api)
- [Heroic Labs Docs](https://heroiclabs.com/docs/nakama/server-framework/go-runtime/)

---

## 模块入口

```go
package main

import (
    "context"
    "database/sql"

    "github.com/heroiclabs/nakama-common/runtime"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
    logger.Info("module loaded")
    return nil
}
```

---

## runtime.NakamaModule 接口

### 认证相关

```go
type NakamaModule interface {
    // Apple 认证
    AuthenticateApple(ctx context.Context, token, username string, create bool) (string, string, bool, error)
    
    // 自定义 ID 认证
    AuthenticateCustom(ctx context.Context, id, username string, create bool) (string, string, bool, error)
    
    // 设备 ID 认证
    AuthenticateDevice(ctx context.Context, id, username string, create bool) (string, string, bool, error)
    
    // 邮箱密码认证
    AuthenticateEmail(ctx context.Context, email, password, username string, create bool) (string, string, bool, error)
    
    // Facebook 认证
    AuthenticateFacebook(ctx context.Context, token string, importFriends bool, username string, create bool) (string, string, bool, error)
    
    // Facebook Instant Game 认证
    AuthenticateFacebookInstantGame(ctx context.Context, signedPlayerInfo string, username string, create bool) (string, string, bool, error)
    
    // Game Center 认证
    AuthenticateGameCenter(ctx context.Context, playerID, bundleID string, timestamp int64, salt, signature, publicKeyUrl, username string, create bool) (string, string, bool, error)
    
    // Google 认证
    AuthenticateGoogle(ctx context.Context, token, username string, create bool) (string, string, bool, error)
    
    // Steam 认证
    AuthenticateSteam(ctx context.Context, token, username string, create bool) (string, string, bool, error)

    // ⭐ 生成认证 Token（重要）
    // userID: 用户ID
    // username: 用户名
    // exp: 过期时间戳（Unix秒）
    // vars: 自定义变量
    // 返回: (token string, exp int64, error)
    AuthenticateTokenGenerate(userID, username string, exp int64, vars map[string]string) (string, int64, error)
}
```

### 账户管理

```go
type NakamaModule interface {
    // 获取账户信息
    AccountGetId(ctx context.Context, userID string) (*api.Account, error)
    
    // 批量获取账户信息
    AccountsGetId(ctx context.Context, userIDs, deviceIDs []string) ([]*api.Account, error)
    
    // 更新账户信息
    AccountUpdateId(ctx context.Context, userID, username string, metadata map[string]interface{}, displayName, timezone, location, langTag, avatarUrl string) error

    // 删除账户
    AccountDeleteId(ctx context.Context, userID string, recorded bool) error
    
    // 导出账户数据
    AccountExportId(ctx context.Context, userID string) (string, error)
    
    // 导入账户数据
    AccountImportId(ctx context.Context, data, userID string) (*api.Account, error)
}
```

### 用户管理

```go
type NakamaModule interface {
    // 通过 ID 获取用户
    UsersGetId(ctx context.Context, userIDs []string, facebookIDs []string) ([]*api.User, error)
    
    // 通过用户名获取用户
    UsersGetUsername(ctx context.Context, usernames []string) ([]*api.User, error)
    
    // 获取好友状态
    UsersGetFriendStatus(ctx context.Context, userID string, userIDs []string) ([]*api.Friend, error)
    
    // 获取随机用户
    UsersGetRandom(ctx context.Context, count int) ([]*api.User, error)
    
    // 封禁用户
    UsersBanId(ctx context.Context, userIDs []string) error
    
    // 解封用户
    UsersUnbanId(ctx context.Context, userIDs []string) error
}
```

### 账户关联

```go
type NakamaModule interface {
    // 关联 Apple
    LinkApple(ctx context.Context, userID, token string) error
    // 关联自定义 ID
    LinkCustom(ctx context.Context, userID, customID string) error
    // 关联设备 ID
    LinkDevice(ctx context.Context, userID, deviceID string) error
    // 关联邮箱
    LinkEmail(ctx context.Context, userID, email, password string) error
    // 关联 Facebook
    LinkFacebook(ctx context.Context, userID, username, token string, importFriends bool) error
    // 关联 Facebook Instant Game
    LinkFacebookInstantGame(ctx context.Context, userID, signedPlayerInfo string) error
    // 关联 Game Center
    LinkGameCenter(ctx context.Context, userID, playerID, bundleID string, timestamp int64, salt, signature, publicKeyUrl string) error
    // 关联 Google
    LinkGoogle(ctx context.Context, userID, token string) error
    // 关联 Steam
    LinkSteam(ctx context.Context, userID, username, token string, importFriends bool) error

    // 解除关联（对应 Link 方法）
    UnlinkApple(ctx context.Context, userID, token string) error
    UnlinkCustom(ctx context.Context, userID, customID string) error
    UnlinkDevice(ctx context.Context, userID, deviceID string) error
    UnlinkEmail(ctx context.Context, userID, email string) error
    UnlinkFacebook(ctx context.Context, userID, token string) error
    UnlinkFacebookInstantGame(ctx context.Context, userID, signedPlayerInfo string) error
    UnlinkGameCenter(ctx context.Context, userID, playerID, bundleID string, timestamp int64, salt, signature, publicKeyUrl string) error
    UnlinkGoogle(ctx context.Context, userID, token string) error
    UnlinkSteam(ctx context.Context, userID, token string) error
}
```

### Storage 相关

```go
type NakamaModule interface {
    // 存储索引列表查询
    StorageIndexList(ctx context.Context, collection string, query string, limit int, cursor string, order []string) (*api.StorageObjectList, error)
    
    // 存储索引 ID 列表查询
    StorageIndexListIds(ctx context.Context, collection string, query string, limit int, cursor string, order []string) (*api.StorageObjectIdList, error)
    
    // 列出存储对象
    StorageList(ctx context.Context, collection string, userID string, limit int, cursor string) (*api.StorageObjectList, error)
    
    // 读取存储对象
    StorageRead(ctx context.Context, reads []*StorageRead) ([]*api.StorageObject, error)
    
    // 写入存储对象
    StorageWrite(ctx context.Context, writes []*StorageWrite) ([]*api.StorageObjectAck, error)
    
    // 删除存储对象
    StorageDelete(ctx context.Context, deletes []*StorageDelete) error
}
```

### StorageRead 结构

```go
type StorageRead struct {
    Collection string
    Key       string
    UserID    string
}
```

### StorageWrite 结构

```go
type StorageWrite struct {
    Collection  string
    Key         string
    UserID      string
    Value       string
    Version     string
    PermissionRead  int
    PermissionWrite int
}
```

### Storage 权限常量

```go
const (
    STORAGE_PERMISSION_PUBLIC_READ  = 2  // 所有人可读
    STORAGE_PERMISSION_OWNER_READ   = 1  // 仅所有者可读
    STORAGE_PERMISSION_NO_READ      = 0  // 不可读
    STORAGE_PERMISSION_OWNER_WRITE  = 1  // 仅所有者可写
    STORAGE_PERMISSION_NO_WRITE     = 0  // 不可写
)
```

### Match 相关

```go
type NakamaModule interface {
    // 创建 Match
    MatchCreate(ctx context.Context, module string, params map[string]interface{}) (string, error)
    
    // 获取 Match 信息
    MatchGet(ctx context.Context, matchID string) (*api.Match, error)
    
    // 列出 Match
    MatchList(ctx context.Context, limit int, authoritative bool, label string, minSize int, maxSize int, query string) ([]*api.Match, error)
    
    // 向 Match 发送信号
    MatchSignal(ctx context.Context, matchID string, data string) (string, error)
}
```

### Matchmaker 相关

```go
type NakamaModule interface {
    // 创建匹配票
    MatchmakerCreate(ctx context.Context, minCount int, maxCount int, query string, stringProperties map[string]string, numericProperties map[string]float64) (string, error)
    
    // 删除匹配票
    MatchmakerDelete(ctx context.Context, ticket string, sessionID string) error
    
    // 获取匹配票状态
    MatchmakerGet(ctx context.Context, ticket string) ([]*MatchmakerEntry, error)
}
```

### Leaderboard 相关

```go
type NakamaModule interface {
    // 创建排行榜
    LeaderboardCreate(ctx context.Context, id string, authoritative bool, sortOrder string, operator string, resetSchedule string, metadata map[string]interface{}) error
    
    // 删除排行榜
    LeaderboardDelete(ctx context.Context, id string) error
    
    // 列出排行榜记录
    LeaderboardRecordsList(ctx context.Context, id string, ownerIDs []string, limit int, cursor string, expiry int64) (*api.LeaderboardRecordList, error)
    
    // 写入排行榜记录
    LeaderboardRecordWrite(ctx context.Context, id string, ownerID string, username string, score int64, subscore int64, metadata map[string]interface{}) (*api.LeaderboardRecord, error)
    
    // 删除排行榜记录
    LeaderboardRecordDelete(ctx context.Context, id string, ownerID string) error
    
    // 禁用排行榜排名
    LeaderboardRanksDisable(ctx context.Context, id string) error
}
```

### Tournament 相关

```go
type NakamaModule interface {
    // 创建锦标赛
    TournamentCreate(ctx context.Context, id string, authoritative bool, sortOrder string, operator string, duration int64, resetSchedule string, metadata map[string]interface{}, title string, description string, category int, startTime int64, endTime int64, maxSize int, maxNumScore int, joinRequired bool) error
    
    // 删除锦标赛
    TournamentDelete(ctx context.Context, id string) error
    
    // 添加尝试次数
    TournamentAddAttempt(ctx context.Context, id string, ownerID string, count int) error
    
    // 加入锦标赛
    TournamentJoin(ctx context.Context, id string, ownerID string, username string) error
    
    // 通过 ID 加入锦标赛
    TournamentJoinById(ctx context.Context, id string, ownerID string, username string) error
    
    // 列出锦标赛
    TournamentList(ctx context.Context, categoryStart int, categoryEnd int, startTime int, endTime int, limit int, cursor string) (*api.TournamentList, error)
    
    // 列出锦标赛记录
    TournamentRecordsList(ctx context.Context, id string, ownerIDs []string, limit int, cursor string, expiry int64) (*api.TournamentRecordList, error)
    
    // 写入锦标赛记录
    TournamentRecordWrite(ctx context.Context, id string, ownerID string, username string, score int64, subscore int64, metadata map[string]interface{}) (*api.LeaderboardRecord, error)
    
    // 删除锦标赛记录
    TournamentRecordDelete(ctx context.Context, id string, ownerID string) error
    
    // 获取锦标赛周围记录
    TournamentRecordsHaystack(ctx context.Context, id string, ownerID string, limit int, cursor string, expiry int64) (*api.TournamentRecordList, error)
    
    // 禁用锦标赛排名
    TournamentRanksDisable(ctx context.Context, id string) error
}
```

### Wallet 相关

```go
type NakamaModule interface {
    // 获取钱包
    WalletGet(ctx context.Context, userID string) (string, error)
    
    // 更新钱包
    WalletUpdate(ctx context.Context, userID string, changeset map[string]int64, metadata map[string]interface{}, updateLedger bool) (*WalletUpdateResult, error)
    
    // 列出钱包账本
    WalletLedgerList(ctx context.Context, userID string, limit int, cursor string) ([]*WalletLedgerItem, error)
    
    // 更新钱包账本
    WalletLedgerUpdate(ctx context.Context, userID string, itemID string, metadata map[string]interface{}) error
}
```

### WalletUpdate 结构

```go
type WalletUpdate struct {
    UserID    string
    Changeset map[string]int64
    Metadata  map[string]interface{}
}

type WalletUpdateResult struct {
    UserID   string
    Updated  map[string]int64
    Previous map[string]int64
}
```

### Group 相关

```go
type NakamaModule interface {
    // 通过 ID 获取群组
    GroupsGetId(ctx context.Context, groupIDs []string) ([]*api.Group, error)
    
    // 创建群组
    GroupCreate(ctx context.Context, userID, name, creatorID, langTag, description, avatarUrl string, open bool, metadata map[string]interface{}, maxCount int) (*api.Group, error)
    
    // 更新群组
    GroupUpdate(ctx context.Context, id, userID, name, creatorID, langTag, description, avatarUrl string, open bool, metadata map[string]interface{}, maxCount int) error
    
    // 删除群组
    GroupDelete(ctx context.Context, id string) error
    
    // 用户加入群组
    GroupUserJoin(ctx context.Context, groupID, userID, username string) error
    
    // 用户离开群组
    GroupUserLeave(ctx context.Context, groupID, userID, username string) error
    
    // 添加群组成员
    GroupUsersAdd(ctx context.Context, callerID, groupID string, userIDs []string) error
    
    // 封禁群组成员
    GroupUsersBan(ctx context.Context, callerID, groupID string, userIDs []string) error
    
    // 踢出群组成员
    GroupUsersKick(ctx context.Context, callerID, groupID string, userIDs []string) error
    
    // 提升群组成员
    GroupUsersPromote(ctx context.Context, callerID, groupID string, userIDs []string) error
    
    // 降级群组成员
    GroupUsersDemote(ctx context.Context, callerID, groupID string, userIDs []string) error
    
    // 列出群组成员
    GroupUsersList(ctx context.Context, id string, limit int, state *int, cursor string) ([]*api.GroupUserList_GroupUser, string, error)
    
    // 列出群组
    GroupsList(ctx context.Context, name, langTag string, members *int, open *bool, limit int, cursor string) ([]*api.Group, string, error)
    
    // 获取随机群组
    GroupsGetRandom(ctx context.Context, count int) ([]*api.Group, error)
    
    // 列出用户的群组
    UserGroupsList(ctx context.Context, userID string, limit int, state *int, cursor string) ([]*api.UserGroupList_UserGroup, string, error)
}
```

### Friend 相关

```go
type NakamaModule interface {
    // 更新好友元数据
    FriendMetadataUpdate(ctx context.Context, userID string, friendUserId string, metadata map[string]any) error
    
    // 列出好友
    FriendsList(ctx context.Context, userID string, limit int, state *int, cursor string) ([]*api.Friend, string, error)
    
    // 列出好友的好友
    FriendsOfFriendsList(ctx context.Context, userID string, limit int, cursor string) ([]*api.FriendsOfFriendsList_FriendOfFriend, string, error)
    
    // 添加好友
    FriendsAdd(ctx context.Context, userID string, username string, ids []string, usernames []string, metadata map[string]any) error
    
    // 删除好友
    FriendsDelete(ctx context.Context, userID string, username string, ids []string, usernames []string) error
    
    // 屏蔽好友
    FriendsBlock(ctx context.Context, userID string, username string, ids []string, usernames []string) error
}
```

### Notification 相关

```go
type NakamaModule interface {
    // 发送通知
    NotificationSend(ctx context.Context, userID string, subject string, content string, code int, senderID string, persistent bool) error
    
    // 通过 ID 发送通知
    NotificationSendId(ctx context.Context, id string, userID string, subject string, content string, code int, senderID string, persistent bool) error
    
    // 发送全局通知
    NotificationSendAll(ctx context.Context, subject string, content string, code int, persistent bool) error
}
```

### NotificationSend 结构

```go
type NotificationSend struct {
    UserID     string
    Subject    string
    Content    string
    Code       int
    SenderID   string
    Persistent bool
}
```

### Channel 相关

```go
type NakamaModule interface {
    // 构建 Channel ID
    ChannelIdBuild(ctx context.Context, sender string, target string, chanType ChannelType) (string, error)
    
    // 发送 Channel 消息
    ChannelMessageSend(ctx context.Context, channelID string, content map[string]interface{}, senderId, senderUsername string, persist bool) (*rtapi.ChannelMessageAck, error)
    
    // 更新 Channel 消息
    ChannelMessageUpdate(ctx context.Context, channelID, messageID string, content map[string]interface{}, senderId, senderUsername string, persist bool) (*rtapi.ChannelMessageAck, error)
    
    // 删除 Channel 消息
    ChannelMessageRemove(ctx context.Context, channelId, messageId string, senderId, senderUsername string, persist bool) (*rtapi.ChannelMessageAck, error)
    
    // 列出 Channel 消息
    ChannelMessagesList(ctx context.Context, channelId string, limit int, forward bool, cursor string) (messages []*api.ChannelMessage, nextCursor string, prevCursor string, err error)
}
```

### Party 相关

```go
type NakamaModule interface {
    // 列出 Party
    PartyList(ctx context.Context, limit int, open *bool, showHidden bool, query, cursor string) ([]*api.Party, string, error)
}
```

### Status 相关

```go
type NakamaModule interface {
    // 关注用户状态
    StatusFollow(sessionID string, userIDs []string) error
    
    // 取消关注用户状态
    StatusUnfollow(sessionID string, userIDs []string) error
}
```

### Event 相关

```go
type NakamaModule interface {
    // 发送事件
    Event(ctx context.Context, evt *api.Event) error
}
```

### Metrics 相关

```go
type NakamaModule interface {
    // 增加计数器
    MetricsCounterAdd(name string, tags map[string]string, delta int64)
    
    // 设置仪表
    MetricsGaugeSet(name string, tags map[string]string, value float64)
    
    // 记录计时器
    MetricsTimerRecord(name string, tags map[string]string, value time.Duration)
}
```

### Stream 相关

```go
type NakamaModule interface {
    // 列出 Stream 用户
    StreamUserList(mode uint8, subject, subcontext, label string, includeHidden, includeNotHidden bool) ([]Presence, error)
    
    // 获取 Stream 用户
    StreamUserGet(mode uint8, subject, subcontext, label, userID, sessionID string) (PresenceMeta, error)
    
    // 加入 Stream
    StreamUserJoin(mode uint8, subject, subcontext, label, userID, sessionID string, hidden, persistence bool, status string) (bool, error)
    
    // 更新 Stream
    StreamUserUpdate(mode uint8, subject, subcontext, label, userID, sessionID string, hidden, persistence bool, status string) error
    
    // 离开 Stream
    StreamUserLeave(mode uint8, subject, subcontext, label, userID, sessionID string) error
    
    // 踢出 Stream 用户
    StreamUserKick(mode uint8, subject, subcontext, label string, presenceIDs ...*PresenceId) error
    
    // 计数 Stream 用户
    StreamCount(mode uint8, subject, subcontext, label string) (int, error)
}
```

### Satori 相关

```go
type NakamaModule interface {
    // 获取 Satori 客户端
    GetSatori() Satori
    
    // 获取 Fleet Manager
    GetFleetManager() FleetManager
}
```

---

## runtime.Match 接口

```go
type Match interface {
    MatchInit(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, params map[string]interface{}) (interface{}, int, string)
    MatchJoinAttempt(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, presence Presence, metadata map[string]string) (interface{}, bool, string)
    MatchJoin(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, presences []Presence) interface{}
    MatchLeave(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, presences []Presence) interface{}
    MatchLoop(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, messages []MatchData) interface{}
    MatchTerminate(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{}
    MatchSignal(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, dispatcher MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string)
}
```

### Match 方法说明

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `MatchInit` | 初始化 Match，设置初始状态 | `(state, tickRate, label)` |
| `MatchJoinAttempt` | 玩家尝试加入 | `(state, accept, reason)` |
| `MatchJoin` | 玩家成功加入 | `state` |
| `MatchLeave` | 玩家离开 | `state` |
| `MatchLoop` | 游戏主循环，按 tickRate 调用 | `state` |
| `MatchTerminate` | Match 终止 | `state` |
| `MatchSignal` | 接收信号 | `(state, response)` |

### MatchInit 返回值

```go
func (m *Match) MatchInit(...) (interface{}, int, string) {
    state := &MatchState{}      // 游戏状态
    tickRate := 10              // 每秒调用 MatchLoop 次数 (1-60)
    label := "{\"game\":\"texas\"}"  // Match 标签，用于筛选
    return state, tickRate, label
}
```

---

## runtime.Presence 接口

```go
type Presence interface {
    GetUserId() string
    GetSessionId() string
    GetNodeId() string
    GetHidden() bool
    GetPersistence() bool
    GetUsername() string
    GetReason() PresenceReason
}
```

---

## runtime.MatchData 接口

```go
type MatchData interface {
    Presence
    GetOpCode() int64
    GetData() []byte
    GetReceiveTime() int64
}
```

---

## runtime.MatchDispatcher 接口

```go
type MatchDispatcher interface {
    BroadcastMessage(opCode int64, data []byte, presences []Presence, reliable bool) error
    BroadcastMessageDeferred(opCode int64, data []byte, presences []Presence, reliable bool) error
    MatchKick(presences []Presence) error
    MatchLabelUpdate(label string) error
}
```

---

## runtime.Initializer 接口

```go
type Initializer interface {
    // 注册 RPC 函数
    RegisterRpc(id string, fn func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, payload string) (string, error)) error
    
    // 注册 Match
    RegisterMatch(module string, fn func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule) (Match, error)) error
    
    // 注册实时消息钩子
    RegisterBeforeRt(id int, fn func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, envelope *rtapi.Envelope) (*rtapi.Envelope, error)) error
    RegisterAfterRt(id int, fn func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, envelope *rtapi.Envelope) (*rtapi.Envelope, error)) error
    
    // 注册认证钩子
    RegisterBeforeAuthenticateCustom(fn func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, id string, username string, create bool) (string, string, bool, error)) error
    RegisterAfterAuthenticateCustom(fn func(ctx context.Context, logger Logger, db *sql.DB, nk NakamaModule, id string, username string, create bool, account *api.Account) error) error
    
    // 禁用功能
    DisableFeatures(features ...Feature) error
}
```

---

## Context 常量

```go
const (
    RUNTIME_CTX_ENV            = "env"
    RUNTIME_CTX_MODE           = "execution_mode"
    RUNTIME_CTX_NODE           = "node"
    RUNTIME_CTX_VERSION        = "version"
    RUNTIME_CTX_HEADERS        = "headers"
    RUNTIME_CTX_QUERY_PARAMS   = "query_params"
    RUNTIME_CTX_USER_ID        = "user_id"
    RUNTIME_CTX_USERNAME       = "username"
    RUNTIME_CTX_VARS           = "vars"
    RUNTIME_CTX_USER_SESSION_EXP = "user_session_exp"
    RUNTIME_CTX_SESSION_ID     = "session_id"
    RUNTIME_CTX_LANG           = "lang"
    RUNTIME_CTX_CLIENT_IP      = "client_ip"
    RUNTIME_CTX_CLIENT_PORT    = "client_port"
    RUNTIME_CTX_MATCH_ID       = "match_id"
    RUNTIME_CTX_MATCH_NODE     = "match_node"
    RUNTIME_CTX_MATCH_LABEL    = "match_label"
    RUNTIME_CTX_MATCH_TICK_RATE = "match_tick_rate"
    RUNTIME_CTX_TRACE_ID       = "trace_id"
)
```

### Context 使用示例

```go
func myRpc(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    // 获取用户 ID
    userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
    if !ok {
        return "", runtime.NewError("Unauthorized", 401)
    }
    
    // 获取用户名
    username, _ := ctx.Value(runtime.RUNTIME_CTX_USERNAME).(string)
    
    // 获取客户端 IP
    clientIP, _ := ctx.Value(runtime.RUNTIME_CTX_CLIENT_IP).(string)
    
    logger.Info("User %s (%s) called RPC from %s", userID, username, clientIP)
    
    return "{}", nil
}
```

---

## runtime.Logger 接口

```go
type Logger interface {
    Debug(format string, a ...interface{})
    Info(format string, a ...interface{})
    Warn(format string, a ...interface{})
    Error(format string, a ...interface{})
}
```

---

## runtime.Error 类型

```go
type Error struct {
    Message string
    Code    int
}

func NewError(message string, code int) *Error
func (e *Error) Error() string
```

### 错误使用示例

```go
func myRpc(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    // 返回自定义错误
    return "", runtime.NewError("User not found", 404)
}
```

---

## ⚠️ 重要：HTTP RPC 调用 payload 格式

### 问题描述

当通过 HTTP API 调用 RPC 函数时（如 `POST /v2/rpc/{id}`），Nakama 内部使用 gRPC 网关处理请求。由于 Protocol Buffers 不支持直接 JSON 类型，**payload 必须作为 JSON 字符串传递**（双重编码）。

这意味着：

- 客户端发送的 body 是一个 **JSON 字符串**，该字符串的内容是另一个 JSON 对象
- RPC 函数收到的 `payload` 参数是 **JSON 对象的字符串形式**

### 错误示例

```bash
# 错误：直接发送 JSON 对象
curl -X POST "http://localhost:7350/v2/rpc/my_rpc?http_key=mykey" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 结果：{"error":"json: cannot unmarshal object into Go value of type string","code":3}
```

### 正确示例

```bash
# 正确：payload 是 JSON 对象的双重编码字符串
curl -X POST "http://localhost:7350/v2/rpc/my_rpc?http_key=mykey" \
  -H "Content-Type: application/json" \
  -d '"{\"username\":\"admin\",\"password\":\"admin123\"}"'
```

### 前端调用示例（TypeScript）

```typescript
import axios from 'axios';

export const nakamaRpc = async <T>(rpcId: string, payload?: Record<string, unknown>): Promise<T> => {
  const response = await axios({
    url: `/v2/rpc/${rpcId}`,
    method: 'POST',
    data: JSON.stringify(JSON.stringify(payload || {})),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// 调用
const result = await nakamaRpc<LoginResponse>('admin_login', {
  username: 'admin',
  password: 'admin123'
});
```

### Go 服务端接收示例

```go
func adminLogin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    // payload 是 JSON 字符串，需要先解析
    var req LoginRequest
    if err := json.Unmarshal([]byte(payload), &req); err != nil {
        return `{"error":"Invalid request format"}`, nil
    }

    // 现在 req.Username 和 req.Password 可以使用了
    logger.Info("Login attempt for user: %s", req.Username)
    // ...
}
```

### 使用 ?unwrap 参数（推荐）

在较新版本的 Nakama 中，可以使用 `?unwrap` 参数来跳过双重编码，直接接收原始 JSON：

```bash
curl -X POST "http://localhost:7350/v2/rpc/my_rpc?http_key=mykey&unwrap" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 错误变量

```go
var (
    // Storage 错误
    ErrStorageRejectedVersion    = errors.New("Storage write rejected - version check failed.")
    ErrStorageRejectedPermission = errors.New("Storage write rejected - permission denied.")
    
    // Match 错误
    ErrMatchNotFound             = errors.New("match not found")
    ErrMatchIdInvalid            = errors.New("match id invalid")
    ErrMatchLabelTooLong         = errors.New("match label too long, must be 0-2048 bytes")
    
    // Matchmaker 错误
    ErrMatchmakerQueryInvalid    = errors.New("matchmaker query invalid")
    
    // Leaderboard 错误
    ErrLeaderboardNotFound       = errors.New("leaderboard not found")
    
    // Tournament 错误
    ErrTournamentNotFound        = errors.New("tournament not found")
    
    // Group 错误
    ErrGroupNotFound             = errors.New("group not found")
    ErrGroupFull                 = errors.New("group is full")
    
    // Party 错误
    ErrPartyFull                 = errors.New("party full")
    ErrPartyNotLeader            = errors.New("party leader only")
)
```

---

## 完整 Match Handler 示例

```go
package match

import (
    "context"
    "database/sql"

    "github.com/heroiclabs/nakama-common/runtime"
)

type Match struct{}

type MatchState struct {
    presences map[string]runtime.Presence
}

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
    return initializer.RegisterMatch("standard_match", newMatch)
}

func newMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
    return &Match{}, nil
}

func (m *Match) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
    state := &MatchState{
        presences: make(map[string]runtime.Presence),
    }
    tickRate := 1
    label := ""
    return state, tickRate, label
}

func (m *Match) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
    return state, true, ""
}

func (m *Match) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
    mState, _ := state.(*MatchState)
    for _, p := range presences {
        mState.presences[p.GetUserId()] = p
    }
    return mState
}

func (m *Match) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
    mState, _ := state.(*MatchState)
    for _, p := range presences {
        delete(mState.presences, p.GetUserId())
    }
    return mState
}

func (m *Match) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
    mState, _ := state.(*MatchState)
    for _, message := range messages {
        reliable := true
        dispatcher.BroadcastMessage(1, message.GetData(), []runtime.Presence{message}, reliable)
    }
    return mState
}

func (m *Match) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
    return state
}

func (m *Match) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
    return state, "signal received: " + data
}
```

---

## 构建命令

```bash
# 构建 Nakama 插件
go build -buildmode=plugin -trimpath -o ./modules/warforge-server.so ./cmd

# 使用 Docker 构建（Windows 推荐）
docker run --rm -w "/builder" -v "${PWD}:/builder" heroiclabs/nakama-pluginbuilder:3.18.0 build -buildmode=plugin -trimpath -o ./modules/warforge-server.so ./cmd
```

---

## 常用代码片段

### 生成 Token

```go
expiresAt := time.Now().Add(24 * time.Hour).Unix()
token, _, err := nk.AuthenticateTokenGenerate(userID, username, expiresAt, map[string]string{
    "type": "admin",
})
if err != nil {
    return "", runtime.NewError("Failed to generate token", 500)
}
```

### 读取 Storage

```go
objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{
    {
        Collection: "game_data",
        Key:        "player_state",
        UserID:     userID,
    },
})
if err != nil {
    return "", err
}

if len(objects) > 0 {
    var state PlayerState
    json.Unmarshal([]byte(objects[0].GetValue()), &state)
}
```

### 写入 Storage

```go
data, _ := json.Marshal(state)
acks, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{
    {
        Collection:     "game_data",
        Key:            "player_state",
        UserID:         userID,
        Value:          string(data),
        PermissionRead: runtime.STORAGE_PERMISSION_OWNER_READ,
        PermissionWrite: runtime.STORAGE_PERMISSION_OWNER_WRITE,
    },
})
```

### 发送通知

```go
err := nk.NotificationSend(ctx, targetUserID, "New Message", `{"type":"gift"}`, 1001, senderID, true)
```

### 更新钱包

```go
result, err := nk.WalletUpdate(ctx, userID, map[string]int64{
    "coins": 100,
    "gems":  -10,
}, map[string]interface{}{
    "reason": "purchase",
    "item":   "gold_pack",
}, true)
```
