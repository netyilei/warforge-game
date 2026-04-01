# 登录模块 API

## 1. login/account - 登录

**请求**

```
POST /login/account
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| channel | string | 是 | 登录渠道：Guest/Account/Email/Phone/Wechat |
| channelContent | string | 条件 | 游客登录时必填，游客标识 |
| account | string | 条件 | Account登录时必填，账号 |
| pwdMD5 | string | 条件 | Account登录时必填，密码MD5 |
| nickName | string | 否 | 游客登录时可选，昵称 |
| leaderTag | string | 否 | 推荐码/代理标识 |

**channel 分支处理**

| channel | 处理逻辑 |
|---------|----------|
| Guest | 1. 检查 channelContent 是否存在<br>2. 不存在则创建新用户，昵称为"游客{userID}"<br>3. 存在则返回已有用户数据 |
| Account | 1. 验证 account + pwdMD5<br>2. 验证失败返回错误<br>3. 验证成功返回用户数据 |
| Email | 预留，未实现 |
| Phone | 预留，未实现 |
| Wechat | 预留，未实现 |

**通用处理**

1. 检查用户是否被禁用（disabled），禁用则返回"账号被锁定"
2. 检查在线数量限制，超限则清除旧 AK
3. 生成新 AK（Authorization Key）
4. 如果有 leaderTag，设置推荐关系

**响应**

```json
{
  "code": 0,
  "data": {
    "ak": "xxx",
    "loginData": {
      "userID": 10001,
      "strUserID": "10001",
      "apiID": "10001",
      "countryCode": "86",
      "deviceTag": "string",
      "channelTag": "string",
      "nickName": "玩家1",
      "regTimestamp": 1234567890,
      "regDate": "2024-01-01 00:00:00"
    },
    "roleTarget": {
      "target": 1,
      "roles": []
    },
    "loginChannel": "Account",
    "lobbyHost": "https://xxx",
    "srsHost": "wss://xxx",
    "customerHost": "https://xxx",
    "customerWSHost": "wss://xxx",
    "leaderTag": "xxx",
    "config": { ... }
  }
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| ak | string | 授权令牌，用于后续 API 和 WS 验证 |
| loginData | object | 用户基本信息 |
| loginData.userID | number | 用户ID |
| loginData.strUserID | string | 用户ID字符串 |
| loginData.apiID | string | API标识 |
| loginData.countryCode | string | 国家代码 |
| loginData.deviceTag | string | 设备标识 |
| loginData.channelTag | string | 渠道标识 |
| loginData.nickName | string | 昵称 |
| loginData.regTimestamp | number | 注册时间戳 |
| loginData.regDate | string | 注册日期字符串 |
| roleTarget | object | 角色权限信息 |
| loginChannel | string | 登录渠道 |
| lobbyHost | string | 大厅 API 服务地址 |
| srsHost | string | WebSocket 服务地址 |
| customerHost | string | 客服 HTTP 地址 |
| customerWSHost | string | 客服 WebSocket 地址 |
| leaderTag | string | 当前用户的推荐码 |
| config | object | 全局配置 |

**错误码**

| 错误码 | 说明 |
|--------|------|
| 1 | 参数不正确 / 登录失败 / 账号被锁定 / 网关服务获取失败 |

---

## 2. register - 注册

**请求**

```
POST /register
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 账号 |
| pwdMD5 | string | 是 | 密码MD5 |
| nickName | string | 是 | 昵称 |
| phoneNumber | string | 是 | 手机号 |
| iconUrl | string | 否 | 头像URL |
| tradePWDMD5 | string | 否 | 交易密码MD5 |
| countryCode | string | 是 | 国家代码 |
| verifyCode | string | 是 | 验证码 |
| verifyToken | string | 否 | 验证令牌 |
| deviceTag | string | 是 | 设备标识 |
| channelTag | string | 是 | 渠道标识 |
| leaderTag | string | 否 | 推荐码 |
| uploadToken | string | 否 | 上传令牌 |

**响应**

```json
{
  "code": 0,
  "errCode": 0,
  "errMsg": ""
}
```

---

## 3. sendcode - 发送验证码

**请求**

```
POST /sendcode
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 账号（手机号/邮箱） |
| type | number | 是 | 类型：0=注册，1=修改登录密码，2=修改交易密码 |

**响应**

```json
{
  "code": 0,
  "data": {
    "code": "123456"
  }
}
```

---

## 4. verifycode - 验证验证码

**请求**

```
POST /verifycode
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 账号 |
| verifyCode | string | 是 | 验证码 |

**响应**

```json
{
  "code": 0,
  "data": {
    "token": "xxx"
  }
}
```

---

## 5. changepwd - 修改密码

**请求**

```
POST /changepwd
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 账号 |
| newPwdMD5 | string | 是 | 新密码MD5 |
| verifyCode | string | 是 | 验证码 |

**响应**

```json
{
  "code": 0,
  "errCode": 0,
  "errMsg": ""
}
```

---

## 6. changetradepwd - 修改交易密码

**请求**

```
POST /changetradepwd
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 账号 |
| newPwdMD5 | string | 是 | 新交易密码MD5 |
| verifyCode | string | 是 | 验证码 |

**响应**

```json
{
  "code": 0,
  "errCode": 0,
  "errMsg": ""
}
```
