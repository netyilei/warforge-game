# 客服模块 API

## 48. user/startchat - 开始客服聊天

**请求**

```
POST /user/startchat
```

**参数**

无

**处理逻辑**

1. 使用分布式锁防止并发创建
2. 查找用户是否已有聊天房间
3. 如果没有则创建新房间
4. 根据用户在线状态设置 toStatus

**响应**

```json
{
  "code": 0,
  "room": {
    "roomID": 10001,
    "fromUserID": null,
    "toUserID": 10001,
    "fromStatus": 0,
    "toStatus": 1,
    "lastMsgID": 0,
    "createTimestamp": 1234567890
  }
}
```

---

## 49. user/getrooms - 获取聊天房间列表

**请求**

```
POST /user/getrooms
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**处理逻辑**

查询用户作为发送方或接收方的所有聊天房间

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [...]
}
```

---

## 50. user/getroom - 获取聊天房间

**请求**

```
POST /user/getroom
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 是 | 房间ID |

**处理逻辑**

1. 查找指定房间并验证用户是接收方
2. 如果不存在则延迟3秒返回

**响应**

```json
{
  "code": 0,
  "room": {
    "roomID": 10001,
    "fromUserID": null,
    "toUserID": 10001,
    "fromStatus": 0,
    "toStatus": 1,
    "lastMsgID": 0
  }
}
```

---

## 51. user/getchats - 获取聊天记录

**请求**

```
POST /user/getchats
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomID | number | 是 | 房间ID |
| msgID | number | 否 | 消息ID，用于加载更早的消息 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**处理逻辑**

1. 验证用户是否属于该房间
2. 如果有 msgID 则查询该消息之前的记录
3. 按消息ID倒序返回

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "msgID": 1,
      "roomID": 10001,
      "fromUserID": 10001,
      "toUserID": 10002,
      "content": "你好",
      "timestamp": 1234567890
    }
  ]
}
```
