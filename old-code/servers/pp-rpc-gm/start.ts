
import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Config } from "./config"
import { Rpc } from "./rpc"
import { baseService, lambdaAsyncService } from "kdweb-core/lib/service/base"
import { Log } from "./log"
import { knRpcTools } from "../src/knRpcTools"
import { GMTools } from "./tools/GMTools"
import { DB } from "../src/db"
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "../src/TimeDate"
import { GMService } from "./service/GMService"
import md5 = require("md5")
import { DBDefine } from "../pp-base-define/DBDefine"
import { GMManager } from "./service/GMManager"
import { GMUser } from "./service/GMUser"
import { GMMail } from "./service/GMMail"
import { GMRobot } from "./service/GMRobot"
import { GMRobotPanel } from "./service/GMRobotPanel"
import { GMConfigService } from "./service/GMConfig"
import { AKVerifyFuncs } from "../src/AKVerifyFuncs"
import { GMUploadService } from "./service/GMUpload"
import { GMMatchService } from "./service/GMMatch"
import { GMRobotExtension } from "./service/GMRobotExtension"
import { GMNewsService } from "./service/GMNews"
import { AdminReqDefine } from "../pp-base-define/AdminReqDefine"
import { GMUserInfoService } from "./service/GMUserInfo"
import { GMChargeService } from "./service/GMCharge"
import { GMUserPotService } from "./service/GMUserPot"

let AKVerifyFunctional = AKVerifyFuncs.ConsoleVerifyFunctional
let AKVerifyFunctional_Record = AKVerifyFuncs.ConsoleVerifyFunctional_Record

Rpc.init()
.then(async ()=>{
	let config = await knRpcTools.getKDSConfig(Config.myName)
	let app = new wcore.service.entity(config.servicePort)
	app.setAllowOrigin()
	// 测试路径 https://ctest.caesarcaesar.com/sr/admin/

	// 登录
	// app.addInstance("/login",lambdaAsyncService.create(GMService.login))

	// 全局配置
	app.addInstance("/config/getglobal",			AKVerifyFunctional(GMConfigService.getGlobalConfig))
	app.addInstance("/config/setglobal",			AKVerifyFunctional_Record(GMConfigService.setGlobalConfig))
	// 登录配置
	app.addInstance("/config/getlogin",				AKVerifyFunctional(GMConfigService.getLoginConfig))
	app.addInstance("/config/setlogin",				AKVerifyFunctional_Record(GMConfigService.setLoginConfig))

	// item配置
	app.addInstance("/config/item/get", 			AKVerifyFunctional(GMConfigService.getItems))
	app.addInstance("/config/item/del", 			AKVerifyFunctional(GMConfigService.delItem))
	app.addInstance("/config/item/update", 			AKVerifyFunctional(GMConfigService.updateItem))
	app.addInstance("/config/item/create", 			AKVerifyFunctional(GMConfigService.createItem))
	// 刷新item缓存
	app.addInstance("/config/item/refresh", 		AKVerifyFunctional(GMConfigService.refreshItemCache))

	// 设置好友抽水配置
	app.addInstance("/config/setfriendwater",		AKVerifyFunctional_Record(GMConfigService.setFriendWater))
	// 获取好友抽水配置
	app.addInstance("/config/getfriendwater",		AKVerifyFunctional(GMConfigService.getFriendWater))
	// 设置默认匹配抽水配置
	app.addInstance("/config/setdefaultgroupwater",	AKVerifyFunctional_Record(GMConfigService.setDefaultGroupWater))
	// 获取默认匹配抽水配置
	app.addInstance("/config/getdefaultgroupwater",	AKVerifyFunctional(GMConfigService.getDefaultGroupWater))
	// 设置默认比赛抽水配置
	app.addInstance("/config/setdefaultmatchwater",	AKVerifyFunctional_Record(GMConfigService.setDefaultMatchWater))
	// 获取默认比赛抽水配置
	app.addInstance("/config/getdefaultmatchwater",	AKVerifyFunctional(GMConfigService.getDefaultMatchWater))

	// 设置全局充值奖励配置
	app.addInstance("/config/setglobalchargereward",	AKVerifyFunctional(GMConfigService.setGlobalChargeReward))
	// 获取全局充值奖励配置
	app.addInstance("/config/getglobalchargereward",	AKVerifyFunctional(GMConfigService.getGlobalChargeReward))

	// 获取代理充值奖励配置
	app.addInstance("/config/getproxycharge",		AKVerifyFunctional(GMConfigService.getProxyCharge))
	// 设置代理充值奖励配置
	app.addInstance("/config/setproxycharge",		AKVerifyFunctional_Record(GMConfigService.setProxyCharge))



	// 获取匹配
	app.addInstance("/mgr/getgroups",				AKVerifyFunctional(GMManager.getGroups))
	// 创建匹配
	app.addInstance("/mgr/creategroup",				AKVerifyFunctional_Record(GMManager.createGroup))
	// 更新匹配
	app.addInstance("/mgr/updategroup",				AKVerifyFunctional_Record(GMManager.updateGroup))
	// 更新匹配抽水设置
	app.addInstance("/mgr/updategroupwater",		AKVerifyFunctional_Record(GMManager.updateGroupWater))
	// 删除匹配
	app.addInstance("/mgr/delgroup",				AKVerifyFunctional_Record(GMManager.delGroup))

	// 获取房间
	app.addInstance("/mgr/getallrooms",				AKVerifyFunctional(GMManager.getAllRooms))
	// 解散房间
	app.addInstance("/mgr/jiesanroom",				AKVerifyFunctional_Record(GMManager.jiesanRoom))

	// 发送系统邮件
	app.addInstance("/mgr/sendsystemmail",			AKVerifyFunctional_Record(GMMail.sendSystemMail))
	// 发送用户邮件
	app.addInstance("/mgr/sendusermail",			AKVerifyFunctional_Record(GMMail.sendUserMail))

	// 获取用户列表
	app.addInstance("/user/getusers",				AKVerifyFunctional(GMUser.getUsers))
	// 获取一般用户列表
	app.addInstance("/user/filter/getnormalusers",	AKVerifyFunctional(GMUser.getNormalUsers))
	// 获取代理用户列表
	app.addInstance("/user/filter/getproxyusers",	AKVerifyFunctional(GMUser.getProxyUsers))
	// 获取管理员用户列表
	app.addInstance("/user/filter/getadminusers",	AKVerifyFunctional(GMUser.getAdminUsers))
	// 获取机器人用户列表
	app.addInstance("/user/filter/getrobotusers",	AKVerifyFunctional(GMUser.getRobotUsers))
	// 设置用户禁用/启用
	app.addInstance("/user/setuserdisabled",		AKVerifyFunctional_Record(GMUser.setUserDisabled))
	// 设置用户锁定提现
	app.addInstance("/user/setuserlockwithdraw",	AKVerifyFunctional_Record(GMUser.setUserLockWithdraw))

	// 获取用户账户 getusers会返回背包
	app.addInstance("/user/getuserbags",			AKVerifyFunctional(GMUser.getUserBags))
	// 获取用户冻结账户
	app.addInstance("/user/getuserlocked",			AKVerifyFunctional(GMUser.getUserLocked))
	// 创建冻结createLockItem
	app.addInstance("/user/createlockitem",			AKVerifyFunctional_Record(GMUser.createLockItem))
	// 给用户增加物品
	app.addInstance("/user/adduseritem",			AKVerifyFunctional_Record(GMUser.addUserItem))
	// 给用户增加俱乐部账户
	app.addInstance("/user/adduserclubvalue",		AKVerifyFunctional_Record(GMUser.addUserClubValue))
	// 解冻账户
	app.addInstance("/user/unlock",					AKVerifyFunctional_Record(GMUser.unlock))
	// 根据道具数量获取用户列表
	app.addInstance("/user/getuserswithvalue",		AKVerifyFunctional(GMUser.getUsersWithValue))
	// 获取用户流水
	app.addInstance("/user/getserials",				AKVerifyFunctional(GMUser.getSerials))
	// 获取注册审核列表
	app.addInstance("/user/audit/getregisteraudits",	AKVerifyFunctional(GMUser.getRegisterAudits))
	// 确认注册审核
	app.addInstance("/user/audit/confirmregisteraudit",	AKVerifyFunctional_Record(GMUser.confirmRegisterAudit))
	// 获取注册审核上传数据
	app.addInstance("/user/audit/getregisterauditupload",	AKVerifyFunctional(GMUser.getRegisterAuditUpload))

	// 更改用户可以登录的平台 App或者后台
	app.addInstance("/user/changelogintarget",		AKVerifyFunctional_Record(GMUserInfoService.changeUserLoginTarget))
	// 更改用户在某个登录平台的权限
	app.addInstance("/user/changetargetrole",		AKVerifyFunctional_Record(GMUserInfoService.changeUserTargetRole))
	// 创建账户
	app.addInstance("/user/createaccount",			AKVerifyFunctional_Record(GMUserInfoService.createAccountChannel))
	// 修改密码
	app.addInstance("/user/changepwd",				AKVerifyFunctional_Record(GMUserInfoService.changePWD))


	// 获取充值区块链信息
	app.addInstance("/charge/getchaininfos",					AKVerifyFunctional(GMChargeService.getChainInfos))
	// 更新充值区块链信息
	app.addInstance("/charge/updatechaininfo",					AKVerifyFunctional_Record(GMChargeService.updateChainInfo))
	// 获取银行信息
	app.addInstance("/charge/getbankinfos",						AKVerifyFunctional(GMChargeService.getBankInfos))
	// 更新银行信息
	app.addInstance("/charge/updatebankinfo",					AKVerifyFunctional_Record(GMChargeService.updateBankInfo))
	// 获取银行支行信息
	app.addInstance("/charge/getbankbranchinfos",				AKVerifyFunctional(GMChargeService.getBankBranchInfos))
	// 更新银行支行信息
	app.addInstance("/charge/updatebankbranchinfo",				AKVerifyFunctional_Record(GMChargeService.updateBankBranchInfo))
	// 获取paypal信息
	app.addInstance("/charge/getpaypalinfos",					AKVerifyFunctional(GMChargeService.getPaypalInfos))
	// 更新paypal信息
	app.addInstance("/charge/updatepaypalinfo",					AKVerifyFunctional_Record(GMChargeService.updatePaypalInfo))
	// 获取充值配置 - 银行卡
	app.addInstance("/charge/getchargeconfig_bank",				AKVerifyFunctional(GMChargeService.getChargeConfig_Bank))
	// 更新充值配置 - 银行卡
	app.addInstance("/charge/updatechargeconfig_bank",			AKVerifyFunctional_Record(GMChargeService.updateChargeConfig_Bank))
	// 启用/禁用充值配置 - 银行卡
	app.addInstance("/charge/setchargeconfigenabled_bank",		AKVerifyFunctional_Record(GMChargeService.setChargeConfigEnabled_Bank))
	// 获取充值配置 - 第三方钱包
	app.addInstance("/charge/getchargeconfig_blockchain",		AKVerifyFunctional(GMChargeService.getChargeConfig_Blockchain))
	// 更新充值配置 - 第三方钱包
	app.addInstance("/charge/updatechargeconfig_blockchain",	AKVerifyFunctional_Record(GMChargeService.updateChargeConfig_Blockchain))
	// 启用/禁用充值配置 - 第三方钱包
	app.addInstance("/charge/setchargeconfigenabled_blockchain",AKVerifyFunctional_Record(GMChargeService.setChargeConfigEnabled_Blockchain))
	// 获取充值配置 - PayPal
	app.addInstance("/charge/getchargeconfig_paypal",			AKVerifyFunctional(GMChargeService.getChargeConfig_Paypal))
	// 更新充值配置 - PayPal
	app.addInstance("/charge/updatechargeconfig_paypal",		AKVerifyFunctional_Record(GMChargeService.updateChargeConfig_Paypal))
	// 启用/禁用充值配置 - PayPal
	app.addInstance("/charge/setchargeconfigenabled_paypal",	AKVerifyFunctional_Record(GMChargeService.setChargeConfigEnabled_Paypal))
	// 获取充值配置 - Apple Card
	app.addInstance("/charge/getchargeconfig_applecard",		AKVerifyFunctional(GMChargeService.getChargeConfig_AppleCard))
	// 更新充值配置 - Apple Card
	app.addInstance("/charge/updatechargeconfig_applecard",	AKVerifyFunctional_Record(GMChargeService.updateChargeConfig_AppleCard))
	// 启用/禁用充值配置 - Apple Card
	app.addInstance("/charge/setchargeconfigenabled_applecard",AKVerifyFunctional_Record(GMChargeService.setChargeConfigEnabled_AppleCard))

	// 获取充值奖励配置
	app.addInstance("/charge/confirm/getchargeorders",			AKVerifyFunctional(GMChargeService.getChargeOrders))
	// 获取充值上传信息
	app.addInstance("/charge/confirm/getchargeupload",			AKVerifyFunctional(GMChargeService.getChargeUpload))
	// 确认充值订单
	app.addInstance("/charge/confirm/confirmchargeorder",		AKVerifyFunctional_Record(GMChargeService.confirmChargeOrder))
	// 获取提现订单
	app.addInstance("/charge/confirm/getwithdraworders",		AKVerifyFunctional(GMChargeService.getWithdrawOrders))
	// 确认提现订单
	app.addInstance("/charge/confirm/confirmwithdraworder",		AKVerifyFunctional_Record(GMChargeService.confirmWithdrawOrder))
	// 获取提现配置 - 银行卡
	app.addInstance("/charge/getwithdrawconfig_bank",				AKVerifyFunctional(GMChargeService.getWithdrawConfig_Bank))
	// 更新提现配置 - 银行卡
	app.addInstance("/charge/updatewithdrawconfig_bank",			AKVerifyFunctional_Record(GMChargeService.updateWithdrawConfig_Bank))
	// 启用/禁用提现配置 - 银行卡
	app.addInstance("/charge/setwithdrawconfigenabled_bank",		AKVerifyFunctional_Record(GMChargeService.setWithdrawConfigEnabled_Bank))
	// 获取提现配置 - 第三方钱包
	app.addInstance("/charge/getwithdrawconfig_blockchain",		AKVerifyFunctional(GMChargeService.getWithdrawConfig_Blockchain))
	// 更新提现配置 - 第三方钱包
	app.addInstance("/charge/updatewithdrawconfig_blockchain",	AKVerifyFunctional_Record(GMChargeService.updateWithdrawConfig_Blockchain))
	// 启用/禁用提现配置 - 第三方钱包
	app.addInstance("/charge/setwithdrawconfigenabled_blockchain",AKVerifyFunctional_Record(GMChargeService.setWithdrawConfigEnabled_Blockchain))
	// 获取提现配置 - PayPal
	app.addInstance("/charge/getwithdrawconfig_paypal",			AKVerifyFunctional(GMChargeService.getWithdrawConfig_Paypal))
	// 更新提现配置 - PayPal
	app.addInstance("/charge/updatewithdrawconfig_paypal",		AKVerifyFunctional_Record(GMChargeService.updateWithdrawConfig_Paypal))
	// 启用/禁用提现配置 - PayPal
	app.addInstance("/charge/setwithdrawconfigenabled_paypal",	AKVerifyFunctional_Record(GMChargeService.setWithdrawConfigEnabled_Paypal))

	// 获取提现主地址
	app.addInstance("/charge/getwithdrawchainmainaddress",				AKVerifyFunctional(GMChargeService.getWithdrawChainMainAddress))
	// 更新提现主地址
	app.addInstance("/charge/updatewithdrawchainmainaddress",			AKVerifyFunctional_Record(GMChargeService.updateWithdrawChainMainAddress))
	// 启用/禁用提现主地址
	app.addInstance("/charge/setwithdrawchainmainaddressenabled",		AKVerifyFunctional_Record(GMChargeService.setWithdrawChainMainAddressEnabled))
	
	// 获取奖池列表
	app.addInstance("/pot/getpotlist",					AKVerifyFunctional(GMUserPotService.getPotList))
	// 为用户创建奖池
	app.addInstance("/pot/createforuser",				AKVerifyFunctional_Record(GMUserPotService.createForUser))
	// 为匹配创建奖池
	app.addInstance("/pot/createforgroup",				AKVerifyFunctional_Record(GMUserPotService.createForGroup))
	// 为比赛创建奖池
	app.addInstance("/pot/createformatch",				AKVerifyFunctional_Record(GMUserPotService.createForMatch))
	// 更新奖池配置
	app.addInstance("/pot/updatepotconfig",				AKVerifyFunctional_Record(GMUserPotService.updatePotConfig))
	// 设置奖池启用状态
	app.addInstance("/pot/setpotenabled",				AKVerifyFunctional_Record(GMUserPotService.setPotEnabled))
	// 添加奖池总额
	app.addInstance("/pot/addtotalvalue",				AKVerifyFunctional_Record(GMUserPotService.addTotalValue))
	// 测试奖池匹配，输入参数，返回最终匹配到的奖池
	app.addInstance("/pot/testpot",						AKVerifyFunctional_Record(GMUserPotService.testPot))
	
	// 获取比赛列表
	app.addInstance("/match/getmatchlist",			AKVerifyFunctional(GMMatchService.getMatchList))
	// 创建比赛
	app.addInstance("/match/creatematch",			AKVerifyFunctional_Record(GMMatchService.createMatch))
	// 删除比赛
	app.addInstance("/match/delmatch",				AKVerifyFunctional_Record(GMMatchService.delMatch))
	// 更新展示数据
	app.addInstance("/match/updatedisplay",			AKVerifyFunctional_Record(GMMatchService.updateDisplay))
	// 更新基础数据
	app.addInstance("/match/updatedata",			AKVerifyFunctional_Record(GMMatchService.updateData))
	// 更新奖励数据
	app.addInstance("/match/updatereward",			AKVerifyFunctional_Record(GMMatchService.updateReward))
	// 更新抽水数据
	app.addInstance("/match/updatewater",			AKVerifyFunctional_Record(GMMatchService.updateWater))
	// 获取用户比赛运行时数据
	app.addInstance("/match/getuserruntimes",		AKVerifyFunctional(GMMatchService.getUserRuntimes))
	// 获取用户排名
	app.addInstance("/match/getrank",				AKVerifyFunctional(GMMatchService.getRank))
	// 获取报名记录
	app.addInstance("/match/getsignuprecord",		AKVerifyFunctional(GMMatchService.getSignupRecord))
	// 获取比赛执行器房间信息
	app.addInstance("/match/getexecuterroominfos",	AKVerifyFunctional(GMMatchService.getExecuterRoomInfos))

	// 获取新闻
	app.addInstance("/news/getnews",						AKVerifyFunctional(GMNewsService.getNews))
	// 创建新闻
	app.addInstance("/news/createnews",						AKVerifyFunctional_Record(GMNewsService.createNews))
	// 更新新闻数据
	app.addInstance("/news/updatenewsdata",					AKVerifyFunctional_Record(GMNewsService.updateNewsData))
	// 设置新闻显示状态
	app.addInstance("/news/setvisible",						AKVerifyFunctional_Record(GMNewsService.setVisible))
	// 删除新闻
	app.addInstance("/news/deletenews",						AKVerifyFunctional_Record(GMNewsService.deleteNews))

	// 获取横幅列表
	app.addInstance("/news/getbanners",						AKVerifyFunctional(GMNewsService.getBanners))
	// 创建横幅
	app.addInstance("/news/createbanner",					AKVerifyFunctional_Record(GMNewsService.createBanner))
	// 更新横幅
	app.addInstance("/news/updatebanner",					AKVerifyFunctional_Record(GMNewsService.updateBanner))
	// 设置横幅显示状态
	app.addInstance("/news/setbannervisible",				AKVerifyFunctional_Record(GMNewsService.setBannerVisible))
	// 删除横幅
	app.addInstance("/news/deletebanner",					AKVerifyFunctional_Record(GMNewsService.deleteBanner))

	// 机器人全局开关
	app.addInstance("/robot/ext/getglobalcontrol",			AKVerifyFunctional(GMRobotExtension.getGlobalControl))
	// 设置机器人全局开关
	app.addInstance("/robot/ext/setglobalcontrol",			AKVerifyFunctional_Record(GMRobotExtension.setGlobalControl))
	// 获取机器人充值库存
	app.addInstance("/robot/ext/getchargestore",			AKVerifyFunctional(GMRobotExtension.getChargeStore))
	// 获取机器人充值库存记录
	app.addInstance("/robot/ext/getchargestorerecord",		AKVerifyFunctional(GMRobotExtension.getChargeStoreRecord))
	// 获取机器人充值记录
	app.addInstance("/robot/ext/getrobotchargerecord",		AKVerifyFunctional(GMRobotExtension.getRobotChargeRecord))
	// 创建机器人充值库存
	app.addInstance("/robot/ext/createstore",				AKVerifyFunctional_Record(GMRobotExtension.createStore))
	// 更新机器人充值库存
	app.addInstance("/robot/ext/setstoreenabled",			AKVerifyFunctional_Record(GMRobotExtension.setStoreEnabled))
	// 为机器人添加充值库存
	app.addInstance("/robot/ext/addchargestore",			AKVerifyFunctional_Record(GMRobotExtension.addChargeStore))
	// 获取机器人个性配置列表
	app.addInstance("/robot/ext/getpersonalityconfigs",		AKVerifyFunctional(GMRobotExtension.getPersonalityConfigs))
	// 设置机器人个性配置
	app.addInstance("/robot/ext/setpersonalityconfig",		AKVerifyFunctional_Record(GMRobotExtension.setPersonalityConfig))
	// 删除机器人个性配置
	app.addInstance("/robot/ext/deletepersonalityconfig",	AKVerifyFunctional_Record(GMRobotExtension.deletePersonalityConfig))
	// 获取机器人匹配计划
	app.addInstance("/robot/ext/getgrouplan",				AKVerifyFunctional(GMRobotExtension.getGroupPlan))
	// 创建机器人匹配计划
	app.addInstance("/robot/ext/creategrouplan",			AKVerifyFunctional_Record(GMRobotExtension.createGroupPlan))
	// 更新机器人匹配计划启用状态
	app.addInstance("/robot/ext/updategrouplanenabled",		AKVerifyFunctional_Record(GMRobotExtension.updateGroupPlanEnabled))
	// 更改机器人匹配计划权重
	app.addInstance("/robot/ext/changegrouplanpower",		AKVerifyFunctional_Record(GMRobotExtension.changeGroupPlanPower))
	// 更改机器人匹配计划充值库存ID
	app.addInstance("/robot/ext/changegrouplanstoreid",		AKVerifyFunctional_Record(GMRobotExtension.changeGroupPlanStoreID))
	// 获取机器人比赛计划
	app.addInstance("/robot/ext/getmatchplan",				AKVerifyFunctional(GMRobotExtension.getMatchPlan))
	// 创建机器人比赛计划
	app.addInstance("/robot/ext/creatematchplan",			AKVerifyFunctional_Record(GMRobotExtension.createMatchPlan))
	// 更新机器人比赛计划启用状态
	app.addInstance("/robot/ext/updatematchplanenabled",	AKVerifyFunctional_Record(GMRobotExtension.updateMatchPlanEnabled))
	// 更改机器人比赛计划权重
	app.addInstance("/robot/ext/changematchplanstoreid",	AKVerifyFunctional_Record(GMRobotExtension.changeMatchPlanStoreID))
	// 创建机器人
	app.addInstance("/robot/ext/createrobot",				AKVerifyFunctional_Record(GMRobotExtension.createRobot))
	// // 获取机器人环境设置 没有默认值，首次获得null
	// app.addInstance("/robot/getenvconfig",			AKVerifyFunctional(GMRobot.getEnvConfig))
	// // 设置机器人环境设置
	// app.addInstance("/robot/setenvconfig",			AKVerifyFunctional_Record(GMRobot.setEnvConfig))
	// // 获取机器人策略
	// app.addInstance("/robot/getstrategyconfigs",	AKVerifyFunctional(GMRobot.getStrategyConfigs))
	// // 设置机器人策略
	// app.addInstance("/robot/updatestrategyconfig",	AKVerifyFunctional_Record(GMRobot.updateStrategyConfig))
	// // 获取全部机器人
	// app.addInstance("/robot/getrobotlogindatas",	AKVerifyFunctional(GMRobot.getRobotLoginDatas))
	// // 获取策略任务列表
	// app.addInstance("/robot/getstrategytasks",		AKVerifyFunctional(GMRobot.getStrategyTasks))
	// // 创建策略任务
	// app.addInstance("/robot/createstrategytask",	AKVerifyFunctional(GMRobot.createStrategyTask))
	// // 更改任务状态
	// app.addInstance("/robot/changestrategytaskstatus",	AKVerifyFunctional(GMRobot.changeStrategyTaskStatus))

	// // 获取机器人个性配置
	// app.addInstance("/robot/getpersonalityconfig",	AKVerifyFunctional(GMRobot.getPersonalityConfigs))
	// // 保存机器人个性配置
	// app.addInstance("/robot/setpersonalityconfig",	AKVerifyFunctional_Record(GMRobot.setPersonalityConfig))

	// app.addInstance("/robot/deletePersonalityConfig", AKVerifyFunctional_Record(GMRobot.deletePersonalityConfig))

	// // 获取机器人充值库存
	// app.addInstance("/robot/getrobotstorevalues", AKVerifyFunctional(GMRobot.getRobotStoreValues))
	// // 结束机器人充值库存
	// app.addInstance("/robot/endrobotstorevalue", AKVerifyFunctional_Record(GMRobot.endRobotStoreValue))
	// // 创建机器人充值库存
	// app.addInstance("/robot/createrobotstorevalue", AKVerifyFunctional_Record(GMRobot.createRobotStoreValue))
	// // 获取机器人库存使用记录
	// app.addInstance("/robot/getrobotusestorevaluerecords", AKVerifyFunctional(GMRobot.getRobotUseStoreValueRecords))

	// 机器人面板:
	// 获取面板数据
	app.addInstance("/robot/panel/get", AKVerifyFunctional(GMRobotPanel.getPanel))
	// 获取游戏输赢记录
	app.addInstance("/robot/panel/getserials", AKVerifyFunctional(GMRobotPanel.getRobotSerials))
	// 统计输赢记录
	app.addInstance("/robot/panel/aggserial", AKVerifyFunctional(GMRobotPanel.aggRobotSerial))
	// 获取机器人列表
	app.addInstance("/robot/panel/getrobots", AKVerifyFunctional(GMRobotPanel.getRobots))

	// 启动上传媒体文件
	app.addInstance("/uploadmedia/start",		AKVerifyFunctional_Record(GMUploadService.uploadMedia_Start))
	// 上传媒体文件
	app.addInstance("/uploadmedia/upload",		AKVerifyFunctional(GMUploadService.uploadMedia_Upload))
	// 完成上传媒体文件
	app.addInstance("/uploadmedia/end",			AKVerifyFunctional_Record(GMUploadService.uploadMedia_End))

	app.listen()
})