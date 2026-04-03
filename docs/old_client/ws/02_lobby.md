# WS 大厅模块

## 房间进入

### SRS_EnterRoom

**客户端发送** - 进入房间

```json
{
  "m": "SRS_EnterRoom",
  "d": "{\"roomID\":12345,\"boxCode\":\"ABC123\",\"enterReq\":{}}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 是 | 房间ID |
| boxCode | string | 否 | 盒子码（俱乐部房间） |
| enterReq | object | 否 | 进入请求附加数据 |

**服务端响应**

```json
{
  "msgName": "SRS_EnterRoom",
  "data": {
    "b": true,
    "gameID": 1,
    "reason": null
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| b | boolean | 是否成功 |
| gameID | number | 游戏ID |
| reason | any | 失败原因 |

---

## 分组系统

### SRS_Group_Enter

**客户端发送** - 进入分组

```json
{
  "m": "SRS_Group_Enter",
  "d": "{\"groupID\":100,\"ignoreRoomIDs\":[12345]}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| groupID | number | 是 | 分组ID |
| ignoreRoomIDs | number[] | 否 | 忽略的房间ID列表 |

**服务端响应**

```json
{
  "msgName": "SRS_Group_Enter",
  "data": {
    "b": true,
    "groupID": 100,
    "roomID": 12345,
    "gameData": {
      "gameID": 1,
      "bSets": [],
      "iSets": []
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| b | boolean | 是否成功 |
| groupID | number | 分组ID |
| roomID | number | 分配的房间ID |
| gameData | GameData | 游戏配置数据 |

### SRS_Group_Exit

**客户端发送** - 退出分组

```json
{
  "m": "SRS_Group_Exit",
  "d": "{}"
}
```

**服务端响应**

```json
{
  "msgName": "SRS_Group_Exit",
  "data": {
    "b": true
  }
}
```

---

## DCN 数据订阅

### 俱乐部房间变化

**路径**: `dcn/club/room/{clubID}`

**推送数据**

```json
{
  "dkey": "dcn/club/room/123",
  "data": {
    "roomRealtimes": [
      {
        "roomID": 12345,
        "gameData": { "gameID": 1, "bSets": [], "iSets": [] },
        "boxCode": "ABC123",
        "groupID": 100,
        "clubID": 123,
        "matchID": null,
        "templateID": 1,
        "status": 1,
        "layerName": "TexasGameLayer",
        "nodeName": "TexasGame",
        "gsName": "gs-texas-1",
        "gsTimestamp": 1234567890,
        "roundStartTimestamp": 1234567890,
        "users": [
          { "userID": 1001, "chairNo": 0, "score": "1000.00" }
        ]
      }
    ],
    "removedRoomIDs": [12344]
  }
}
```

### 俱乐部成员变化

**路径**: `dcn/club/member/{clubID}`

**推送数据**

```json
{
  "dkey": "dcn/club/member/123",
  "data": {
    "userIDs": [1001, 1002],
    "removeUserIDs": [1003]
  }
}
```

### 俱乐部账户变化

**路径**: `dcn/club/account/{clubID}`

**推送数据**

```json
{
  "dkey": "dcn/club/account/123",
  "data": {
    "account": {
      "clubID": 123,
      "userID": 1001,
      "values": ["1000.00", "0.00", "0.00", "0.00"]
    }
  }
}
```

### 俱乐部模板变化

**路径**: `dcn/club/template/{clubID}`

**推送数据**

```json
{
  "dkey": "dcn/club/template/123",
  "data": {
    "template": {
      "templateID": 1,
      "clubID": 123,
      "name": "经典场",
      "desc": "德州扑克经典玩法",
      "gameData": { "gameID": 1, "bSets": [], "iSets": [] },
      "userID": 1001,
      "timestamp": 1234567890,
      "date": "2024-01-01 12:00:00"
    },
    "del": false
  }
}
```

### 俱乐部设置变化

**路径**: `dcn/club/setting/{clubID}`

**推送数据**

```json
{
  "dkey": "dcn/club/setting/123",
  "data": {
    "setting": {
      "clubID": 123,
      "autoDesk": true,
      "mode": 0,
      "invite": 257,
      "adminAcceptReq": true,
      "adminCreateTemplate": false,
      "adminCreateRoom": true
    }
  }
}
```

### 俱乐部数据变化

**路径**: `dcn/club/data/{clubID}`

**推送数据**

```json
{
  "dkey": "dcn/club/data/123",
  "data": {
    "clubData": {
      "clubID": 123,
      "code": "ABC123",
      "bossUserID": 1001,
      "name": "我的俱乐部",
      "desc": "欢迎加入",
      "iconUrl": "https://..."
    }
  }
}
```

---

## 用户数据订阅

### 背包变化

**路径**: `dcn/user/bag`

**推送数据**: 用户背包道具列表

### 大厅奖励变化

**路径**: `dcn/user/lobbyreward`

**推送数据**: 可领取的大厅奖励

### 红点状态变化

**路径**: `dcn/user/reddot`

**推送数据**

```json
{
  "dkey": "dcn/user/reddot",
  "data": {
    "mail": 5
  }
}
```

---

## 数据类型定义

### GameData

```typescript
type GameData = {
  gameID: number,    // 游戏ID
  bSets: boolean[],  // 布尔配置
  iSets: number[],   // 数值配置
}
```

### RoomRealtime

```typescript
type RoomRealtime = {
  roomID: number,
  gameData: GameData,
  boxCode?: string,
  groupID?: number,
  clubID?: number,
  matchID?: number,
  templateID?: number,
  status: RoomStatus,
  layerName?: string,
  nodeName?: string,
  gsName?: string,
  gsTimestamp?: number,
  roundStartTimestamp?: number,
  users: UserRealtime[],
}
```

### RoomStatus

| 值 | 说明 |
|----|------|
| 0 | None |
| 1 | Wait - 等待中 |
| 2 | Start - 游戏中 |
| 3 | JuEnd - 局结束 |
| 4 | End - 结束 |

### RoomType

| 值 | 说明 |
|----|------|
| 0 | Custom - 自定义房间 |
| 1 | Group - 分组房间 |
| 2 | Club - 俱乐部房间 |
| 3 | Match - 比赛房间 |
