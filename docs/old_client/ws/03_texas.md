# WS 德州扑克模块

## 房间生命周期消息

### GSC_ReadyToEnter

**客户端发送** - 准备进入房间（加载完成）

```json
{
  "m": "GSC_ReadyToEnter",
  "d": "{}"
}
```

### GSC_RoomInfo

**服务端推送** - 房间信息

```json
{
  "msgName": "GSC_RoomInfo",
  "data": {
    "roomID": 12345,
    "boxCode": "ABC123",
    "gameData": {
      "gameID": 1,
      "bSets": [],
      "iSets": []
    },
    "club": {
      "clubID": 123,
      "templateID": 1
    },
    "juCount": 1,
    "groupID": 100,
    "matchID": null,
    "bossUserID": 1001,
    "roomType": 2
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| roomID | number | 房间ID |
| boxCode | string | 盒子码 |
| gameData | GameData | 游戏配置 |
| club | object | 俱乐部信息 |
| juCount | number | 当前局数 |
| groupID | number | 分组ID |
| matchID | number | 比赛ID |
| bossUserID | number | 房主ID |
| roomType | number | 房间类型 |

### GSC_RoundStart

**服务端推送** - 回合开始

```json
{
  "msgName": "GSC_RoundStart",
  "data": {
    "data": {}
  }
}
```

### GSC_RoundEnd

**服务端推送** - 回合结束

```json
{
  "msgName": "GSC_RoundEnd",
  "data": {
    "removeType": 0
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| removeType | number | 结束类型 |

**RemoveType 枚举**

| 值 | 说明 |
|----|------|
| 0 | NormalEnd - 正常结束 |
| 1 | Jiesan - 解散 |
| 2 | System - 系统关闭 |
| 3 | Error - 错误 |
| 4 | BossJiesan - 房主解散 |
| 100 | GM - GM操作 |
| 101 | Match - 比赛结束 |
| 102 | MatchForce - 比赛强制结束 |
| 103 | MatchCombine - 比赛合桌 |

---

## 用户消息

### GSC_UserEnter

**服务端推送** - 用户进入

```json
{
  "msgName": "GSC_UserEnter",
  "data": {
    "users": [
      {
        "chairNo": 0,
        "userID": 1001,
        "nickName": "玩家1",
        "iconUrl": "https://...",
        "sex": 1,
        "score": "1000.00",
        "online": true,
        "tuoguan": false
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| chairNo | number | 座位号 (0-7) |
| userID | number | 用户ID |
| nickName | string | 昵称 |
| iconUrl | string | 头像URL |
| sex | number | 性别 |
| score | string | 分数 |
| online | boolean | 是否在线 |
| tuoguan | boolean | 是否托管 |

### GSC_UserExit

**服务端推送** - 用户退出

```json
{
  "msgName": "GSC_UserExit",
  "data": {
    "chairNo": 0
  }
}
```

### GSC_UserSitdown

**服务端推送** - 用户坐下

```json
{
  "msgName": "GSC_UserSitdown",
  "data": {
    "chairNo": 0,
    "toChairNo": 1
  }
}
```

### GSC_UserStandUp

**服务端推送** - 用户站起

```json
{
  "msgName": "GSC_UserStandUp",
  "data": {
    "chairNo": 0,
    "toChairNo": 1
  }
}
```

### GSC_UserOnline

**服务端推送** - 用户在线状态变化

```json
{
  "msgName": "GSC_UserOnline",
  "data": {
    "chairNo": 0,
    "b": true
  }
}
```

### GSC_UserTuoGuan

**服务端推送** - 用户托管状态变化

```json
{
  "msgName": "GSC_UserTuoGuan",
  "data": {
    "chairNo": 0,
    "b": true
  }
}
```

### GSC_UserExit

**客户端发送** - 用户主动退出

```json
{
  "m": "GSC_UserExit",
  "d": "{}"
}
```

---

## 准备与开始

### GSC_Ready

**客户端发送** - 准备/取消准备

```json
{
  "m": "GSC_Ready",
  "d": "{\"b\":true}"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| b | boolean | true=准备, false=取消准备 |

**服务端推送** - 准备状态变化

```json
{
  "msgName": "GSC_Ready",
  "data": {
    "users": [
      { "chairNo": 0, "ready": true },
      { "chairNo": 1, "ready": false }
    ]
  }
}
```

### GSC_GameStart

**服务端推送** - 游戏开始

```json
{
  "msgName": "GSC_GameStart",
  "data": {
    "data": {},
    "juCount": 1,
    "playingChairNos": [0, 1, 2, 3],
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
| data | object | 游戏特定数据 |
| juCount | number | 当前局数 |
| playingChairNos | number[] | 参与游戏的座位号 |
| gameData | GameData | 游戏配置 |

### GSC_GameEnd

**服务端推送** - 游戏结束

```json
{
  "msgName": "GSC_GameEnd",
  "data": {
    "data": {}
  }
}
```

### GSC_GameSync

**服务端推送** - 游戏状态同步（断线重连）

```json
{
  "msgName": "GSC_GameSync",
  "data": {
    "gameStartNT": { ... },
    "roomNT": { ... },
    "users": [ ... ],
    "syncData": {}
  }
}
```

---

## 下注与买入

### GSC_CM_Bet

**客户端发送** - 下注

```json
{
  "m": "GSC_CM_Bet",
  "d": "{\"value\":\"100.00\",\"type\":0}"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| value | string | 下注金额 |
| type | number | 下注类型 |

**服务端推送** - 下注通知

```json
{
  "msgName": "GSC_CM_Bet",
  "data": {
    "bets": [
      {
        "chairNo": 0,
        "value": "100.00",
        "type": 0
      }
    ]
  }
}
```

### GSC_CM_BetTurn

**服务端推送** - 轮到玩家操作

```json
{
  "msgName": "GSC_CM_BetTurn",
  "data": {
    "chairNo": 0,
    "prevValue": "50.00",
    "prevChairNo": 3,
    "maxValue": "100.00",
    "timeoutSec": 15
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| chairNo | number | 当前操作玩家座位号 |
| prevValue | string | 上一位玩家下注额 |
| prevChairNo | number | 上一位玩家座位号 |
| maxValue | string | 最大下注额 |
| timeoutSec | number | 超时秒数 |

### GSC_CM_BetReturn

**服务端推送** - 退还下注

```json
{
  "msgName": "GSC_CM_BetReturn",
  "data": {
    "chairNo": 0,
    "value": "100.00"
  }
}
```

### GSC_CM_Buyin

**客户端发送** - 买入

```json
{
  "m": "GSC_CM_Buyin",
  "d": "{\"score\":\"1000.00\",\"toChairNo\":0}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| score | string | 是 | 买入金额 |
| toChairNo | number | 否 | 买入坐下位置 |

**服务端响应**

```json
{
  "msgName": "GSC_CM_Buyin",
  "data": {
    "b": true
  }
}
```

### GSC_CM_BuyinCancel

**服务端推送** - 买入取消

```json
{
  "msgName": "GSC_CM_BuyinCancel",
  "data": {
    "chairNo": 0
  }
}
```

### GSC_CM_BuyinOrStand

**服务端推送** - 买入或站起提示

```json
{
  "msgName": "GSC_CM_BuyinOrStand",
  "data": {
    "chairNo": 0,
    "minValue": "100.00",
    "maxValue": "1000.00",
    "timeoutSec": 15,
    "minNeed": "50.00"
  }
}
```

---

## 发牌与结果

### GSC_CM_Deal

**服务端推送** - 发牌

```json
{
  "msgName": "GSC_CM_Deal",
  "data": {
    "deals": [
      {
        "type": 0,
        "chairNo": 0,
        "cards": [
          { "suit": 1, "value": 13 },
          { "suit": 2, "value": 1 }
        ]
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| type | number | 发牌类型 (0=手牌, 1=公共牌) |
| chairNo | number | 目标座位号 (手牌时) |
| cards | Card[] | 卡牌数组 |

### GSC_CM_GameResult

**服务端推送** - 游戏结果

```json
{
  "msgName": "GSC_CM_GameResult",
  "data": {
    "users": [
      {
        "chairNo": 0,
        "userID": 1001,
        "scoreChanged": "100.00",
        "score": "1100.00",
        "cards": [
          { "suit": 1, "value": 13 },
          { "suit": 2, "value": 1 }
        ],
        "data": {}
      }
    ],
    "data": {}
  }
}
```

### GSC_ScoreChange

**服务端推送** - 分数变化

```json
{
  "msgName": "GSC_ScoreChange",
  "data": {
    "chairNo": 0,
    "score": "1100.00",
    "scoreChanged": "100.00",
    "type": 0
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| chairNo | number | 座位号 |
| score | string | 当前分数 |
| scoreChanged | string | 变化量 |
| type | number | 变化类型 |

**ScoreChangeType 枚举**

| 值 | 说明 |
|----|------|
| 0 | Game - 游戏输赢 |
| 1 | Charge - 充值 |
| 2 | Fee - 手续费 |

---

## 聊天与互动

### GSC_Chat

**客户端发送** - 发送聊天消息

```json
{
  "m": "GSC_Chat",
  "d": "{\"type\":1,\"text\":\"你好\",\"index\":0,\"toChairNo\":1}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | number | 是 | 聊天类型 |
| text | string | 条件 | 文本内容 (type=Text时) |
| index | number | 条件 | 索引 (快捷语/表情) |
| toChairNo | number | 否 | 目标座位 (互动表情) |

**ChatType 枚举**

| 值 | 说明 |
|----|------|
| 0x01 | Text - 文本 |
| 0x02 | Fast - 快捷语 |
| 0x04 | Emoji - 表情 |
| 0x08 | ToEmoji - 互动表情 |

**服务端推送** - 聊天消息

```json
{
  "msgName": "GSC_Chat",
  "data": {
    "type": 1,
    "fromChairNo": 0,
    "text": "你好",
    "index": 0,
    "toChairNo": 1
  }
}
```

---

## 解散与复盘

### GSC_Jiesan

**服务端推送** - 解散通知

```json
{
  "msgName": "GSC_Jiesan",
  "data": {
    "chairNo": 0,
    "juEnd": false
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| chairNo | number | 发起解散的座位号 |
| juEnd | boolean | 是否本局结束后解散 |

### GSC_Fupan_Start

**服务端推送** - 复盘开始

```json
{
  "msgName": "GSC_Fupan_Start",
  "data": {
    "roomID": 12345,
    "roomInfo": { ... },
    "users": [ ... ],
    "juCount": 1,
    "juEndTime": 1234567890
  }
}
```

### GSC_Fupan_End

**服务端推送** - 复盘结束

```json
{
  "msgName": "GSC_Fupan_End",
  "data": {}
}
```

---

## 错误处理

### GSC_Error

**服务端推送** - 错误通知

```json
{
  "msgName": "GSC_Error",
  "data": {
    "errCode": 1,
    "errMsg": "操作失败",
    "needRestart": false
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| errCode | number | 错误码 |
| errMsg | string | 错误信息 |
| needRestart | boolean | 是否需要重启 |

---

## 等待消息

### GSC_CM_Wait

**服务端推送** - 等待通知

```json
{
  "msgName": "GSC_CM_Wait",
  "data": {
    "users": [
      {
        "chairNo": 0,
        "timeoutSec": 30
      }
    ]
  }
}
```

---

## 数据类型定义

### Card

```typescript
type Card = {
  suit: number,  // 花色
  value: number, // 点数
}
```

### Suit 枚举

| 值 | 说明 |
|----|------|
| 1 | HeiTao - 黑桃 |
| 2 | HongTao - 红桃 |
| 3 | FangPian - 方片 |
| 4 | CaoHua - 草花 |
| 5 | Joker - 王牌 |

### Value 枚举

| 值 | 说明 |
|----|------|
| 1-10 | 1-10 |
| 11 | J |
| 12 | Q |
| 13 | K |
| 14 | SJoker - 小王 |
| 15 | BJoker - 大王 |
