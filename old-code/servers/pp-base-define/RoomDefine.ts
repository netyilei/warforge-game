

export namespace RoomDefine {
	export type RoomData = {
		roomID:number
		boxCode?:string
		gameData:GameData

		groupID?:number,
		boss?:{
			userID?:number
			deviceID?:string
			deviceUUID?:string
		},
		club?:{
			clubID:number,
			templateID?:number,
		}
		matchID?:number,
		roomType:RoomType
		createTimestamp:number
		createDate:string
	}

	export enum RoomType {
		Custom,
		Group,
		Club,
		Match,
	}

	export enum RemoveType {
		NormalEnd,
		Jiesan,
		System,
		Error,

		BossJiesan,

		GM = 100,
		Match,
		MatchForce,
		MatchCombine,
	}

	export enum PayType {
		Item = 1,
		Club,
		Match,
	}

	export enum DeskCostType {
		None = 0,
		EveryJu = 1,
		FirstJu = 2,
		RoundEnd = 3,
	}

	export function getPayType(payType:number) {
		return payType >> 28 & 0x0F
	}

	export function getPayIndex(payType:number) {
		return payType & 0x0FFFFFFF
	}

	export function parsePayType(payType:number) {
		return {
			payType:getPayType(payType),
			payIndex:getPayIndex(payType),
		}
	}

	export function parsePayTypeItemID(payType:number) {
		return {
			payType:getPayType(payType),
			itemID:String(getPayIndex(payType)),
		}
	}
	export function parsePayTypeClub(payType:number) {
		return {
			payType:getPayType(payType),
			valueIndex:getPayIndex(payType),
		}
	}

	export function makePayType(payType:number,payIndex:any) {
		payIndex = Number.parseInt(payIndex)
		return payType << 28 | payIndex
	}

	export enum RoomStatus {
		None,
		Wait,
		Start,
		JuEnd,
		End,
	}
	export type RoomRealtime = {
		roomID:number,
		gameData:RoomDefine.GameData,
		boxCode?:string,
		groupID?:number,
		clubID?:number,
		matchID?:number,
		templateID?:number,
		status:RoomStatus,
		layerName?:string,
		nodeName?:string,
		gsName?:string,
		gsTimestamp?:number,
		roundStartTimestamp?:number,
		users:UserRealtime[],
	}

	export type UserRealtime = {
		userID?:number
		chairNo:number
		score:string
	}

	export type GameData = {
		gameID:number,
		bSets:number[],
		iSets:number[],
	}

	export type IDChairNo = {
		userID:number,
		chairNo:number
	}

	export type BillData = {
		billID?:number,
		roomID:number,
		clubID:number,
		groupID:number,
		matchID:number,
		juCount:number,
		gameData:GameData,
		users:{
			nickName:string,
			iconUrl:string,
			sex:number,
			chairNo:number,
			userID:number,
			score:string,		// 最后剩余
			scoreChanged:string,// 输赢
			scoreCharge:string,	// 入场总充值
			fee:string,			// 抽水
		}[],
		startTimestamp:number,
		startDate:string,
		endTimestamp:number,
		endDate:string,
		datas:any[],
	}

	export type FinalBillData = {
		billID?:number,
		roomID:number,
		clubID:number,
		groupID:number,
		matchID:number,
		juCount:number,
		gameData:GameData,
		users:{
			nickName:string,
			iconUrl:string,
			sex:number,
			chairNo:number,
			userID:number,
			score:string,		// 最后剩余
			scoreChanged:string,// 输赢
			scoreCharge:string,	// 入场总充值
			fee:string,			// 抽水
		}[],
		removeType:RemoveType,
		startTimestamp:number,
		startDate:string,
		endTimestamp:number,
		endDate:string,
		datas:any[],
	}

	export type UserRoomSerial = {
		roomID:number,
		juCount:number,
		userID:number,
		chairNo:number,
		scoreChanged:string,
		scoreLast:string,
		fee:number,
		reason?:string,

		timestamp:number,
		date:string,
	}

	export type RoomCreateRecord = {
		roomID:number,
		roomData:RoomData,
		reason?:string,
		createTimestamp:number
		createDate:string
	}

	export type ExtValueEarn = {
		roomID:number,
		roomData:RoomData,

		value:string,
		itemID?:string,
		valueIndex?:number,
		data?:any,

		timestamp:number,
		date:string,
	}

	// 牌局回顾数据
	export type GameStepRecord = {
		gameID:number,
		roomID:number,
		juCount:number,
		data:any,
		timestamp:number,
		date:string,
	}

	export type FupanRecord = {
		roomID:number,
		juCount:number,
		content:string,
		timestamp:number,
		date:string,
	}

	export type UserScore = {
		userID:number,
		chairNo:number,
		score:string,
		scoreChanged:string,
		charge:string,
		fee:string,
	}

	export type tRoomRpcUserScoreChanged = {
		userID:number,
		chairNo:number,
		score:number | string
	}

	export type RobotSupport = {
		roomID:number,
		clubID?:number,
		groupID?:number,
		itemID?:string,
		valueIndex?:number,
		minValue:number,
		maxValue:number,
	}
}

export const RoomSystemRule = 9
/** 玩法无法主动进入 */
export const RoomSystemRule_UserCannotEnterBySelf = 1 << 0
