export namespace CustomerDefine {
	export type tChat = {
		msgID:number,

		userID:number,
		from:boolean,
		roomID:number,

		type:ChatType
		content:string,
		data?:any,

		timestamp:number,
		date:string,
	}

	export type tRoom = {
		roomID:number,
		fromUserID:number,
		toUserID:number,

		fromStatus:RoomUserStatus,
		toStatus:RoomUserStatus,

		lastMsgID:number,

		createTimestamp:number,
		date:string,
	}

	export enum RoomUserStatus {
		None,
		Online,
		Offline,
	}

	export enum ChatType {
		Text,
		Emoji,
		Image,
		Voice,
		Video,
		File,
	}

	export type WSUserFlag = {
		rpcName:string,
		internalHost:string,
	}

	export type tRpcGetChatHostRes = {
		wsHost:string,
		httpHost:string,
	}
}

export namespace CustomerMsgDefine {
	export const Heart = "CMD_Heart"
	export const SimpleHeart = "CMDH"
	export const Login = "CMD_Login"
	export const LoginConsole = "CMD_LoginConsole"
	export type tLoginReq = {
		ak:string,
	}

	export type tLoginRes = {
		success:boolean,

		roomID?:number,
		roomIDs?:number[],
	}

	export let RoomChanged = "CMD_RoomChanged"
	export type tRoomChangedNT = {
		roomID?:number,
		roomIDs?:number[],
		fromUserID?:number,
	}

	export let SendChat = "CMD_SendChat"
	export type tSendChatReq = {
		roomID:number,
		content:string,
		data?:any,
		type:CustomerDefine.ChatType,
	}
	export type tSendChatRes = {
		msgID:number,
	}

	export let Chat = "CMD_Chat"
	export type tChatNT = {
		chat:CustomerDefine.tChat,
	}
}