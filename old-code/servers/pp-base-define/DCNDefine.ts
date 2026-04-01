// import { ItemDefine } from "./ItemDefine"
// import { LoginLobbyDefine } from "./LoginLobbyDefine"
// import { UserDefine } from "./UserDefine"

// export namespace DCNDefine {
// 	export const MsgName = "DCN_Changed"
// 	export type MsgType = {
// 		dkey:string,
// 		data:any,
// 	}
// }

// export namespace DCNKey {
// 	export enum UserChangedType {
// 		Add,
// 		Remove,
// 	}
// 	export type tCommonActiveUserCount = {
// 		count:number,
// 	}
// 	export type tCommonUserChanged = {
// 		userID:number,
// 		type:UserChangedType,

// 		roomID?:number,
// 	}
// 	export namespace User {
// 		export type tOnline = {
// 			time:number,
// 		}
// 		export function online(userID:number) {
// 			return "dcn/user/online/" + userID
// 		}
// 	}
// 	export namespace Group {
// 		export function activeUserCount(groupID:number) {
// 			return "dcn/group/" + groupID + "/activeUserCount"
// 		}
// 		export function playingUserCount(groupID:number) {
// 			return "dcn/group/" + groupID + "/playingUserCount"
// 		}
// 		export function userChanged(groupID:number) {
// 			return "dcn/group/" + groupID + "/userChanged"
// 		}
// 	}

// 	export namespace User {
// 		export type tItemChanged = {
// 			addItems?:ItemDefine.ItemSimpleData[]
// 			removeItems?:ItemDefine.ItemSimpleData[]
// 			hide?:boolean,
// 		}
// 		export function itemChanged() {
// 			return "dcn/user/item"
// 		}

// 		export function loginDataChanged() {
// 			return "dcn/user/login"
// 		}

// 		export type tGameRecordChanged = UserDefine.UserGameRecordData
// 		export function gameRecordChanged() {
// 			return "dcn/user/gamerecord"
// 		}

// 		export function userInfoChanged() {
// 			return "dcn/user/userInfo"
// 		}

// 		export type tExpLevelChanged = {
// 			prevLevel:number,
// 			prevExp:number,
// 			level:number,
// 			exp:number,
// 		}
		
// 		export function expLevelChanged() {
// 			return "dcn/user/expLevel"
// 		}

// 		export function buffChanged() {
// 			return "dcn/user/buff"
// 		}
		
// 		export type tNewMail = {
// 			b:boolean
// 		}
// 		export function newMail() {
// 			return "dcn/user/bewNauk"
// 		}

// 		export type tNewOrder = {
// 			b:boolean,
// 		}
// 		export function newOrder() {
// 			return "dcn/user/newOrder"
// 		}

// 	}
// }