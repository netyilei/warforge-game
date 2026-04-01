# WS 连接模块

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

## 心跳机制

### 简单心跳 (SSH)

**客户端发送**

```json
{
  "m": "SSH",
  "d": "{}"
}
```

**服务端响应**: 无需响应，保持连接

### 完整心跳 (SRS_Heart)

**客户端发送**

```json
{
  "m": "SRS_Heart",
  "d": "{}"
}
```

**服务端响应**

```json
{
  "msgName": "SRS_Heart",
  "data": {}
}
```

---

## 登录验证

### SRS_Login

**客户端发送**

```json
{
  "m": "SRS_Login",
  "d": "{\"ak\":\"登录令牌\"}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ak | string | 是 | 登录 API 返回的 access token |

**服务端响应**

```json
{
  "msgName": "SRS_Login",
  "data": {
    "success": true,
    "roomID": 12345,
    "roomIDs": [12345, 12346]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 登录是否成功 |
| roomID | number | 当前所在房间ID（如有） |
| roomIDs | number[] | 可重连的房间ID列表 |

---

## 连接状态

| 状态 | 说明 |
|------|------|
| connecting | 连接中 |
| connected | 已连接 |
| disconnected | 已断开 |
| reconnecting | 重连中 |

---

## 错误处理

### SRS_NT_Error

**服务端推送**

```json
{
  "msgName": "SRS_NT_Error",
  "data": {
    "code": 4097,
    "msg": "重复登录"
  }
}
```

### 错误码定义

| 错误码 | 常量名 | 说明 |
|--------|--------|------|
| 0x0001 | SystemError | 系统错误 |
| 0x1001 | LoginTwice | 重复登录 |

---

## SRS_Failed_IfCall

**服务端推送** - 接口调用失败通知

```json
{
  "msgName": "SRS_Failed_IfCall",
  "data": {
    "code": 1,
    "reason": "操作失败原因"
  }
}
```

---

## 数据变更通知 (DCN)

DCN 是一种数据订阅机制，客户端可以订阅特定数据路径，当数据变化时服务端主动推送。

### SRS_DCN_Listen

**客户端发送** - 订阅数据变更

```json
{
  "m": "SRS_DCN_Listen",
  "d": "{\"dkey\":\"dcn/user/bag\"}"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| dkey | string | 数据路径 |

### SRS_DCN_UnListen

**客户端发送** - 取消订阅

```json
{
  "m": "SRS_DCN_UnListen",
  "d": "{\"dkey\":\"dcn/user/bag\"}"
}
```

### SRS_DCN_UnListenAll

**客户端发送** - 取消所有订阅

```json
{
  "m": "SRS_DCN_UnListenAll",
  "d": "{}"
}
```

### SRS_DCN_Changed

**服务端推送** - 数据变更通知

```json
{
  "msgName": "SRS_DCN_Changed",
  "data": {
    "dkey": "dcn/user/bag",
    "data": { ... }
  }
}
```

### DCN 路径列表

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
