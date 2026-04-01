# WS 比赛模块

## 比赛状态

### MatchStatus 枚举

| 值 | 说明 |
|----|------|
| 0 | Signup - 报名中 |
| 1 | Running - 进行中 |
| 2 | Ended - 已结束 |
| 3 | FullyEnded - 完全结束 |

### UserMatchStatus 枚举

| 值 | 说明 |
|----|------|
| 0 | Wait - 等待入场 |
| 1 | Ready - 已准备 |
| 2 | ReadyToPlay - 准备开始 |
| 3 | Playing - 游戏中 |
| 4 | Out - 已出局 |
| 5 | Win - 获胜 |

---

## 比赛消息

### GSC_Match_WaitForCombine

**服务端推送** - 等待合桌

```json
{
  "msgName": "GSC_Match_WaitForCombine",
  "data": {
    "roomID": 12345,
    "force": false
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| roomID | number | 房间ID |
| force | boolean | 是否强制等待 |

### GSC_Match_CombineFinished

**服务端推送** - 合桌完成

```json
{
  "msgName": "GSC_Match_CombineFinished",
  "data": {
    "roomID": 12345
  }
}
```

### GSC_Match_MatchStartEnterRoom

**客户端发送** - 比赛开始进入房间

```json
{
  "m": "GSC_Match_MatchStartEnterRoom",
  "d": "{\"matchID\":100,\"roomID\":12345,\"force\":false}"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 是 | 比赛ID |
| roomID | number | 是 | 房间ID |
| force | boolean | 否 | 是否强制进入 |

---

## DCN 比赛订阅

### dcn/match/enterroom

**推送数据** - 比赛入场通知

```json
{
  "dkey": "dcn/match/enterroom",
  "data": {
    "matchID": 100,
    "roomID": 12345
  }
}
```

### dcn/match/runtime/{matchID}/{userID}

**推送数据** - 比赛用户状态变化

```json
{
  "dkey": "dcn/match/runtime/100/1001",
  "data": {
    "matchID": 100,
    "userID": 1001,
    "status": 3,
    "roomID": 12345
  }
}
```

### dcn/match/event

**推送数据** - 比赛事件通知

```json
{
  "dkey": "dcn/match/event",
  "data": {
    "eventID": 1,
    "userID": 1001,
    "matchID": 100,
    "type": 1,
    "onlyPush": false,
    "roomID": 12345,
    "rankInfo": {
      "userID": 1001,
      "matchID": 100,
      "rank": 1,
      "rewards": [
        { "itemID": "gold", "count": "1000.00" }
      ],
      "score": "5000.00",
      "scoreNum": 5000,
      "timestamp": 1234567890,
      "date": "2024-01-01 12:00:00"
    },
    "timestamp": 1234567890,
    "expireTimestamp": 1234568000
  }
}
```

---

## 比赛事件类型

### UserMatchEventType 枚举

| 值 | 说明 |
|----|------|
| 0 | ReadyStart - 准备开始 |
| 1 | Start - 比赛开始 |
| 50 | Win - 获胜 |
| 51 | Lose - 失败 |
| 100 | Out - 出局 |
| 101 | Out_NotReady - 未准备出局 |
| 102 | Out_EnterFailed - 进入失败出局 |

---

## 数据类型定义

### MatchData

```typescript
type MatchData = {
  matchID: number,
  name: string,
  signup: {
    itemID: string,
    count: string,
  }[],
  gameData: GameData,
  status: MatchStatus,
  changeStatusTimestamp: number,
  buyin?: string,
  combineStartUserCount: number,
  combineMinUserCount: number,
  itemID: string,
  lockItemCount: string,
  maxEnterCount: number,
  signupStartTime: number,
  signupEndTime: number,
  startTime: number,
  duration: number,
}
```

### UserMatchRuntime

```typescript
type UserMatchRuntime = {
  matchID: number,
  userID: number,
  roomID: number,
  signupTime: number,
  enterCount: number,
  scoreOrigin: string,
  scoreChange: string,
  score: string,
  scoreNum: number,
  status: UserMatchStatus,
  robot?: boolean,
  outTimestamp?: number,
  timestamp: number,
  date: string,
}
```

### UserRank

```typescript
type UserRank = {
  userID: number,
  matchID: number,
  rank: number,
  rewards: {
    itemID: string,
    count: string,
  }[],
  score: string,
  scoreNum: number,
  timestamp: number,
  date: string,
}
```

### MatchReward

```typescript
type MatchReward = {
  matchID: number,
  ranks: {
    minRank: number,
    maxRank: number,
    items: {
      itemID: string,
      count: string,
    }[]
  }[]
}
```
