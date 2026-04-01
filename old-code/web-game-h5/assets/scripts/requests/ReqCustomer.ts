import { CoreFunctionals } from "../core/CoreFunctionals"
import { CustomerDefine } from "../ServerDefines/CustomerDefine"

export namespace ReqCustomer {
	export let startChat = CoreFunctionals.reqCustomer<tStartChatReq,tStartChatRes>("user/startchat")
	export type tStartChatReq = {
	}
	export type tStartChatRes = {
		errCode?:number,
		errMsg?:string,

		room:CustomerDefine.tRoom,
	}

	export let getRooms = CoreFunctionals.reqCustomer<tGetRoomsReq,tGetRoomsRes>("user/getrooms")
	export type tGetRoomsReq = {
	}
	export type tGetRoomsRes = {
		errCode?:number,
		errMsg?:string,
	}

	export let getRoom = CoreFunctionals.reqCustomer<tGetRoomReq,tGetRoomRes>("user/getroom")
	export type tGetRoomReq = {
		roomID:number,
	}
	export type tGetRoomRes = {
		errCode?:number,
		errMsg?:string,

		room:CustomerDefine.tRoom,
	}

	export let getChats = CoreFunctionals.reqCustomer<tGetChatsReq,tGetChatsRes>("user/getchats")
	export type tGetChatsReq = {
		roomID:number,
		msgID?:number,
		page:number,
		limit:number,
	}
	export type tGetChatsRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:CustomerDefine.tChat[],
	}
}