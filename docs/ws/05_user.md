# WS 用户模块

## 用户数据定义

### LoginData

```typescript
type LoginData = {
  userID: number,
  strUserID: string,
  nickName?: string,
  iconUrl?: string,
  sex?: number,
  apiID: string,
  countryCode?: string,
  phoneNumber?: string,
  deviceTag: string,
  channelTag: string,
  regTimestamp: number,
  regDate: string,
}
```

### AccountType 枚举

| 值 | 说明 |
|----|------|
| 1 | Guest - 游客 |
| 2 | Bind - 绑定账号 |
| 3 | Account - 账号 |
| 4 | H5 |
| 5 | WalletH5 |
| 100 | Robot - 机器人 |

### LoginChannel 枚举

| 值 | 说明 |
|----|------|
| 0 | Guest - 游客 |
| 1 | Account - 账号 |
| 2 | Email - 邮箱 |
| 3 | Phone - 手机 |
| 4 | Web3 |
| 100 | Wechat - 微信 |

### LoginTarget 枚举

| 值 | 说明 |
|----|------|
| 0 | App |
| 1 | Console |
| 100 | H5 |
| 101 | WechatMini - 微信小程序 |
| 102 | DouyinMini - 抖音小程序 |

---

## DCN 用户订阅

### dcn/user/bag

**推送数据** - 用户背包变化

背包道具列表变化时推送。

### dcn/user/lobbyreward

**推送数据** - 大厅奖励变化

可领取的大厅奖励变化时推送。

### dcn/user/reddot

**推送数据** - 红点状态变化

```json
{
  "dkey": "dcn/user/reddot",
  "data": {
    "mail": 5
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| mail | number | 未读邮件数量 |

---

## 用户游戏记录

### GameRecord

```typescript
type GameRecord = {
  totalCount?: number,
  win?: number,
  lose?: number,
  draw?: number,
  escape?: number,
  score?: number,
  rank?: number,
}
```

### UserGameRecordData

```typescript
type UserGameRecordData = {
  records: {
    key: string,
    record: GameRecord,
  }[],
}
```

---

## 用户上下级关系

### PromoteRelation

```typescript
type PromoteRelation = {
  userID: number,
  level: number,
  performance?: string,
  leaders: number[],
  subs: number[],
}
```

---

## 用户装备

### EquipType 枚举

| 值 | 说明 |
|----|------|
| 22 | Head - 头像框 |
| 23 | Title - 称号 |
| 24 | Declare - 宣言 |

---

## 用户每日数据

### UserDailyData

```typescript
type UserDailyData = {
  dailyAward: boolean,
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| dailyAward | boolean | 每日奖励是否可领取 |

---

## 用户房间数据

### UserRoomData

```typescript
type UserRoomData = {
  userID: number,
  roomID: number,
}
```

---

## 用户登录渠道

### LoginChannelData

```typescript
type LoginChannelData = {
  userID: number,
  type: LoginChannel,
  account?: string,
  pwdMD5?: string,
  openID?: string,
  unionID?: string,
  wxAppID?: string,
  accessToken?: string,
  address?: string,
  chainID?: number,
}
```

---

## 用户访问令牌

### LoginAccessToken

```typescript
type LoginAccessToken = {
  userID: number,
  type: LoginChannel,
  target: LoginTarget,
  ak: string,
  timestamp: number,
  date: string,
}
```

---

## 用户角色权限

### RoleType

用户角色类型定义。

### LoginRole

```typescript
type LoginRole = {
  userID: number,
  targets: {
    target: LoginTarget,
    roles: RoleType[],
  }[],
}
```

---

## 用户Flag数据

### UserFlagData

```typescript
type UserFlagData = {
  userID: number,
  data: any,
}
```

---

## 用户节点数据

### UserNodeData

```typescript
type UserNodeData = {
  userID: number,
  nodeName: string,
}
```

---

## 绑定信息

### Bind DataType

```typescript
type BindDataType = {
  infos: {
    type: string,
    content: string,
  }[]
}
```

### 绑定类型常量

| 常量 | 值 | 说明 |
|------|-----|------|
| H5Public | origin-h5 | H5公共绑定 |
| H5Account | origin-h5-account | H5账号绑定 |

---

## 用户红点

### UserRedDot

```typescript
type UserRedDot = {
  mail?: number,
}
```
