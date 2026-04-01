import { ItemDefine } from "./ItemDefine"
import { RoomDefine } from "./RoomDefine"


export namespace LoginLobbyDefine {
	export type OtherConfigType = {
		userPort:number,
		userHost:string,
	}

	export type AKUserInfo = {
		userID:number,
		sk:string,
	}

	export enum ActionRoomType {
		Group,	// 匹配
		Club,
		Match,
		Custom,
	}
	// 动作类型
	export enum ActionType {
		Special,	// targetStr == GameSpecialAction
		PlayJu,		// 玩一局
	}

	export type tAction = {
		no?:number,				// 配置的时候不需要传递
		gameID?:number,
		roomTypes?:ActionRoomType[],
		type:ActionType,
		targetStr?:string,
		targetCount?:number,
	}


	export enum UserActionRealtimeType {
		Lottery,
		Task,
	}
	export type tUserActionRealtime = {
		userID:number,
		no:number,
		type:UserActionRealtimeType,
		
		count:number,
		complete:boolean,
		gain:boolean,

		createTime:number,
		createDate:string,
		daily?:boolean,
		dailyDate?:string,
	}

	export type tLotteryItem = {
		power:number,		// 权重
		itemID:string,
		count:number,
	}

	export type tLotteryReward = {
		action:tAction,			// 动作
		times:number,			// 每次完成奖励的大转盘次数
		limitCount:number,		// 每天最多可以完成几次
		lifeTimeCount:number,	// 一个账号最多几次
	}

	export type tUserLotteryRewardCache = {
		userID:number,
		completeActions:{
			no:number,
			count:number,
		}[]
	}

	export type tLotteryConfig = {
		// 每天免费次数
		freeTimes:number,
		// 奖励
		rewards:tLotteryReward[],
		items:tLotteryItem[],
	}

	// 大转盘内部控制
	export type tLotteryControl = {
		items:{
			idx:number,				// tLotteryConfig.items的索引
			enabled:boolean,		// 是否能随机的出来
			powerOffset:number,		// 权重偏移
			targetUserIDs?:number[], // 给指定的人随机
		}[]
	}

	export type tUserLottery = {
		userID:number,
		date:string,
		count:number,
		maxCount:number,
		// 奖励完成情况
		rewards:{
			actionNo:number,
			completeCount:number,	// 次数
			totalAddCount:number,	// 增加的转盘次数
		}[]

		lastTimestamp:number,
		lastDate:string,
	}

	export type tCheckin = {
		maxDayCount:number,
		loop?:boolean,			// 到最后一天的时候是否从第一天开始
		lastRepeat?:boolean,	// 当loop == false时最后一天的是否可以重复领取
		items:{
			dayCount:number,
			itemID:string,
			count:number,
		}[],
		monthItems:{
			dayCount:number,
			itemID:string,
			count:number,
		}[]
	}

	export type tUserCheckin = {
		userID:number,
		dayCount:number,	// 当前连续天数
		lastDate:string,	// 最后一次签到
		nextDate:string,	// 下一次签到
		curMonthDate:string,	// 当前月
		curMonthDays:number[],	// 当前月签到
	}

	export enum TaskExpireType {
		Daily,
		Forever,
	}
	export type tTask = {
		no:number,
		name:string,
		desc:string,
		prevNo?:number,		// 是否有前置
		enabled:boolean,
		expireType:TaskExpireType,
		action:tAction,
		rewards:{
			itemID:string,
			count:number,
		}[]
	}

	export enum ProcessActionType {
		Special,
		Game,
	}
	export type tProcessAction = {
		no:number,
		targetStr?:string,
		targetCount?:number,
		userID?:number,
		gameData?:RoomDefine.GameData,
		bill?:RoomDefine.BillData,
		finalBill?:RoomDefine.FinalBillData,

		timestamp:number,
		date:string,
	}

	export namespace GameSpecialAction {
		export const GAME101_ActionAllIn = "GAME101_ActionAllIn"
	}
}