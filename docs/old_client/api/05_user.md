# 用户模块 API

## 25. user/baseinfo/get - 获取用户基本信息

**请求**

```
POST /user/baseinfo/get
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userID | number | 是 | 用户ID |

**响应**

```json
{
  "code": 0,
  "data": {
    "userID": 10001,
    "nickName": "玩家1",
    "sex": 1,
    "iconUrl": "http://xxx"
  }
}
```

---

## 26. user/baseinfos/get - 批量获取用户基本信息

**请求**

```
POST /user/baseinfos/get
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userIDs | array | 是 | 用户ID数组 |

**响应**

```json
{
  "code": 0,
  "data": [
    {
      "userID": 10001,
      "nickName": "玩家1",
      "sex": 1,
      "iconUrl": "http://xxx"
    }
  ]
}
```

---

## 27. user/mail/list - 获取邮件列表

**请求**

```
POST /user/mail/list
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**处理逻辑**

1. 首页（page=0）时刷新系统邮件
2. 查询用户的未删除邮件

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "mailID": "xxx",
      "title": "邮件标题",
      "content": "邮件内容",
      "sendTime": 1234567890,
      "isRead": false,
      "isReceived": false,
      "attachs": []
    }
  ]
}
```

---

## 28. user/mail/read - 阅读邮件

**请求**

```
POST /user/mail/read
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mailID | string | 是 | 邮件ID |

**处理逻辑**

1. 查找邮件并验证归属
2. 标记为已读
3. 更新红点

**响应**

```json
{
  "code": 0,
  "data": {
    "mailID": "xxx",
    "title": "邮件标题",
    "content": "邮件内容",
    "isRead": true
  }
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 邮件不存在 |

---

## 29. user/mail/delete - 删除邮件

**请求**

```
POST /user/mail/delete
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mailID | string | 是 | 邮件ID |

**处理逻辑**

1. 查找邮件并验证归属
2. 标记为已删除
3. 更新红点

**响应**

```json
{
  "code": 0,
  "success": true
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 邮件不存在 |

---

## 30. user/mail/receive - 领取邮件附件

**请求**

```
POST /user/mail/receive
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mailID | string | 是 | 邮件ID |

**处理逻辑**

1. 查找邮件并验证归属
2. 检查是否有附件
3. 检查是否已领取
4. 发放附件物品
5. 标记为已领取

**响应**

```json
{
  "code": 0,
  "items": [
    {
      "id": 1,
      "count": "100"
    }
  ]
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 邮件不存在 / 邮件无附件 / 邮件已领取 |

---

## 31. user/reddot/get - 获取红点数据

**请求**

```
POST /user/reddot/get
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "data": {
    "mail": 5
  }
}
```

---

## 32. user/water/list - 获取流水记录

**请求**

```
POST /user/water/list
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "serialID": "xxx",
      "type": 1,
      "items": [...],
      "timestamp": 1234567890
    }
  ]
}
```

---

## 33. user/playaction/get - 获取玩家行为数据

**请求**

```
POST /user/playaction/get
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userID | number | 否 | 用户ID，不传则使用当前用户 |
| gameID | number | 是 | 游戏ID |

**响应**

```json
{
  "code": 0,
  "data": {
    "userID": 10001,
    "gameID": 1,
    "playCount": 100,
    "winCount": 50
  }
}
```

---

## 34. user/getserial - 获取流水记录（按类型）

**请求**

```
POST /user/getserial
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | number | 否 | 流水类型，单个类型 |
| types | array | 否 | 流水类型数组，多个类型 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "serialID": "xxx",
      "type": 1,
      "items": [...],
      "timestamp": 1234567890
    }
  ]
}
```

---

## 35. user/changeuserinfo - 修改用户信息

**请求**

```
POST /user/changeuserinfo
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 新昵称 |
| iconUrl | string | 否 | 新头像URL |

**处理逻辑**

1. 延迟1秒（防刷）
2. 验证昵称长度（2-15字符）
3. 检查是否需要改名道具
4. 扣除改名道具（如需要）
5. 更新用户信息
6. 重建搜索索引

**响应**

```json
{
  "code": 0,
  "success": true
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 昵称长度过短 / 昵称长度过长 / 改名道具不足 / 用户不存在 |
