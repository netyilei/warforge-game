import { tCard, tCardArray } from "../pp-base-define/CardDefine"
import { GSCommonMsg } from "../pp-game-base/GSCommonMsg"
import { TexasUserPlayingStatus } from "./TexasRealtime"


export namespace TexasDefine {
	export enum BetType {
		Abandon,
		Check,
		Bet,
		Call,
		Raise,
		Allin,

		Ante,	//
		SB,
		BB,
		FB,		// 补盲

		Straddle,
	}

	export enum DealType {
		Di,
		Flop,
		Turn,
		River,
		ResultShow,
		UserShow,
		Allin,
	}

	export enum PositionType {
		D,
		Gun,
		SB,
		BB,
	}

	export enum CardType {
		High,
		Pair,
		DoublePair,
		Three,
		Straight,
		Flush,
		FullHouse,
		Four,
		StraightFlush,

		Flag_TypePower 	= 0xF0000000,
		Flag_Type 		= 0x0F000000,
		Flag_Power 		= 0x00FFFFFF,
	}

	export function getCardType(cardType) {
		return (cardType & CardType.Flag_Type) >> 24
	}
	export function getCardPower(cardType) {
		return cardType & CardType.Flag_Power
	}
	export function getCardTypePower(cardType) {
		return (cardType & CardType.Flag_TypePower) >> 28
	}
	export function makeCardType(cardType:number,cardTypePower:number,power:number) {
		return (cardTypePower << 28) | (cardType << 24) | power
	}

	export const PlayAction_JuCount 	= "ju_count"	// 参与局数
	export const PlayAction_PreEnter 	= "pre_enter"	// 翻前入池
	export const PlayAction_WinCount 	= "win_count"	// 赢的局数
	export const PlayAction_Gift 		= "gift_count"	// 礼物数

	// 牌局回顾数据
	export type tGameStepRecordData = {
		users:{
			userID:number,
			chairNo:number,
			positions:TexasDefine.PositionType[]
		}[],
		phases:{
			phase:TexasGamePhase,
			users:{
				chairNo:number,
				value:string,
				status:TexasUserPlayingStatus,
			}[]
		}[],
		cards:{
			chairNo?:number,	// 公共牌chairNo == -1 && userID == null
			cards:tCardArray,
		}[],
		results:{
			chairNo:number,
			scoreChanged:string,
		}[],
	}
}

export namespace TexasUserMsg {
	export type tGameStartData = {
		users:{
			chairNo:number,
			position:TexasDefine.PositionType,
		}[]
	}

	export type tSyncData = {
		users:{
			chairNo:number,
			cards:tCardArray,
			position:TexasDefine.PositionType,
			showCards?:boolean,
		}[],
		phase?:TexasGamePhase,
		buyin?:GSCommonMsg.tBuyinOrStandNT,
		betTurnNT?:GSCommonMsg.tBetTurnNT,

		pool:tTexasPoolManagerSync
	}

	export type tTexasPoolSync = {
		serialNo:number 
		phase:number
		users:{
			chairNo:number,
			value:string,
			betType:number,
		}[]
		finished:boolean
		tagChairNo:number 
		tagValue:string
		totalValue:string
	}

	export type tTexasPoolManagerSync = {
		stacks:tTexasPoolSync[]
		playingChairNos:number[]
		serialNo:number
		phase:number
		phasePoolStartIdx:number

		userTypes:{
			chairNo:number,
			lastType:TexasDefine.BetType,
			phaseType:TexasDefine.BetType,
		}[]
	}

	export let PhaseChange = "GCM_T_PhaseChange"
	export type tPhaseChangeNT = {
		phase:TexasGamePhase
	}

}

export namespace TexasRule {
	export const Group0 = 0
	export const Group0_ANTE = 1 << 0	

	// 互斥
	export const Group0_DoubleBB = 1 << 1	// 双大盲
	export const Group0_Straddle = 1 << 2	// 抓位

	export const Group1 = 1
	export const Group1_Long = 1 << 0	// 长牌
	export const Group1_Short = 1 << 1	// 短牌

	export const Group2 = 2 

	export const Group3_Timeout = 3	// 操作超时
	export const Group4_LastSeconds = 4	// 持续分钟数

	export const Group5_ANTE = 5
	export const Group6_SBlind = 6		// 小盲一定是大盲的一般，即时是双大盲
	export const Group7_MinBuyin = 7
	export const Group8_MaxBuyin = 8
	export const Group9_Straddle = 9		// 抓位金额

}

export enum TexasGamePhase {
	Ante,
	BB,
	Pre,
	Flop,
	Turn,
	River,
	Show,
}