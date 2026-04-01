import { RoomDefine } from "./RoomDefine"

export namespace GSUserMsg {
	// 客户端加载完毕，准备进入
	export let ReadyToEnter = "GSC_ReadyToEnter"

	export let RoundStart = "GSC_RoundStart"
	export type tRoundStartNT = {
		data?:any,
	}

	export let RoundEnd = "GSC_RoundEnd"
	export type tRoundEndNT = {
		removeType?:RoomDefine.RemoveType
	}
	export let Error = "GSC_Error"
	export type tErrorNT = {
		errCode?:number,
		errMsg?:string,
		needRestart?:boolean,
	}

	export let FupanStart = "GSC_Fupan_Start"
	export type tFupanStartNT = {
		roomID:number,
		roomInfo:tRoomInfoNT,
		users:tUserEnterData[],
		juCount:number,

		juEndTime:number,
	}

	export let FupanEnd = "GSC_Fupan_End"
	export type tFupanEndNT = {
		
	}

	export let GameStart = "GSC_GameStart"
	export type tGameStartNT = {
		data:any,
		juCount:number,
		playingChairNos:number[],
		gameData?:RoomDefine.GameData,
	}

	// export let GameResult = "GSC_GameResult"
	// export type tGameResultNT = {
	// 	users:{
	// 		chairNo:number,
	// 		scoreChanged:string,
	// 		score:string,
	// 		data?:any
	// 	}[]
	// }
	
	export let GameEnd = "GSC_GameEnd"
	export type tGameEndNT = {
		data?:any,
	}

	export enum ScoreChangeType {
		Game,
		Charge,
		Fee,
	}
	export let ScoreChange = "GSC_ScoreChange"
	export type tScoreChangeNT = {
		chairNo:number,
		score:string,
		scoreChanged:string,
		type:ScoreChangeType,
	}
	
	export let RoomInfo = "GSC_RoomInfo"
	export type tRoomInfoNT = {
		roomID:number,
		boxCode?:string,
		gameData:RoomDefine.GameData,
		club:{
			clubID:number,
			templateID?:number,
		},
		juCount:number,
		groupID?:number,
		matchID?:number,
		bossUserID?:number,
		roomType:RoomDefine.RoomType,
	}

	export let Online = "GSC_UserOnline"
	export type tOnlineNT = {
		chairNo:number,
		b:boolean,
	}

	export let Tuoguan = "GSC_UserTuoGuan"
	export type tTuoguanNT = {
		chairNo:number,
		b:boolean,
	}

	export let UserEnter = "GSC_UserEnter"
	export type tUserEnterData = {
		chairNo:number,
		userID:number,
		nickName:string,
		iconUrl:string,
		sex:number,
		score:string,
		online:boolean,
		tuoguan:boolean,
	}
	export type tUserEnterNT = {
		users:tUserEnterData[]
	}

	export let UserExit = "GSC_UserExit"
	export type tUserExitNT = {
		chairNo:number,
	}
	
	export let UserSitdown = "GSC_UserSitdown"
	export type tUserSitdownNT = {
		chairNo:number,
		toChairNo:number,
	}

	export let UserStandUp = "GSC_UserStandUp"
	export type tUserStandUpNT = {
		chairNo:number,
		toChairNo:number,
	}

	export let Jiesan = "GSC_Jiesan"
	export type tJiesanNT = {
		chairNo:number,
		juEnd?:boolean,
	}

	export let Ready = "GSC_Ready"
	export type tReadyReq = {
		b:boolean,
	}
	export type tReadyNT = {
		users:{
			chairNo:number,
			ready:boolean,
		}[]
	}

	export let GameSync = "GSC_GameSync"
	export type tGameSyncNT = {
		gameStartNT:tGameStartNT,
		roomNT:tRoomInfoNT,
		users:tUserEnterData[],
		syncData:any,
	}

	export let RoundResult = "GSC_RoundResult"
	export type tRoundResult = {
		users:{
			chairNo:number,
			userID:number,
			scoreChanged:string,
			extData?:any,
		}[]
	}

	export enum ChatType {
		Text	= 0x01,		// 文本
		Fast	= 0x02,		// 快捷语
		Emoji	= 0x04,		// 表情
		ToEmoji	= 0x08,		// 互动表情
	}
	export let Chat = "GSC_Chat"
	export type tChatReq = {
		type:ChatType,

		text?:string,
		toChairNo?:number,	// 互动表情
		index?:number,		// 快捷语/表情/互动表情 索引
	}
	export type tChatNT = {
		type:ChatType,
		fromChairNo?:number,
		text?:string,
		toChairNo?:number,	// 互动表情
		index?:number,		// 快捷语/表情/互动表情 索引
	}
}