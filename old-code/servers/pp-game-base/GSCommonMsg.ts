import { tCard, tCardArray } from "../pp-base-define/CardDefine"


export namespace GSCommonMsg {
	export let Bet = "GSC_CM_Bet"
	export type tBetReq = {
		value:string,
		type?:number,
	}
	export type tBetNT = {
		bets:{
			chairNo:number,
			value:string,
			type:number,
		}[]
	}

	export let BetTurn = "GSC_CM_BetTurn"
	export type tBetTurnNT = {
		chairNo:number,
		prevValue:string,
		prevChairNo:number,
		maxValue:string,
		timeoutSec:number,
	}

	export let BetReturn = "GSC_CM_BetReturn"
	export type tBetReturnNT = {
		chairNo:number,
		value:string,
	}

	export let Deal = "GSC_CM_Deal"
	export type tDealNT = {
		deals:{
			type:number,
			chairNo?:number,
			cards:tCard[],
		}[]
	}

	export let Buyin = "GSC_CM_Buyin"
	export type tBuyinReq = {
		score:string,

		toChairNo?:number,	// 买入坐下
	}
	export type tBuyinRes = {
		b:boolean,
	}

	export let BuyinCancel = "GSC_CM_BuyinCancel"
	export type tBuyinCancelRes = {
		chairNo:number,
	}

	export let BuyinOrStand = "GSC_CM_BuyinOrStand"
	export type tBuyinOrStandNT = {
		chairNo:number,
		minValue?:string,
		maxValue?:string,
		timeoutSec:number,

		minNeed?:string,
	}

	export let Wait = "GSC_CM_Wait"
	export type tWaitNT = {
		users?:{
			chairNo:number,
			timeoutSec:number,
		}[]
	}

	export let GameResult = "GSC_CM_GameResult"
	export type tGameResultNT = {
		users:{
			chairNo:number,
			userID:number,
			scoreChanged:string,
			score:string,
			cards?:tCardArray,
			data?:any,
		}[]

		data?:any,
	}
}