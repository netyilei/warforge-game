# 协议映射表

> 本文档定义老协议到 Nakama 协议的映射关系，所有开发必须严格遵循此映射表。

---

## API 协议映射

### 认证模块

| 老 API | 方法 | Nakama RPC | 说明 |
|--------|------|------------|------|
| /api/login/guest | POST | /v2/rpc/auth_guest | 游客登录 |
| /api/login/account | POST | /v2/rpc/auth_account | 账号登录 |
| /api/login/phone | POST | /v2/rpc/auth_phone | 手机登录 |
| /api/login/wechat | POST | /v2/rpc/auth_wechat | 微信登录 |
| /api/login/wallet | POST | /v2/rpc/auth_wallet | 钱包登录 |

### 用户模块

| 老 API | 方法 | Nakama RPC | 说明 |
|--------|------|------------|------|
| /api/user/info | POST | /v2/rpc/user_info | 用户信息 |
| /api/user/update | POST | /v2/rpc/user_update | 更新信息 |
| /api/user/bindPhone | POST | /v2/rpc/user_bind_phone | 绑定手机 |
| /api/user/bindAccount | POST | /v2/rpc/user_bind_account | 绑定账号 |
| /api/user/modifyPwd | POST | /v2/rpc/user_modify_pwd | 修改密码 |
| /api/user/record | POST | /v2/rpc/user_record | 游戏记录 |
| /api/user/goldRecord | POST | /v2/rpc/user_gold_record | 金币记录 |

### 俱乐部模块

| 老 API | 方法 | Nakama RPC | 说明 |
|--------|------|------------|------|
| /api/club/create | POST | /v2/rpc/club_create | 创建俱乐部 |
| /api/club/info | POST | /v2/rpc/club_info | 俱乐部信息 |
| /api/club/list | POST | /v2/rpc/club_list | 俱乐部列表 |
| /api/club/join | POST | /v2/rpc/club_join | 加入俱乐部 |
| /api/club/exit | POST | /v2/rpc/club_exit | 退出俱乐部 |
| /api/club/memberList | POST | /v2/rpc/club_member_list | 成员列表 |
| /api/club/roomList | POST | /v2/rpc/club_room_list | 房间列表 |
| /api/club/templateList | POST | /v2/rpc/club_template_list | 模板列表 |
| /api/club/createRoom | POST | /v2/rpc/club_create_room | 创建房间 |

### 比赛模块

| 老 API | 方法 | Nakama RPC | 说明 |
|--------|------|------------|------|
| /api/match/list | POST | /v2/rpc/match_list | 比赛列表 |
| /api/match/info | POST | /v2/rpc/match_info | 比赛信息 |
| /api/match/signup | POST | /v2/rpc/match_signup | 报名 |
| /api/match/cancel | POST | /v2/rpc/match_cancel | 取消报名 |
| /api/match/rank | POST | /v2/rpc/match_rank | 排名 |

### 充值模块

| 老 API | 方法 | Nakama RPC | 说明 |
|--------|------|------------|------|
| /api/charge/list | POST | /v2/rpc/charge_list | 充值列表 |
| /api/charge/create | POST | /v2/rpc/charge_create | 创建订单 |
| /api/charge/query | POST | /v2/rpc/charge_query | 查询订单 |

### 奖励模块

| 老 API | 方法 | Nakama RPC | 说明 |
|--------|------|------------|------|
| /api/reward/daily | POST | /v2/rpc/reward_daily | 每日奖励 |
| /api/reward/mailList | POST | /v2/rpc/mail_list | 邮件列表 |
| /api/reward/mailRead | POST | /v2/rpc/mail_read | 读取邮件 |
| /api/reward/mailReceive | POST | /v2/rpc/mail_receive | 领取邮件 |

---

## WebSocket 消息映射

### 连接层消息

| 老协议消息 | OpCode | Nakama 对应 | 说明 |
|------------|--------|-------------|------|
| SSH | - | 心跳内置 | 简单心跳 |
| SRS_Heart | - | 心跳内置 | 完整心跳 |
| SRS_Login | - | Session 认证 | 登录验证 |
| SRS_DCN_Listen | - | Storage Watch | 订阅数据 |
| SRS_DCN_UnListen | - | Storage Unwatch | 取消订阅 |
| SRS_DCN_Changed | - | Storage Event | 数据变更 |

### 房间进入消息

| 老协议消息 | OpCode | Nakama 对应 | 说明 |
|------------|--------|-------------|------|
| SRS_EnterRoom | - | Match Create/Join | 进入房间 |
| SRS_Group_Enter | - | Match Create/Join | 进入分组 |
| SRS_Group_Exit | - | Match Leave | 退出分组 |
| GSC_ReadyToEnter | 100 | Match Join | 准备进入 |

### 德州扑克 - 客户端发送

| 老协议消息 | OpCode | 说明 |
|------------|--------|------|
| GSC_Ready | 103 | 准备/取消准备 |
| GSC_UserExit | 110 | 退出房间 |
| GSC_CM_Bet | 101 | 下注 |
| GSC_CM_Buyin | 102 | 买入 |
| GSC_Chat | 104 | 聊天 |

### 德州扑克 - 服务端推送

| 老协议消息 | OpCode | 说明 |
|------------|--------|------|
| GSC_RoomInfo | 201 | 房间信息 |
| GSC_UserEnter | 207 | 用户进入 |
| GSC_UserExit | 208 | 用户退出 |
| GSC_UserOnline | 209 | 在线状态 |
| GSC_UserTuoGuan | 210 | 托管状态 |
| GSC_RoundStart | 211 | 回合开始 |
| GSC_RoundEnd | 212 | 回合结束 |
| GSC_GameStart | 202 | 游戏开始 |
| GSC_GameEnd | 206 | 游戏结束 |
| GSC_GameSync | 213 | 游戏同步 |
| GSC_CM_Deal | 203 | 发牌 |
| GSC_CM_BetTurn | 204 | 轮到操作 |
| GSC_CM_Bet | 214 | 下注通知 |
| GSC_CM_BetReturn | 215 | 退还下注 |
| GSC_CM_Buyin | 216 | 买入响应 |
| GSC_CM_BuyinOrStand | 217 | 买入或站起 |
| GSC_CM_Wait | 218 | 等待通知 |
| GSC_CM_GameResult | 205 | 游戏结果 |
| GSC_ScoreChange | 219 | 分数变化 |
| GSC_Jiesan | 220 | 解散通知 |
| GSC_Error | 299 | 错误通知 |

### 比赛消息

| 老协议消息 | OpCode | 说明 |
|------------|--------|------|
| GSC_Match_WaitForCombine | 301 | 等待合桌 |
| GSC_Match_CombineFinished | 302 | 合桌完成 |
| GSC_Match_MatchStartEnterRoom | 303 | 比赛进入房间 |

---

## 响应格式转换

### 老协议响应格式

```json
{
  "code": 0,
  "msg": "",
  "data": { ... },
  "request_id": "xxx"
}
```

### Nakama RPC 响应格式

```json
{
  "result": { ... }
}
```

### 翻译层转换规则

```
Nakama 成功:
{ result: {...} } → { code: 0, msg: "", data: {...} }

Nakama 错误:
{ error: { code: X, message: "..." } } → { code: X, msg: "...", data: null }
```

---

## 错误码映射

### 通用错误码

| 老错误码 | Nakama 错误 | 说明 |
|----------|-------------|------|
| 0 | - | 成功 |
| 1 | INTERNAL | 系统错误 |
| 2 | INVALID_ARGUMENT | 参数错误 |
| 3 | NOT_FOUND | 未找到 |
| 4 | ALREADY_EXISTS | 已存在 |
| 5 | PERMISSION_DENIED | 无权限 |
| 6 | UNAUTHENTICATED | 未认证 |

### 业务错误码

| 老错误码 | 说明 | Nakama 处理 |
|----------|------|-------------|
| 1001 | 登录失败 | 认证错误 |
| 1002 | 账号已存在 | ALREADY_EXISTS |
| 1003 | 账号不存在 | NOT_FOUND |
| 1004 | 密码错误 | PERMISSION_DENIED |
| 2001 | 金币不足 | 业务逻辑返回 |
| 2002 | 房间已满 | 业务逻辑返回 |
| 2003 | 房间不存在 | NOT_FOUND |

---

## DCN 路径映射

| 老 DCN 路径 | Nakama Storage Watch | 说明 |
|-------------|---------------------|------|
| dcn/user/bag | StorageObject: bag:{user_id} | 背包变化 |
| dcn/user/reddot | StorageObject: reddot:{user_id} | 红点状态 |
| dcn/club/room/{clubID} | StorageObject: club_room:{club_id} | 俱乐部房间 |
| dcn/club/member/{clubID} | StorageObject: club_member:{club_id} | 俱乐部成员 |
| dcn/match/event | Match Event | 比赛事件 |

---

## OpCode 分配规则

| 范围 | 用途 |
|------|------|
| 1-99 | 系统保留 |
| 100-199 | 客户端发送消息 |
| 200-299 | 服务端推送消息 |
| 300-399 | 比赛相关消息 |
| 400-499 | 俱乐部相关消息 |
| 500-599 | 预留扩展 |

---

## 新增游戏 OpCode 规则

每个新游戏使用独立的 OpCode 段：

| 游戏 | 客户端 OpCode | 服务端 OpCode |
|------|---------------|---------------|
| 德州扑克 | 100-149 | 200-249 |
| 牛牛 | 150-199 | 250-299 |
| 斗地主 | 待分配 | 待分配 |
| 麻将 | 待分配 | 待分配 |
