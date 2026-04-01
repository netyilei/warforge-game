# 比赛模块 API

## 16. match/getmatchlist - 获取比赛列表

**请求**

```
POST /match/getmatchlist
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 否 | 比赛ID，筛选指定比赛 |
| status | number | 否 | 比赛状态，单个状态 |
| statuss | array | 否 | 比赛状态数组，多个状态 |
| self | boolean | 否 | 是否只看自己报名的比赛 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "matchDatas": [...],
  "displays": [...],
  "userRuntimes": [...],
  "rewards": [...],
  "userCounts": {
    "101": 50
  },
  "userSignups": [...]
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| count | number | 总数 |
| matchDatas | array | 比赛数据列表 |
| displays | array | 比赛展示数据 |
| userRuntimes | array | 用户比赛运行时数据 |
| rewards | array | 比赛奖励数据 |
| userCounts | object | 各比赛报名人数 {matchID: count} |
| userSignups | array | 用户报名记录 |

---

## 17. match/getmatchfulldisplay - 获取比赛完整信息

**请求**

```
POST /match/getmatchfulldisplay
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 是 | 比赛ID |

**响应**

```json
{
  "code": 0,
  "matchData": { ... },
  "display": { ... },
  "reward": { ... },
  "runtime": { ... },
  "userSignup": { ... }
}
```

---

## 18. match/getmatchrank - 获取比赛排名

**请求**

```
POST /match/getmatchrank
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 是 | 比赛ID |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "rank": 1,
      "userID": 10001,
      "nickName": "玩家1",
      "score": 10000
    }
  ]
}
```

---

## 19. match/getmatchruntimerank - 获取比赛实时排名

**请求**

```
POST /match/getmatchruntimerank
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 是 | 比赛ID |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "userID": 10001,
      "nickName": "玩家1",
      "scoreNum": 10000
    }
  ]
}
```

---

## 20. match/getroom - 获取比赛房间

**请求**

```
POST /match/getroom
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 是 | 比赛ID |

**处理逻辑**

1. 查找用户在该比赛中的房间信息
2. 返回房间数据和实时数据

**响应**

```json
{
  "code": 0,
  "roomData": { ... },
  "roomRealtime": { ... }
}
```

---

## 21. match/signup - 比赛报名

**请求**

```
POST /match/signup
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| matchID | number | 是 | 比赛ID |

**处理逻辑**

1. 检查比赛是否存在
2. 检查比赛状态和时间
3. 检查用户是否已在比赛中
4. 检查用户是否达到最大进入次数
5. 使用分布式锁防止并发报名
6. 扣除报名道具
7. 创建报名记录

**响应**

```json
{
  "code": 0
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 比赛不存在 / 当前时间无法报名 |
| 2 | 比赛已经开始，无法报名 |
| 3 | 您已经在比赛中，无法重新报名 |
| 4 | 您已经达到最大进入次数，无法重新报名 |
| 5 | 无法报名 |
| 6 | 报名道具不足 |
