

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { serviceEntity } from "kdweb-core/lib/service/entity"
import { ClubService } from "./service/club"
import { LobbyService } from "./service/lobby"
import { TestService } from "./service/test"
import { UserService } from "./service/user"
import { LobbyGameService } from "./service/game"
import { LobbyRewardService } from "./service/reward"
import { AKVerifyFuncs } from "../src/AKVerifyFuncs"
import { MatchService } from "./service/match"
import { UserUploadService } from "./service/upload"
import { ChargeService } from "./service/charge"
const cors = require('cors');

let AKVerifyService = AKVerifyFuncs.AppVerifyFunctional
Rpc.init(async ()=>{
	let config = await knRpcTools.getKDSConfig(Config.myName)
	Config.kdsConfig = config
	let app = new serviceEntity(config.servicePort)
	app.setAllowOrigin()

	app.app.use(cors({
		origin: '*',
		methods: ['GET','POST','OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
		],
	}))

	app.addInstance("/lobby/getbag",AKVerifyService(LobbyService.getBag))
	app.addInstance("/lobby/getgroups",AKVerifyService(LobbyService.getGroups))
	app.addInstance("/lobby/enter",AKVerifyService(LobbyService.lobbyEnter))
	// 当SrsDCN.itemConfigChanged触发时需要主动拉取
	app.addInstance("/lobby/getitemconfigs",AKVerifyService(LobbyService.getItemConfigs))

	app.addInstance("/lobby/getnews",AKVerifyService(LobbyService.getNews))
	app.addInstance("/lobby/getnewsdetail",AKVerifyService(LobbyService.getNewsDetail))
	app.addInstance("/lobby/getbanners",AKVerifyService(LobbyService.getBanners))

	app.addInstance("/lobby/createroom",AKVerifyService(LobbyService.createRoom))
	app.addInstance("/lobby/joinroom",AKVerifyService(LobbyService.joinRoom))

	// app.addInstance("/lobby/getchargeconfig",AKVerifyService(LobbyService.getChargeConfig))
	// // 获取提现配置
	// app.addInstance("/lobby/getwithdrawconfig",AKVerifyService(LobbyService.getWithdrawConfig))
	// // 提现请求
	// app.addInstance("/lobby/withdrawreq",AKVerifyService(LobbyService.withdrawReq))
	// 获取大厅奖励，任务、转盘等等
	app.addInstance("/lobbyrewards/getall",AKVerifyService(LobbyRewardService.getLobbyRewards))
	// 转动大转盘
	app.addInstance("/lobbyrewards/dolottery",AKVerifyService(LobbyRewardService.doLottery))
	// 领取奖励
	app.addInstance("/lobbyrewards/gainaction",AKVerifyService(LobbyRewardService.gainAction))
	// 签到，返回奖励
	app.addInstance("/lobbyrewards/checkin",AKVerifyService(LobbyRewardService.checkin))

	// app.addInstance("/club/getrooms",AKVerifyService(ClubService.getRooms))
	// app.addInstance("/club/getuserclubdatas",AKVerifyService(ClubService.getUserClubDatas))
	// app.addInstance("/club/getfulldata",AKVerifyService(ClubService.getFullData))
	// app.addInstance("/club/getdata",AKVerifyService(ClubService.getBaseData))
	// app.addInstance("/club/getdatas",AKVerifyService(ClubService.getBaseDatas))
	// app.addInstance("/club/getsubmembers",AKVerifyService(ClubService.getSubMembers))
	// app.addInstance("/club/getsubmember",AKVerifyService(ClubService.getSubMember))
	// app.addInstance("/club/getsubaccount",AKVerifyService(ClubService.getSubAccount))
	// app.addInstance("/club/getselfmember",AKVerifyService(ClubService.getSelfMember))
	// app.addInstance("/club/delmember",AKVerifyService(ClubService.delMember))
	// app.addInstance("/club/req",AKVerifyService(ClubService.req))
	// app.addInstance("/club/accept",AKVerifyService(ClubService.accept))
	// app.addInstance("/club/invite",AKVerifyService(ClubService.invite))
	// app.addInstance("/club/invitelist",AKVerifyService(ClubService.inviteList))
	// app.addInstance("/club/agree",AKVerifyService(ClubService.agree))
	// app.addInstance("/club/createtemplate",AKVerifyService(ClubService.createTemplate))
	// app.addInstance("/club/updatetemplate",AKVerifyService(ClubService.updateTemplate))
	// app.addInstance("/club/gettemplates",AKVerifyService(ClubService.getTemplates))
	// app.addInstance("/club/deltemplate",AKVerifyService(ClubService.delTemplate))
	// app.addInstance("/club/updatesetting",AKVerifyService(ClubService.updateSetting))
	// app.addInstance("/club/searchuserID",AKVerifyService(ClubService.searchUserID))
	// app.addInstance("/club/changemembertype",AKVerifyService(ClubService.changeMemberType))
	// app.addInstance("/club/changejobtype",AKVerifyService(ClubService.changeJobType))
	// app.addInstance("/club/setdeskcost",AKVerifyService(ClubService.setDeskCost))
	// app.addInstance("/club/setdeskcosts",AKVerifyService(ClubService.setDeskCosts))
	// app.addInstance("/club/getdeskcosts",AKVerifyService(ClubService.getDeskCosts))

	// app.addInstance("/club/admin/billdata/list",AKVerifyService(ClubService.getAdminBillDataList))
	// app.addInstance("/club/admin/billdata/sublist",AKVerifyService(ClubService.getAdminBillDataSubList))
	// app.addInstance("/club/member/billdata/list",AKVerifyService(ClubService.getMemberBillDataList))
	// app.addInstance("/club/member/billdata/sublist",AKVerifyService(ClubService.getMemberBillDataSubList))

	app.addInstance("/match/getmatchlist",AKVerifyService(MatchService.getMatchList))
	app.addInstance("/match/getmatchfulldisplay",AKVerifyService(MatchService.getMatchFullDisplay))
	app.addInstance("/match/getmatchuserruntime",AKVerifyService(MatchService.getMatchUserRuntime))
	app.addInstance("/match/getmatchrank",AKVerifyService(MatchService.getMatchRank))
	app.addInstance("/match/getmatchruntimerank",AKVerifyService(MatchService.getMatchRuntimeRank))
	app.addInstance("/match/getroom",AKVerifyService(MatchService.getRoom))
	app.addInstance("/match/signup",AKVerifyService(MatchService.signup))

	
	app.addInstance("/user/getserial",AKVerifyService(UserService.getSerial))
	app.addInstance("/user/baseinfo/get",AKVerifyService(UserService.getUserBaseInfo))
	app.addInstance("/user/baseinfos/get",AKVerifyService(UserService.getUserBaseInfos))
	app.addInstance("/user/changeuserinfo",AKVerifyService(UserService.changeUserInfo))
	app.addInstance("/user/mail/list",AKVerifyService(UserService.getMailList))
	app.addInstance("/user/mail/read",AKVerifyService(UserService.readMail))
	app.addInstance("/user/mail/delete",AKVerifyService(UserService.deleteMail))
	app.addInstance("/user/mail/receive",AKVerifyService(UserService.receiveMail))

	app.addInstance("/user/water/list",AKVerifyService(UserService.getUserWaterList))
	
	app.addInstance("/user/reddot/get",AKVerifyService(UserService.getRedDot))
	app.addInstance("/user/playaction/get",AKVerifyService(UserService.getUserPlayAction))


	app.addInstance("/game/getgamesteprecord",AKVerifyService(LobbyGameService.getGameStepRecord))
	app.addInstance("/game/getfupan",AKVerifyService(LobbyGameService.getFupanData))
	app.addInstance("/game/getgameuserscores",AKVerifyService(LobbyGameService.getGameUserScores))
	app.addInstance("/game/getbills",AKVerifyService(LobbyGameService.getBills))
	app.addInstance("/game/getfinalbills",AKVerifyService(LobbyGameService.getFinalBills))

	app.addInstance("/upload/start",AKVerifyService(UserUploadService.uploadMedia_Start))
	app.addInstance("/upload/upload",AKVerifyService(UserUploadService.uploadMedia_Upload))
	app.addInstance("/upload/end",AKVerifyService(UserUploadService.uploadMedia_End))


	// app.addInstance("/test/createroom",AKVerifyService(TestService.createRoom))
	// app.addInstance("/test/getrooms",AKVerifyService(TestService.getRooms))
	// app.addInstance("/test/jiesanroom",AKVerifyService(TestService.jiesanRoom))
	// app.addInstance("/test/addvalue",AKVerifyService(TestService.addValue))

	ChargeService.initUpload(app.app)

	// 获取充值订单
	app.addInstance("/charge/getchargeorders",AKVerifyService(ChargeService.getChargeOrders))
	// 获取提现订单
	app.addInstance("/charge/getwithdraworders",AKVerifyService(ChargeService.getWithdrawOrders))
	// 获取充值链上地址
	app.addInstance("/charge/getchargechainaddress",AKVerifyService(ChargeService.getChargeChainAddress))
	// 获取充值配置
	app.addInstance("/charge/getenabledchargeconfigs",AKVerifyService(ChargeService.getEnabledChargeConfigs))
	// 获取提现配置
	app.addInstance("/charge/getenabledwithdrawconfigs",AKVerifyService(ChargeService.getEnabledWithdrawConfigs))
	// 充值订单创建
	app.addInstance("/charge/charge",AKVerifyService(ChargeService.charge))
	// 提现请求
	app.addInstance("/charge/withdraw",AKVerifyService(ChargeService.withdraw))

	app.listen()
})

