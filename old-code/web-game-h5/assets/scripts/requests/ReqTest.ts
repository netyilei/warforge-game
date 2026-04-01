import { CoreFunctionals } from "../core/CoreFunctionals"
import { ClubDefine } from "../ServerDefines/ClubDefine"
import { GroupDefine } from "../ServerDefines/GroupDefine"
import { ItemDefine } from "../ServerDefines/ItemDefine"
import { RoomDefine } from "../ServerDefines/RoomDefine"
import { UserDefine } from "../ServerDefines/UserDefine"


export namespace ReqTest {
	export let createRoom = CoreFunctionals.reqAK<tCreateRoomReq,tCreateRoomRes>("test/createroom")
	export type tCreateRoomReq = {
		gameData:RoomDefine.GameData
	}
	export type tCreateRoomRes = {
		errCode?:number,
		errMsg?:string,

		roomData:RoomDefine.RoomData,
	}

	export let jiesanRoom = CoreFunctionals.reqAK<tJiesanRoomReq,tJiesanRoomRes>("test/jiesanroom")
	export type tJiesanRoomReq = {
		roomID?:number,
	}
	export type tJiesanRoomRes = {
		errCode?:number,
		errMsg?:string,
	}
	
	export let getRooms = CoreFunctionals.reqAK<tGetRoomsReq,tGetRoomsRes>("test/getrooms")
	export type tGetRoomsReq = {
	}
	export type tGetRoomsRes = {
		errCode?:number,
		errMsg?:string,
		datas:{
			data:RoomDefine.RoomData,
			realtime:RoomDefine.RoomRealtime,
		}[],
		selfRoomID:number,
	}

	export let addValue = CoreFunctionals.reqAK<tAddValueReq,tAddValueRes>("test/addvalue")
	export type tAddValueReq = {
		itemID:string,
		value:string,
	}
	export type tAddValueRes = {
		errCode?:number,
		errMsg?:string,
	}
}