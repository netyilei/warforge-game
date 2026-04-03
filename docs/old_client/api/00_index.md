# HTTP API 协议索引

## 通用规范

### 请求格式

```
POST /api/{module}/{action}
Content-Type: application/json

{
  "param1": "value1",
  "param2": "value2"
}
```

### 响应格式

```json
{
  "code": 0,
  "msg": "",
  "data": { ... }
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1 | 通用错误 |
| 2 | 参数错误 |
| 3 | 未登录 |
| 4 | 权限不足 |
| 5 | 服务器错误 |

---

## 模块文档

| 模块 | 文档 | API数量 |
|------|------|---------|
| 登录模块 | [01_login.md](./01_login.md) | 6 |
| 大厅模块 | [02_lobby.md](./02_lobby.md) | 9 |
| 比赛模块 | [03_match.md](./03_match.md) | 6 |
| 上传模块 | [04_upload.md](./04_upload.md) | 3 |
| 用户模块 | [05_user.md](./05_user.md) | 11 |
| 充值模块 | [06_charge.md](./06_charge.md) | 7 |
| 游戏模块 | [07_game.md](./07_game.md) | 5 |
| 客服模块 | [08_customer.md](./08_customer.md) | 4 |
| 奖励模块 | [09_reward.md](./09_reward.md) | 4 |

**总计：55 个 API**

---

## API 总览

| 序号 | 接口 | 说明 | 模块 |
|------|------|------|------|
| 1 | login/account | 登录 | 登录 |
| 2 | register | 注册 | 登录 |
| 3 | sendcode | 发送验证码 | 登录 |
| 4 | verifycode | 验证验证码 | 登录 |
| 5 | changepwd | 修改密码 | 登录 |
| 6 | changetradepwd | 修改交易密码 | 登录 |
| 7 | lobby/enter | 进入大厅 | 大厅 |
| 8 | lobby/getbag | 获取背包 | 大厅 |
| 9 | lobby/getgroups | 获取游戏分组 | 大厅 |
| 10 | lobby/getitemconfigs | 获取物品配置 | 大厅 |
| 11 | lobby/getnews | 获取新闻列表 | 大厅 |
| 12 | lobby/getnewsdetail | 获取新闻详情 | 大厅 |
| 13 | lobby/getbanners | 获取轮播图 | 大厅 |
| 14 | lobby/createroom | 创建房间 | 大厅 |
| 15 | lobby/joinroom | 加入房间 | 大厅 |
| 16 | match/getmatchlist | 获取比赛列表 | 比赛 |
| 17 | match/getmatchfulldisplay | 获取比赛完整信息 | 比赛 |
| 18 | match/getmatchrank | 获取比赛排名 | 比赛 |
| 19 | match/getmatchruntimerank | 获取比赛实时排名 | 比赛 |
| 20 | match/getroom | 获取比赛房间 | 比赛 |
| 21 | match/signup | 比赛报名 | 比赛 |
| 22 | upload/start | 开始上传 | 上传 |
| 23 | upload/upload | 上传数据块 | 上传 |
| 24 | upload/end | 结束上传 | 上传 |
| 25 | user/baseinfo/get | 获取用户基本信息 | 用户 |
| 26 | user/baseinfos/get | 批量获取用户基本信息 | 用户 |
| 27 | user/mail/list | 获取邮件列表 | 用户 |
| 28 | user/mail/read | 阅读邮件 | 用户 |
| 29 | user/mail/delete | 删除邮件 | 用户 |
| 30 | user/mail/receive | 领取邮件附件 | 用户 |
| 31 | user/reddot/get | 获取红点数据 | 用户 |
| 32 | user/water/list | 获取流水记录 | 用户 |
| 33 | user/playaction/get | 获取玩家行为数据 | 用户 |
| 34 | user/getserial | 获取流水记录（按类型） | 用户 |
| 35 | user/changeuserinfo | 修改用户信息 | 用户 |
| 36 | charge/getenabledchargeconfigs | 获取充值配置 | 充值 |
| 37 | charge/getenabledwithdrawconfigs | 获取提现配置 | 充值 |
| 38 | charge/getchargechainaddress | 获取充值区块链地址 | 充值 |
| 39 | charge/getchargeorders | 获取充值订单列表 | 充值 |
| 40 | charge/getwithdraworders | 获取提现订单列表 | 充值 |
| 41 | charge/charge | 创建充值订单 | 充值 |
| 42 | charge/withdraw | 创建提现订单 | 充值 |
| 43 | game/getgamesteprecord | 获取游戏步骤记录 | 游戏 |
| 44 | game/getfupan | 获取复盘数据 | 游戏 |
| 45 | game/getgameuserscores | 获取游戏用户分数 | 游戏 |
| 46 | game/getbills | 获取账单列表 | 游戏 |
| 47 | game/getfinalbills | 获取结算账单列表 | 游戏 |
| 48 | user/startchat | 开始客服聊天 | 客服 |
| 49 | user/getrooms | 获取聊天房间列表 | 客服 |
| 50 | user/getroom | 获取聊天房间 | 客服 |
| 51 | user/getchats | 获取聊天记录 | 客服 |
| 52 | lobbyrewards/getall | 获取大厅奖励 | 奖励 |
| 53 | lobbyrewards/dolottery | 转动大转盘 | 奖励 |
| 54 | lobbyrewards/gainaction | 领取奖励 | 奖励 |
| 55 | lobbyrewards/checkin | 签到 | 奖励 |
