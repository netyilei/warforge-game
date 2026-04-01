import { UserDefine } from "./UserDefine"


export namespace ItemDefine {
	export type tItem = {
		id:string,
		uuid?:string,
		count:string,
		expire?:number,
	}
	export type tBag = {
		userID:number,
		items:tItem[],
	}

	export enum Type {
		Normal,
		Title,		// 称号
		Ticket,		// 门票
	}

	export type tConfig = {
		id:string,
		name:string,
		desc:string,
		type:Type,
		overlapped:boolean,			// 是否可堆叠，不可堆叠的item有uuid
		// overlapper为true时以下两项不起作用
		expireTime:number,			// 过期时间
		expireOverlapped:boolean,	// 过期时间是否可以堆叠
	}

	export type tLock = {
		userID:number,
		clubID?:number,
		lockID:string,
		roomID?:number,
		items:{
			id:any,
			uuid?:string,
			count:string,
		}[],

		records:{
			id:any,
			count:string,
			timestamp:number,
			date:string,
		}[]
		timestamp:number,
		date:string,
	}

	export enum SerialType {
		System = 1,

		GM,
		Charge,
		Withdraw,			// 公链提现
		WithdrawFailed,		// 提现失败
		ChangeName,			// 改名
		MailAttach,
		

		GMCharge,
		GMWithdraw,

		ChargeRefund,		// 充值退款
		ChargeReward,		// 充值奖励
		Lock = 100,
		Unlock,

		Game = 200,
		Buyin,
		GameJu,				// 局内变化
		GameEnd,			// 游戏结束
		GameFee,			// 游戏费用

		Group = 400,
		EnterGroup,

		Match = 600,
		MatchSignup,
		MatchEnter,
		MatchEnd,
		MatchRank,
		MatchBuyin,
		
		Club = 800,
		
		Give,

		Receive,

		GiveFailed,

		DeskCost,		// 桌费消耗
		DeskCostEarn,	// 桌费收入
		WaterEarn,		// 抽水收入

		mail,			// 邮件


		Lobby = 1000,
		Lobby_Lottery,
		Lobby_Task,
		Lobby_Checkin,
	}

	export type tSerial = {
		no:number,
		userID:number,
		roomID?:number,
		billID?:number,
		itemID:string,
		setup?:boolean,
		changed:string,
		last:string,
		isLock?:boolean,
		lockID?:string,
		isRobot?:boolean,
		type:SerialType,
		data?:any,
		reason?:string,
		gmID?:number,
		timestamp:number,
		date:string,
	}
}

export namespace ItemID {
	export const Gold 		= "100001" 
	export const Diamond 	= "100002"
	export const USDT 		= "100003"
	export const Score 		= "100004"
}