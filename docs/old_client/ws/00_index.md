# WebSocket 协议索引

## 连接流程

```
1. 客户端调用登录 API 获取 AK
2. 客户端连接 WebSocket
3. 客户端发送 SRS_Login 消息
4. 服务端验证 AK 并响应
5. 开始实时通信
```

## 连接地址

```
wss://{host}/ws
```

---

## 消息格式

### 客户端发送

```json
{
  "m": "消息名称",
  "d": "JSON字符串"
}
```

### 服务端推送

```json
{
  "msgName": "消息名称",
  "data": { ... }
}
```

或压缩格式：

```json
{
  "msgName": "消息名称",
  "gdata": "base64编码的gzip压缩数据"
}
```

---

## 消息名称前缀规范

| 前缀 | 说明 |
|------|------|
| SRS_ | 服务器路由消息 (Server Router Service) |
| GSC_ | 游戏服务器消息 (Game Server Client) |
| SSH | 简单心跳 |

---

## 模块文档

| 模块 | 文档 | 说明 |
|------|------|------|
| 连接模块 | [01_connection.md](./01_connection.md) | 连接、心跳、登录、DCN订阅 |
| 大厅模块 | [02_lobby.md](./02_lobby.md) | 房间进入、分组系统、俱乐部订阅 |
| 德州扑克 | [03_texas.md](./03_texas.md) | 德州扑克游戏消息 |
| 比赛模块 | [04_match.md](./04_match.md) | 比赛相关消息 |
| 用户模块 | [05_user.md](./05_user.md) | 用户状态同步 |

---

## 消息汇总

### 连接层消息

| 消息名称 | 方向 | 说明 |
|----------|------|------|
| SSH | C→S | 简单心跳 |
| SRS_Heart | C→S↔S→C | 完整心跳 |
| SRS_Login | C→S↔S→C | 登录验证 |
| SRS_NT_Error | S→C | 错误通知 |
| SRS_Failed_IfCall | S→C | 接口调用失败 |
| SRS_DCN_Listen | C→S | 订阅数据变更 |
| SRS_DCN_UnListen | C→S | 取消订阅 |
| SRS_DCN_UnListenAll | C→S | 取消所有订阅 |
| SRS_DCN_Changed | S→C | 数据变更通知 |

### 大厅层消息

| 消息名称 | 方向 | 说明 |
|----------|------|------|
| SRS_EnterRoom | C→S↔S→C | 进入房间 |
| SRS_Group_Enter | C→S↔S→C | 进入分组 |
| SRS_Group_Exit | C→S↔S→C | 退出分组 |

### 游戏服务器消息 (GSUserMsg)

| 消息名称 | 方向 | 说明 |
|----------|------|------|
| GSC_ReadyToEnter | C→S | 准备进入房间 |
| GSC_RoomInfo | S→C | 房间信息 |
| GSC_RoundStart | S→C | 回合开始 |
| GSC_RoundEnd | S→C | 回合结束 |
| GSC_UserEnter | S→C | 用户进入 |
| GSC_UserExit | S→C/C→S | 用户退出 |
| GSC_UserSitdown | S→C | 用户坐下 |
| GSC_UserStandUp | S→C | 用户站起 |
| GSC_UserOnline | S→C | 用户在线状态 |
| GSC_UserTuoGuan | S→C | 用户托管状态 |
| GSC_Ready | C→S↔S→C | 准备/取消准备 |
| GSC_GameStart | S→C | 游戏开始 |
| GSC_GameEnd | S→C | 游戏结束 |
| GSC_GameSync | S→C | 游戏状态同步 |
| GSC_ScoreChange | S→C | 分数变化 |
| GSC_Jiesan | S→C | 解散通知 |
| GSC_Fupan_Start | S→C | 复盘开始 |
| GSC_Fupan_End | S→C | 复盘结束 |
| GSC_Error | S→C | 错误通知 |
| GSC_Chat | C→S↔S→C | 聊天消息 |

### 游戏通用消息 (GSCommonMsg)

| 消息名称 | 方向 | 说明 |
|----------|------|------|
| GSC_CM_Bet | C→S↔S→C | 下注 |
| GSC_CM_BetTurn | S→C | 轮到玩家操作 |
| GSC_CM_BetReturn | S→C | 退还下注 |
| GSC_CM_Deal | S→C | 发牌 |
| GSC_CM_Buyin | C→S↔S→C | 买入 |
| GSC_CM_BuyinCancel | S→C | 买入取消 |
| GSC_CM_BuyinOrStand | S→C | 买入或站起提示 |
| GSC_CM_Wait | S→C | 等待通知 |
| GSC_CM_GameResult | S→C | 游戏结果 |

### 比赛消息 (GSMatchUserMsg)

| 消息名称 | 方向 | 说明 |
|----------|------|------|
| GSC_Match_WaitForCombine | S→C | 等待合桌 |
| GSC_Match_CombineFinished | S→C | 合桌完成 |
| GSC_Match_MatchStartEnterRoom | C→S | 比赛开始进入房间 |

---

## DCN 路径汇总

| 路径 | 说明 |
|------|------|
| dcn/user/bag | 用户背包变化 |
| dcn/item/config | 道具配置变化 |
| dcn/user/lobbyreward | 大厅奖励变化 |
| dcn/user/reddot | 红点状态变化 |
| dcn/club/room/{clubID} | 俱乐部房间变化 |
| dcn/club/member/{clubID} | 俱乐部成员变化 |
| dcn/club/account/{clubID} | 俱乐部账户变化 |
| dcn/club/template/{clubID} | 俱乐部模板变化 |
| dcn/club/setting/{clubID} | 俱乐部设置变化 |
| dcn/club/data/{clubID} | 俱乐部数据变化 |
| dcn/match/enterroom | 比赛入场通知 |
| dcn/match/runtime/{matchID}/{userID} | 比赛用户状态变化 |
| dcn/match/event | 比赛事件通知 |
