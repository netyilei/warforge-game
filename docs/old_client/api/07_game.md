# 游戏模块 API

## 43. game/getgamesteprecord - 获取游戏步骤记录

**请求**

```
POST /game/getgamesteprecord
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 是 | 房间ID |
| page | number | 否 | 页码，从0开始 |
| limit | number | 否 | 每页数量 |

**处理逻辑**

1. 如果有分页参数，从数据库查询历史记录
2. 从Redis获取当前局记录
3. 如果是首页（page=0），将当前局插入到列表开头

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "roomID": 12345,
      "juCount": 1,
      "records": [...]
    }
  ]
}
```

---

## 44. game/getfupan - 获取复盘数据

**请求**

```
POST /game/getfupan
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 是 | 房间ID |
| juCount | number | 是 | 局数 |

**处理逻辑**

1. 从数据库查询复盘记录
2. 如果不存在则延迟1秒返回

**响应**

```json
{
  "code": 0,
  "data": {
    "roomID": 12345,
    "juCount": 1,
    "actions": [...],
    "cards": [...]
  }
}
```

---

## 45. game/getgameuserscores - 获取游戏用户分数

**请求**

```
POST /game/getgameuserscores
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 是 | 房间ID |

**处理逻辑**

从Redis获取房间用户分数列表

**响应**

```json
{
  "code": 0,
  "datas": [
    {
      "userID": 10001,
      "nickName": "玩家1",
      "score": 1000
    }
  ]
}
```

---

## 46. game/getbills - 获取账单列表

**请求**

```
POST /game/getbills
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 否 | 房间ID，不传则查询当前用户的账单 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**处理逻辑**

- 有roomID：查询指定房间的账单
- 无roomID：查询当前用户参与的账单

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "billID": 1,
      "roomID": 12345,
      "users": [...],
      "timestamp": 1234567890
    }
  ]
}
```

---

## 47. game/getfinalbills - 获取结算账单列表

**请求**

```
POST /game/getfinalbills
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 否 | 房间ID |
| userID | number | 否 | 用户ID，不传则使用当前用户 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**处理逻辑**

查询指定用户在指定房间（可选）的结算账单

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "billID": 1,
      "roomID": 12345,
      "users": [...],
      "timestamp": 1234567890
    }
  ]
}
```
