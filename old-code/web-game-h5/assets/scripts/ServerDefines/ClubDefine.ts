import { ItemDefine } from "./ItemDefine"
import { RoomDefine } from "./RoomDefine"


export namespace ClubDefine {
	export type tFull = {
		data:tData,
		setting:tSetting,
		templates:tRoomTemplate[],
	}
	export type tData = {
		clubID:number,
		code:string,
		bossUserID:number,

		name:string,
		desc:string,
		iconUrl:string,
	}

	export enum ClubMode {
		Normal,
	}

	export enum ClubInviteMode {
		Invite 	= 0x001,	// 可以邀请
		Req 	= 0x100,	// 可以申请

		Both 	= 0x101,	// 两者
	}
	export type tSetting = {
		clubID:number,
		autoDesk:boolean,				// 自动开桌
		mode:ClubMode,					// 模式
		invite:ClubInviteMode,			// 邀请模式
		adminAcceptReq:boolean,			// 管理员可以同意申请
		adminCreateTemplate:boolean,	// 管理员可以调整模板
		adminCreateRoom:boolean,		// 管理员可以开桌
	}

	export type tUserAccount = {
		clubID:number,
		userID:number,
		values:string[],	// ValueIndex
	}

	export enum MemberType {
		Boss,
		Normal,

		Promote_Normal,		// 普通合伙人
		Promote_Super,		// 超级合伙人
	}

	export enum JobType {
		None,
		Admin,
	}
	export type tUserMember = {
		clubID:number,
		userID:number,
		leaderUserID:number,

		type:MemberType,
		job:JobType,
		joinTimestamp:number,
	}

	export type tUserRelation = {
		clubID:number,
		userID:number,
		leaders:number[],	// 由近及远的上级链条
		subs:number[],		// 所有直接下级
	}

	export type tDeskCostRelation = {
		clubID:number,
		leaderUserID:number,
		subUserID:number,
		gameID:number,
		giveRate:number,
		isPercent:boolean,
	}

	export enum ValueIndex {
		Gold,
		Diamond,
		USDT,
		Score,
	}

	export type tSerial = {
		no:number,
		userID:number,
		clubID:number,
		valueIndex:number,
		setup?:boolean,
		changed:string,
		last:string,
		type:ItemDefine.SerialType,
		data?:any,
		reason?:string,
		gmID?:number,
		timestamp:number,
		date:string,
	}

	export enum MemberRecordType {
		Join,
		Req,
		Accept,

		Invite,
		Agree,

		Remove,
	}
	export type tMemberRecord = {
		no:number,
		userID:number,
		fromUserID:number,
		type:MemberRecordType,
		
		reason?:string,
		data?:any,
		timestamp:number,
		date:string,
	}
	export type tRoomTemplate = {
		templateID:number,
		clubID:number,
		name:string,
		desc:string,
		gameData:RoomDefine.GameData,
		userID?:number,

		timestamp:number,
		date:string,
	}

	export type tMemberInvite = {
		clubID:number,
		userID:number,
		toUserID:number,
		expireTime?:number,
		userReason?:string,
		timestamp:number,
		date:string,
		mailID?:string,
	}

	export type tMemberReq = {
		clubID:number,
		userID:number,
		expireTime?:number,
		userReason?:string,
		timestamp:number,
		date:string,
	}

	export type tReward = {
		clubID:number,
		planID:number,
	}

	export type DeskCost = {
		clubID:number,
		tID:number,
		userID:number,
		targetUserID:number,
		num:number,
		max:number,
	}
}