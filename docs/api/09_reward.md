# 奖励模块 API

## 52. lobbyrewards/getall - 获取大厅奖励

**请求**

```
POST /lobbyrewards/getall
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "data": {
    "lottery": {...},
    "checkin": {...},
    "tasks": [...]
  }
}
```

---

## 53. lobbyrewards/dolottery - 转动大转盘

**请求**

```
POST /lobbyrewards/dolottery
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "data": {
    "reward": {...}
  }
}
```

---

## 54. lobbyrewards/gainaction - 领取奖励

**请求**

```
POST /lobbyrewards/gainaction
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| actionID | string | 是 | 奖励ID |

**响应**

```json
{
  "code": 0
}
```

---

## 55. lobbyrewards/checkin - 签到

**请求**

```
POST /lobbyrewards/checkin
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "data": {
    "reward": {...}
  }
}
```
