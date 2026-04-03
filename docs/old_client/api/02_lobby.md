# 大厅模块 API

## 7. lobby/enter - 进入大厅

**请求**

```
POST /lobby/enter
```

**参数**

无

**处理逻辑**

1. 获取用户未读邮件数量
2. 构建红点数据（reddot）
3. 获取各游戏在线人数（含假数据偏移）
4. 获取用户比赛事件通知

**响应**

```json
{
  "code": 0,
  "data": {
    "reddot": {
      "mail": 5
    }
  },
  "items": "物品配置CSV字符串",
  "banners": [
    {
      "bannerID": 1,
      "imageUrl": "http://xxx",
      "linkUrl": "http://xxx",
      "pri": 1
    }
  ],
  "userCounts": [
    {
      "gameID": 1,
      "count": 1234
    }
  ],
  "matchEvents": []
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.reddot | object | 红点数据 |
| data.reddot.mail | number | 未读邮件数 |
| items | string | 物品配置CSV |
| banners | array | 轮播图列表 |
| userCounts | array | 各游戏在线人数 |
| matchEvents | array | 用户比赛事件通知 |

---

## 8. lobby/getbag - 获取背包

**请求**

```
POST /lobby/getbag
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "bag": {
    "userID": 10001,
    "items": [
      {
        "itemID": 1,
        "count": 100
      }
    ]
  }
}
```

---

## 9. lobby/getgroups - 获取游戏分组

**请求**

```
POST /lobby/getgroups
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| gameID | number | 否 | 游戏ID，筛选指定游戏的分组 |

**响应**

```json
{
  "code": 0,
  "groups": [
    {
      "groupID": 1,
      "gameData": {
        "gameID": 1,
        "gameName": "德州扑克"
      },
      "pri": 1
    }
  ]
}
```

---

## 10. lobby/getitemconfigs - 获取物品配置

**请求**

```
POST /lobby/getitemconfigs
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "items": "物品配置CSV字符串"
}
```

---

## 11. lobby/getnews - 获取新闻列表

**请求**

```
POST /lobby/getnews
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | number | 否 | 新闻类型 |
| page | number | 是 | 页码，从0开始 |
| limit | number | 是 | 每页数量 |

**响应**

```json
{
  "code": 0,
  "count": 100,
  "datas": [
    {
      "newsID": 1,
      "title": "新闻标题",
      "summary": "摘要",
      "imageUrl": "http://xxx",
      "timestamp": 1234567890
    }
  ]
}
```

---

## 12. lobby/getnewsdetail - 获取新闻详情

**请求**

```
POST /lobby/getnewsdetail
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newsID | number | 是 | 新闻ID |

**响应**

```json
{
  "code": 0,
  "data": {
    "newsID": 1,
    "title": "新闻标题",
    "contents": "新闻内容HTML",
    "timestamp": 1234567890
  }
}
```

---

## 13. lobby/getbanners - 获取轮播图

**请求**

```
POST /lobby/getbanners
```

**参数**

无

**响应**

```json
{
  "code": 0,
  "banners": [
    {
      "bannerID": 1,
      "imageUrl": "http://xxx",
      "linkUrl": "http://xxx",
      "pri": 1
    }
  ]
}
```

---

## 14. lobby/createroom - 创建房间

**请求**

```
POST /lobby/createroom
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| gameData | object | 是 | 游戏配置数据 |
| gameData.gameID | number | 是 | 游戏ID |
| gameData.roomName | string | 否 | 房间名称 |
| gameData.maxPlayer | number | 否 | 最大玩家数 |
| gameData.minBuyin | number | 否 | 最小买入 |
| gameData.smallBlind | number | 否 | 小盲注 |
| gameData.bigBlind | number | 否 | 大盲注 |

**处理逻辑**

1. 检查用户是否已在房间中
2. 使用分布式锁防止并发创建
3. 调用房间服务创建房间

**响应**

```json
{
  "code": 0,
  "roomData": {
    "roomID": 12345,
    "boxCode": "ABC123",
    "gameData": { ... }
  }
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | already in room / 无法创建房间 |
| 2 | 创建房间失败 |

---

## 15. lobby/joinroom - 加入房间

**请求**

```
POST /lobby/joinroom
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| boxCode | string | 是 | 房间邀请码 |

**处理逻辑**

1. 根据 boxCode 查找房间
2. 房间不存在则延迟1秒返回错误（防止暴力扫描）
3. 检查用户是否已在房间中

**响应**

```json
{
  "code": 0,
  "roomData": {
    "roomID": 12345,
    "boxCode": "ABC123",
    "gameData": { ... }
  }
}
```

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 房间不存在 |
| 2 | 已经在房间中 |
