# 协议映射

> 老客户端协议与 Nakama 协议映射关系
> 
> 创建日期：2026-04-03

## 概述

本文档记录老客户端协议与 Nakama 新协议的映射关系，用于协议翻译层实现。

---

## API 协议映射

### 用户模块

| 老协议 API | Nakama RPC | 说明 |
|------------|------------|------|
| `POST /api/user/login` | `client.AuthenticateDevice` | 设备登录 |
| `POST /api/user/register` | `client.AuthenticateDevice?create=true` | 设备注册 |
| `POST /api/user/info` | `client.GetAccount` | 获取用户信息 |
| `POST /api/user/update` | `client.UpdateAccount` | 更新用户信息 |
| `POST /api/user/bindPhone` | 自定义 RPC | 绑定手机 |
| `POST /api/user/bindEmail` | 自定义 RPC | 绑定邮箱 |

### 俱乐部模块

| 老协议 API | Nakama RPC | 说明 |
|------------|------------|------|
| `POST /api/club/create` | `client.CreateGroup` | 创建俱乐部 |
| `POST /api/club/list` | 自定义 RPC | 俱乐部列表 |
| `POST /api/club/join` | `client.JoinGroup` | 加入俱乐部 |
| `POST /api/club/leave` | `client.LeaveGroup` | 离开俱乐部 |
| `POST /api/club/members` | `client.ListGroupUsers` | 成员列表 |

### 比赛模块

| 老协议 API | Nakama RPC | 说明 |
|------------|------------|------|
| `POST /api/match/list` | 自定义 RPC | 比赛列表 |
| `POST /api/match/signup` | 自定义 RPC | 报名比赛 |
| `POST /api/match/cancel` | 自定义 RPC | 取消报名 |

### 支付模块

| 老协议 API | Nakama RPC | 说明 |
|------------|------------|------|
| `POST /api/pay/create` | 自定义 RPC | 创建订单 |
| `POST /api/pay/notify` | 自定义 RPC | 支付回调 |

---

## WebSocket 协议映射

### 消息格式对比

**老协议格式:**

```json
{
  "m": "GSC_CM_Bet",
  "d": {
    "amount": 100
  }
}
```

**Nakama 格式:**

```json
{
  "op_code": 101,
  "data": {
    "action": "bet",
    "amount": 100
  }
}
```

### OpCode 映射表

#### 德州扑克

| 老协议消息 | OpCode | Nakama 消息 | 说明 |
|------------|--------|-------------|------|
| `GSC_CM_Buyin` | 100 | `BUYIN` | 买入 |
| `GSC_CM_Bet` | 101 | `BET` | 下注 |
| `GSC_CM_Call` | 102 | `CALL` | 跟注 |
| `GSC_CM_Raise` | 103 | `RAISE` | 加注 |
| `GSC_CM_Fold` | 104 | `FOLD` | 弃牌 |
| `GSC_CM_AllIn` | 105 | `ALLIN` | 全押 |
| `GSC_CM_Check` | 106 | `CHECK` | 过牌 |
| `GSC_CM_Ready` | 107 | `READY` | 准备 |
| `GSC_CM_SitDown` | 108 | `SIT` | 坐下 |
| `GSC_CM_StandUp` | 109 | `STAND` | 站起 |
| `GSC_CM_ExitRoom` | 110 | `LEAVE` | 离开房间 |
| `GSC_CM_Chat` | 111 | `CHAT` | 聊天 |
| `GSC_CM_Emoji` | 112 | `EMOJI` | 表情 |

#### 牛牛

| 老协议消息 | OpCode | Nakama 消息 | 说明 |
|------------|--------|-------------|------|
| `GSC_CM_Bet` | 200 | `BET` | 下注 |
| `GSC_CM_ShowCard` | 201 | `SHOW` | 亮牌 |
| `GSC_CM_Ready` | 202 | `READY` | 准备 |

#### 斗地主

| 老协议消息 | OpCode | Nakama 消息 | 说明 |
|------------|--------|-------------|------|
| `GSC_CM_CallLandlord` | 300 | `CALL_LANDLORD` | 叫地主 |
| `GSC_CM_GrabLandlord` | 301 | `GRAB_LANDLORD` | 抢地主 |
| `GSC_CM_PlayCard` | 302 | `PLAY` | 出牌 |
| `GSC_CM_Pass` | 303 | `PASS` | 不出 |

---

## 响应格式映射

### 老协议响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    // 业务数据
  }
}
```

### Nakama 响应格式

```json
{
  "result": {
    // 业务数据
  }
}
```

### 错误响应映射

| 老协议错误码 | Nakama 错误 | 说明 |
|--------------|-------------|------|
| 0 | - | 成功 |
| 1001 | `INVALID_ARGUMENT` | 参数错误 |
| 1002 | `NOT_FOUND` | 资源不存在 |
| 1003 | `ALREADY_EXISTS` | 资源已存在 |
| 1004 | `PERMISSION_DENIED` | 权限不足 |
| 1005 | `UNAUTHENTICATED` | 未认证 |
| 1006 | `INTERNAL` | 服务器错误 |

---

## 协议翻译层实现

### 翻译器接口

```go
type ProtocolAdapter interface {
    TranslateRequest(oldReq *OldRequest) (*NakamaRequest, error)
    TranslateResponse(nakamaResp *NakamaResponse) (*OldResponse, error)
    TranslateWSMessage(oldMsg *OldWSMessage) (*NakamaWSMessage, error)
}
```

### API 翻译器

```go
func (a *APIAdapter) TranslateRequest(oldReq *OldRequest) (*NakamaRequest, error) {
    mapping, ok := apiMapping[oldReq.Path]
    if !ok {
        return nil, ErrUnknownPath
    }
    
    return &NakamaRequest{
        RPC:     mapping.RPC,
        Payload: translatePayload(oldReq.Body, mapping.FieldMapping),
    }, nil
}
```

### WebSocket 翻译器

```go
func (a *WSAdapter) TranslateWSMessage(oldMsg *OldWSMessage) (*NakamaWSMessage, error) {
    opCode, ok := wsMapping[oldMsg.M]
    if !ok {
        return nil, ErrUnknownMessage
    }
    
    return &NakamaWSMessage{
        OpCode: opCode,
        Data:   translateData(oldMsg.D),
    }, nil
}
```

---

## 映射配置文件

```yaml
api_mapping:
  /api/user/login:
    rpc: "user_login"
    field_mapping:
      account: "username"
      password: "password"
      
  /api/club/create:
    rpc: "club_create"
    field_mapping:
      name: "group_name"
      desc: "description"

ws_mapping:
  GSC_CM_Bet:
    op_code: 101
    action: "bet"
  GSC_CM_Call:
    op_code: 102
    action: "call"
```

---

## 迁移策略

### 阶段一: API 迁移

1. 实现协议翻译层
2. 老客户端请求 → 翻译层 → Nakama RPC
3. 验证功能正确性

### 阶段二: WebSocket 迁移

1. 实现 WebSocket 翻译器
2. 老客户端消息 → 翻译器 → Nakama Match
3. 验证游戏逻辑

### 阶段三: 新客户端开发

1. 新客户端直接使用 Nakama 原生协议
2. 无需翻译层
3. 逐步下线老客户端
