# 旧代码索引文档

> 本文档用于 AI 快速定位旧代码功能实现，便于新项目参考和迁移。

---

## 目录结构概览

```
old-code/
├── servers/           # 服务端代码 (TypeScript)
│   ├── pp-base-define/    # 核心类型定义
│   ├── pp-account/        # 账户服务
│   ├── pp-chain/          # 区块链/支付服务
│   ├── pp-chat-service/   # 聊天服务
│   ├── pp-club/           # 俱乐部服务
│   ├── pp-game-base/      # 游戏基础框架
│   ├── pp-game-texas/     # 德州扑克游戏
│   ├── pp-group/          # 群组/匹配服务
│   ├── pp-login/          # 登录服务
│   ├── pp-match-logic/    # 比赛逻辑
│   ├── pp-oss-control/    # OSS 存储
│   ├── pp-robot-env/      # 机器人环境
│   ├── pp-robot-logic/    # 机器人逻辑
│   ├── pp-room/           # 房间服务
│   ├── pp-rpc-center/     # RPC 中心
│   ├── pp-rpc-gm/         # GM 管理后台
│   ├── pp-srs-dispatcher/ # SRS 调度器
│   ├── pp-srs-layer/      # SRS 层
│   ├── pp-srs-node/       # SRS 节点
│   ├── pp-sys/            # 系统服务
│   ├── pp-user-looper/    # 用户循环器
│   ├── pp-user-service/   # 用户服务
│   └── src/               # 共享工具库
├── web-admin/         # 管理后台前端
└── configs/           # 配置文件
```

---

## 核心定义模块 (pp-base-define)

### 用户相关

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [UserDefine.ts](../old-code/servers/pp-base-define/UserDefine.ts) | 用户定义 | `tLoginData`, `LoginChannel`, `LoginTarget`, `RoleType`, `PromoteRelation` |
| [UserFlag.ts](../old-code/servers/pp-base-define/UserFlag.ts) | 用户标志位 | 用户状态标志 |

### 游戏相关

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [GameIDDefine.ts](../old-code/servers/pp-base-define/GameIDDefine.ts) | 游戏 ID 枚举 | `GameID.Texas = 101` |
| [RoomDefine.ts](../old-code/servers/pp-base-define/RoomDefine.ts) | 房间定义 | `RoomData`, `RoomType`, `RoomStatus`, `GameData`, `BillData` |
| [MatchDefine.ts](../old-code/servers/pp-base-define/MatchDefine.ts) | 比赛定义 | `tData`, `MatchStatus`, `tUserRuntime`, `tUserRank` |
| [PokerDefine.ts](../old-code/servers/pp-base-define/PokerDefine.ts) | 扑克牌定义 | 牌型、牌值 |

### 俱乐部相关

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [ClubDefine.ts](../old-code/servers/pp-base-define/ClubDefine.ts) | 俱乐部定义 | `tData`, `tSetting`, `tUserMember`, `tRoomTemplate`, `MemberType` |

### 道具与奖励

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [ItemDefine.ts](../old-code/servers/pp-base-define/ItemDefine.ts) | 道具定义 | `tItem`, `tBag`, `tLock`, `SerialType`, `ItemID` |
| [RewardDefine.ts](../old-code/servers/pp-base-define/RewardDefine.ts) | 奖励定义 | `tPlan`, `tPot`, `tCharge`, `GameActionType` |

### 机器人相关

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [RobotDefine.ts](../old-code/servers/pp-base-define/RobotDefine.ts) | 机器人定义 | `tRuntime`, `RuntimeStrategy`, `Personality`, `tRobotStrategy` |

### 通信协议

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [GSRpcMethods.ts](../old-code/servers/pp-base-define/GSRpcMethods.ts) | GS RPC 方法 | `createRoom`, `userEnter`, `userMessage`, `matchControl` |
| [GSUserMsg.ts](../old-code/servers/pp-base-define/GSUserMsg.ts) | GS 用户消息 | `GameStart`, `GameEnd`, `ScoreChange`, `Chat` |
| [SrsDefine.ts](../old-code/servers/pp-base-define/SrsDefine.ts) | SRS 定义 | `NodeType`, `LayerOtherConfig`, `NodeOtherConfig` |
| [SrsUserMsg.ts](../old-code/servers/pp-base-define/SrsUserMsg.ts) | SRS 用户消息 | 连接、认证消息 |

### 其他定义

| 文件 | 功能 | 关键类型 |
|------|------|----------|
| [DBDefine.ts](../old-code/servers/pp-base-define/DBDefine.ts) | 数据库表定义 | 表名常量 |
| [KVDefine.ts](../old-code/servers/pp-base-define/KVDefine.ts) | KV 存储定义 | Redis 键定义 |
| [MQDefine.ts](../old-code/servers/pp-base-define/MQDefine.ts) | 消息队列定义 | 队列名称 |
| [MailDefine.ts](../old-code/servers/pp-base-define/MailDefine.ts) | 邮件定义 | `tMail` |
| [NewsDefine.ts](../old-code/servers/pp-base-define/NewsDefine.ts) | 新闻定义 | `tNews` |
| [GroupDefine.ts](../old-code/servers/pp-base-define/GroupDefine.ts) | 群组定义 | `tGroup` |
| [LeaderDefine.ts](../old-code/servers/pp-base-define/LeaderDefine.ts) | 代理定义 | `tLeader` |

---

## 服务模块详解

### 1. 登录服务 (pp-login)

**路径**: `servers/pp-login/`

**功能**:

- 用户登录/注册
- 游客登录、账号登录、邮箱登录、手机登录
- Web3 钱包登录
- 微信小程序登录

**关键文件**:

| 文件 | 功能 |
|------|------|
| [service/login.ts](../old-code/servers/pp-login/service/login.ts) | 登录核心逻辑 |
| [service/register.ts](../old-code/servers/pp-login/service/register.ts) | 注册逻辑 |
| [service/fastLogin.ts](../old-code/servers/pp-login/service/fastLogin.ts) | 快速登录 |
| [service/upload.ts](../old-code/servers/pp-login/service/upload.ts) | 上传服务 |
| [rpc/loginRpcEntity.ts](../old-code/servers/pp-login/rpc/loginRpcEntity.ts) | RPC 实体 |

---

### 2. 账户服务 (pp-account)

**路径**: `servers/pp-account/`

**功能**:

- 道具背包管理
- 道具增删改查
- 道具锁定/解锁
- 流水记录

**关键文件**:

| 文件 | 功能 |
|------|------|
| [rpc/account.ts](../old-code/servers/pp-account/rpc/account.ts) | 账户 RPC 接口 |
| [rpc/itemConfig.ts](../old-code/servers/pp-account/rpc/itemConfig.ts) | 道具配置 |

**核心方法** (`RpcAccountItem`):

- `add` - 增加道具
- `use` - 使用道具
- `set` - 设置道具数量
- `getBag` - 获取背包
- `lockItem` - 锁定道具
- `unlockUser` - 解锁用户道具
- `check` - 检查道具是否足够

---

### 3. 俱乐部服务 (pp-club)

**路径**: `servers/pp-club/`

**功能**:

- 俱乐部创建/管理
- 成员管理
- 房间模板
- 账户系统
- 账单系统

**关键文件**:

| 文件 | 功能 |
|------|------|
| [rpc/club_data.ts](../old-code/servers/pp-club/rpc/club_data.ts) | 俱乐部数据管理 |
| [rpc/club_member.ts](../old-code/servers/pp-club/rpc/club_member.ts) | 成员管理 |
| [rpc/club_account.ts](../old-code/servers/pp-club/rpc/club_account.ts) | 俱乐部账户 |
| [rpc/club_bill.ts](../old-code/servers/pp-club/rpc/club_bill.ts) | 账单管理 |
| [rpc/club_realtime.ts](../old-code/servers/pp-club/rpc/club_realtime.ts) | 实时数据 |
| [Utils/ClubMember.ts](../old-code/servers/pp-club/Utils/ClubMember.ts) | 成员工具类 |
| [Utils/ClubDCN.ts](../old-code/servers/pp-club/Utils/ClubDCN.ts) | DCN 推送 |

---

### 4. 德州扑克游戏 (pp-game-texas)

**路径**: `servers/pp-game-texas/`

**功能**:

- 德州扑克游戏逻辑
- 牌型计算
- 下注逻辑
- 奖池管理

**关键文件**:

| 文件 | 功能 |
|------|------|
| [TexasDefine.ts](../old-code/servers/pp-game-texas/TexasDefine.ts) | 德州定义 |
| [TexasRoom.ts](../old-code/servers/pp-game-texas/TexasRoom.ts) | 房间逻辑 |
| [TexasPool.ts](../old-code/servers/pp-game-texas/TexasPool.ts) | 奖池逻辑 |
| [TexasPower.ts](../old-code/servers/pp-game-texas/TexasPower.ts) | 牌力计算 |
| [TexasRealtime.ts](../old-code/servers/pp-game-texas/TexasRealtime.ts) | 实时数据 |

**德州扑克关键类型**:

- `BetType` - 下注类型 (弃牌/过牌/下注/跟注/加注/全押)
- `DealType` - 发牌阶段 (底牌/翻牌/转牌/河牌)
- `CardType` - 牌型 (高牌/一对/两对/三条/顺子/同花/葫芦/四条/同花顺)
- `TexasGamePhase` - 游戏阶段

---

### 5. 比赛逻辑 (pp-match-logic)

**路径**: `servers/pp-match-logic/`

**功能**:

- 比赛创建/管理
- 报名系统
- 排名系统
- 奖励发放
- 合桌逻辑

**比赛状态流转**:

```
Signup → Running → Ended → FullyEnded
```

**用户比赛状态**:

```
Wait → Ready → ReadyToPlay → Playing → Out/Win
```

---

### 6. 机器人系统 (pp-robot-logic / pp-robot-env)

**路径**:

- `servers/pp-robot-logic/` - 机器人逻辑
- `servers/pp-robot-env/` - 机器人环境

**功能**:

- 机器人 AI 逻辑
- 行为树决策
- 策略执行
- 库存管理

**机器人策略**:

- `Normal` - 普通策略
- `Kill` - 杀分策略
- `Bonus` - 送分策略
- `Target` - 针对目标策略

**机器人性格**:

- `Level0` - 一般性格
- `Level1` - 中等性格
- `Level2` - 激进性格
- `Level3` - 非常暴躁

---

### 7. 区块链/支付服务 (pp-chain)

**路径**: `servers/pp-chain/`

**功能**:

- 充值地址生成
- 提现处理
- 区块链交互
- PayPal 支付

**关键文件**:

| 文件 | 功能 |
|------|------|
| [rpc/chain.ts](../old-code/servers/pp-chain/rpc/chain.ts) | 区块链 RPC |
| [rpc/paypal.ts](../old-code/servers/pp-chain/rpc/paypal.ts) | PayPal 支付 |

---

### 8. GM 管理后台 (pp-rpc-gm)

**路径**: `servers/pp-rpc-gm/`

**功能**:

- GM 登录认证
- 用户管理
- 充值管理
- 比赛管理
- 机器人管理
- 配置管理

**关键文件**:

| 文件 | 功能 |
|------|------|
| [service/GMService.ts](../old-code/servers/pp-rpc-gm/service/GMService.ts) | GM 服务 |
| [service/GMUser.ts](../old-code/servers/pp-rpc-gm/service/GMUser.ts) | 用户管理 |
| [service/GMCharge.ts](../old-code/servers/pp-rpc-gm/service/GMCharge.ts) | 充值管理 |
| [service/GMMatch.ts](../old-code/servers/pp-rpc-gm/service/GMMatch.ts) | 比赛管理 |
| [service/GMRobot.ts](../old-code/servers/pp-rpc-gm/service/GMRobot.ts) | 机器人管理 |

---

### 9. 房间服务 (pp-room)

**路径**: `servers/pp-room/`

**功能**:

- 房间创建/销毁
- 房间匹配
- 房间状态管理

---

### 10. 群组/匹配服务 (pp-group)

**路径**: `servers/pp-group/`

**功能**:

- 匹配组管理
- 匹配逻辑
- 抽水配置

---

### 11. SRS 系统 (pp-srs-*)

**路径**:

- `servers/pp-srs-dispatcher/` - 调度器
- `servers/pp-srs-layer/` - 层服务
- `servers/pp-srs-node/` - 节点服务

**功能**:

- WebSocket 连接管理
- 消息路由
- 负载均衡
- 用户/设备节点映射

**节点类型**:

- `Layer` - 层节点
- `Device` - 设备节点
- `User` - 用户节点
- `GameServer` - 游戏服务器节点

---

### 12. 系统服务 (pp-sys)

**路径**: `servers/pp-sys/`

**功能**:

- ID 生成
- KV 存储
- 邮件系统
- 验证码
- 互斥锁

**关键文件**:

| 文件 | 功能 |
|------|------|
| [rpc/ids.ts](../old-code/servers/pp-sys/rpc/ids.ts) | ID 生成服务 |
| [rpc/kv.ts](../old-code/servers/pp-sys/rpc/kv.ts) | KV 存储服务 |
| [rpc/mail.ts](../old-code/servers/pp-sys/rpc/mail.ts) | 邮件服务 |
| [rpc/mutex.ts](../old-code/servers/pp-sys/rpc/mutex.ts) | 互斥锁服务 |

---

### 13. 聊天服务 (pp-chat-service)

**路径**: `servers/pp-chat-service/`

**功能**:

- 客服聊天
- 用户聊天

---

### 14. OSS 存储服务 (pp-oss-control)

**路径**: `servers/pp-oss-control/`

**功能**:

- 文件上传
- 图标管理
- 序列号管理

---

## 共享工具库 (src)

**路径**: `servers/src/`

| 文件 | 功能 |
|------|------|
| [db.ts](../old-code/servers/src/db.ts) | 数据库操作封装 |
| [IDUtils.ts](../old-code/servers/src/IDUtils.ts) | ID 生成工具 |
| [UserUtils.ts](../old-code/servers/src/UserUtils.ts) | 用户工具 |
| [RobotUtils.ts](../old-code/servers/src/RobotUtils.ts) | 机器人工具 |
| [RedisLock.ts](../old-code/servers/src/RedisLock.ts) | Redis 分布式锁 |
| [SerialHelper.ts](../old-code/servers/src/SerialHelper.ts) | 流水号生成 |
| [TimeDate.ts](../old-code/servers/src/TimeDate.ts) | 时间日期工具 |
| [knRpcTools.ts](../old-code/servers/src/knRpcTools.ts) | RPC 工具 |
| [knSRSTools.ts](../old-code/servers/src/knSRSTools.ts) | SRS 工具 |
| [ChainApi.ts](../old-code/servers/src/ChainApi.ts) | 区块链 API |
| [GlobalUtils.ts](../old-code/servers/src/GlobalUtils.ts) | 全局工具 |
| [MutexTools.ts](../old-code/servers/src/MutexTools.ts) | 互斥工具 |
| [MailUtils.ts](../old-code/servers/src/MailUtils.ts) | 邮件工具 |

---

## 关键业务流程

### 1. 用户登录流程

```
客户端 → pp-login → 验证账号 → 创建/获取用户 → 生成 AK → 返回用户信息
```

### 2. 创建房间流程

```
客户端 → pp-room → 分配 GS → GSRpcMethods.createRoom → 创建房间 → 返回房间信息
```

### 3. 游戏流程

```
进入房间 → GSC_UserEnter → 准备 → GSC_Ready → 开始游戏 → GSC_GameStart 
→ 游戏进行 → GSC_GameEnd → 结算 → GSC_RoundResult
```

### 4. 比赛流程

```
报名 → MatchSignup → 等待开始 → Ready → 入场 → Playing → 出局/获胜 → 奖励发放
```

### 5. 充值流程

```
获取充值地址 → 用户转账 → 回调确认 → 增加道具 → 推送通知
```

---

## 数据库表名参考

主要表名定义在 `DBDefine.ts`:

- `t_user_login_data` - 用户登录数据
- `t_user_login_channel` - 登录渠道
- `t_user_login_access_token` - 访问令牌
- `t_user_bag` - 用户背包
- `t_user_bag_lock` - 道具锁定
- `t_club_data` - 俱乐部数据
- `t_club_setting` - 俱乐部设置
- `t_club_user_member` - 俱乐部成员
- `t_club_user_account` - 俱乐部账户
- `t_club_room_template` - 房间模板
- `t_match_data` - 比赛数据
- `t_match_user_runtime` - 比赛用户运行时
- `t_match_user_rank` - 比赛排名
- `t_room_data` - 房间数据
- `t_room_realtime` - 房间实时数据
- `t_bill` - 账单
- `t_item_serial` - 道具流水
- `t_withdraw_order` - 提现订单
- `t_charge_chain_info` - 充值链信息

---

## RPC 方法快速索引

### GS RPC (GSRpcMethods)

| 方法 | 功能 |
|------|------|
| `createRoom` | 创建房间 |
| `jiesanRoom` | 解散房间 |
| `userEnter` | 用户进入 |
| `userExit` | 用户退出 |
| `userOnline` | 用户上线 |
| `userOffline` | 用户下线 |
| `userMessage` | 用户消息 |
| `roomMessage` | 房间消息 |
| `matchControl` | 比赛控制 |

### 账户 RPC (RpcAccountItem)

| 方法 | 功能 |
|------|------|
| `add` | 增加道具 |
| `use` | 使用道具 |
| `set` | 设置道具 |
| `getBag` | 获取背包 |
| `lockItem` | 锁定道具 |
| `unlockUser` | 解锁道具 |

---

## 注意事项

1. **技术栈**: 旧代码使用 TypeScript + kdweb-core 框架
2. **数据库**: MongoDB + Redis
3. **通信**: 自研 RPC 框架 + WebSocket
4. **新项目差异**: 新项目使用 Go (Gin+GORM) + Nakama，需要适配转换
