import { CoreFunctionals } from "../core/CoreFunctionals"
import { RoomDefine } from "../ServerDefines/RoomDefine"


export namespace ReqGame {
	export let getGameStepRecord = CoreFunctionals.reqAK<tGetGameStepRecordReq,tGetGameStepRecordRes>("game/getgamesteprecord")
	export type tGetGameStepRecordReq = {
		roomID:number,

		// page == 0或不传时，datas[0]=当前
		page?:number,
		limit?:number,
	}
	export type tGetGameStepRecordRes = {
		errCode?:number,
		errMsg?:string,

		datas:RoomDefine.GameStepRecord[],
		count?:number,
	}

	export let getFupanData = CoreFunctionals.reqAK<tGetFupanDataReq,tGetFupanDataRes>("game/getfupan")
	export type tGetFupanDataReq = {
		roomID:number,
		juCount:number,
	}
	export type tGetFupanDataRes = {
		errCode?:number,
		errMsg?:string,

		data:RoomDefine.FupanRecord
	}

	export let getGameUserScores = CoreFunctionals.reqAK<tGetGameUserScoresReq,tGetGameUserScoresRes>("game/getgameuserscores")
	export type tGetGameUserScoresReq = {
		roomID:number,
	}
	export type tGetGameUserScoresRes = {
		errCode?:number,
		errMsg?:string,
		datas:RoomDefine.UserScore[],	
	}

	export let getBills = CoreFunctionals.reqAK<tGetBillsReq,tGetBillsRes>("game/getbills")
	export type tGetBillsReq = {
		roomID?:number,
		page:number,
		limit:number,
	}
	export type tGetBillsRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:RoomDefine.BillData[],
	}

	export let getFinalBills = CoreFunctionals.reqAK<tGetFinalBillsReq,tGetFinalBillsRes>("game/getfinalbills")
	export type tGetFinalBillsReq = {
		roomID?:number,
		userID?:number,
		page:number,
		limit:number,
	}
	export type tGetFinalBillsRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:RoomDefine.FinalBillData[],
	}
}