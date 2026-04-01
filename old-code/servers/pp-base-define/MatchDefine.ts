import { RewardDefine } from "./RewardDefine"
import { RoomDefine } from "./RoomDefine"


export namespace MatchDefine {
	export enum MatchStatus {
		Signup,
		Running,
		Ended,
		FullyEnded,
	}
	export type tData = {
		matchID:number,
		name:string,
		signup:{
			itemID:string,
			count:string,
		}[],

		gameData:RoomDefine.GameData,
		status:MatchStatus,
		changeStatusTimestamp:number,

		// 强制买入，null是全部
		buyin?:string,
		combineStartUserCount:number,	// 合桌触发人数
		combineMinUserCount:number,		// 合桌后最少人数

		itemID:string,	// 使用的道具ID
		lockItemCount:string,	// 锁定道具数量,"0"表示全部锁定

		maxEnterCount:number,	// 最大进入次数

		signupStartTime:number,	// 报名开始时间
		signupEndTime:number,	// 报名结束时间

		startTime:number,		// 比赛开始时间
		duration:number,		// 比赛时长，单位毫秒
	}

	export type tDisplay = {
		matchID:number,
		// 规则 iconUrl需要通过upload接口上传后获得
		rules:{
			content?:string,
			iconUrl?:string,
		}[],
		// 列表数据
		list:{
			iconUrl?:string,
			title?:string,
			content?:string,
		}
	}

	// 比赛奖励
	export type tReward = {
		matchID:number,
		ranks:{
			// minRank <= rank <= maxRank
			minRank:number,
			maxRank:number,
			items:{
				itemID:string,
				count:string,
			}[]
		}[]
	}

	// 抽水设置
	export type tWater = RewardDefine.tMatchWater & {
		matchID:number
	}
	
	export type tExecuterRoomInfo = {
		matchID:number,
		executerID:string,				// 执行器ID
		roomID:number,
		waitingCombine:boolean,			// 等待合桌
		forceWaitingCombine:boolean,			// 等待合桌
		status:RoomDefine.RoomStatus,
		gsName:string,					// GS服务器名
		users:{
			userID:number,
			lastScore:string,			// 上次分数
		}[]
	}

	export type tExecuter = {
		matchID:number,
		executerID:string,
		executerRpcName:string,
		executerHost:string,
		online:boolean,
	}

	export type tRuntime = {
		matchID:number,
		masterName:string,
		masterHost:string,

		executerIdx:number,
		executerOnline:boolean,

		startTimestamp:number,
		startDate:string,
	}

	export enum UserMatchStatus {
		Wait,		// 等待入场
		Ready,		// 已准备
		ReadyToPlay,// lock成功，准备开始
		Playing,	// 游戏中
		Out,		// 已出局
		Win,		// 获胜
	}

	export type tUserRuntime = {
		matchID:number,
		userID:number,

		roomID:number,

		signupTime:number,		// 报名时间
		enterCount:number,		// 进入次数

		scoreOrigin:string,		// 初始分数
		scoreChange:string,		// 分数变化
		score:string,			// 当前分数
		scoreNum:number,		// 当前分数数值化，方便排序

		status:UserMatchStatus,	// 状态
		robot?:boolean,
		outTimestamp?:number,

		timestamp:number,
		date:string,
	}

	export type tUserSignupRecord = {
		matchID:number,
		userID:number,
		signupItemID:string,
		signupItemCount:string,

		robot?:boolean,

		timestamp:number,
		date:string,
	}

	export type tUserRank = {
		userID:number,
		matchID:number,
		rank:number,
		rewards:{
			itemID:string,
			count:string,
		}[],
		score:string,
		scoreNum:number,
		timestamp:number,
		date:string,
	}

	export enum UserMatchEventType {
		ReadyStart,			// 准备开始
		Start,				// 比赛开始

		Win = 50,
		Lose = 51,

		Out = 100,			// 出局

		Out_NotReady,		// 未准备出局
		Out_EnterFailed,	// 进入失败出局
	}

	export type tUserMatchEvent = {
		eventID:number,
		userID:number,
		matchID:number,
		type:UserMatchEventType,
		onlyPush:boolean,	// 仅推送不查询
		roomID?:number,
		rankInfo?:tUserRank,
		read:boolean,		// 是否已读
		timestamp:number,
		expireTimestamp:number,
	}

	export function getLockID(matchID:number,gameID:number) {
		return "MATCH:" + matchID + "GAMEID:" + gameID
	}
}