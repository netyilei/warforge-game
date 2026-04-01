import { baseService } from "kdweb-core/lib/service/base";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { kds } from "../../pp-base-define/GlobalMethods";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { UserFlag } from "../../src/UserFlag";
import { UserFlagDefine } from "../../pp-base-define/UserFlag";
import { Log } from "../log";
import { Module_UserRoomID } from "../../pp-base-define/DM_UserDefine";
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";


let db = DB.get()
let redis = DB.getRedis()
export namespace TestService {
	export async function createRoom(userID:number,params:{
		gameData:RoomDefine.GameData,
	}) {
		let roomData:RoomDefine.RoomData = await Rpc.center.callException(kds.room.create.system,params.gameData)
		if(roomData) {
			await redis.set("t_test_room_id",String(roomData.roomID))
		}
		return {
			roomData
		}
	}

	export async function getRooms(userID:number,params:{
		
	}) {
		let roomID = Number(await redis.get("t_test_room_id"))
		let index:any = {roomID}
		let roomIDs:number[] = (await Module_RoomData.getOption(index,{
			projection:{
				roomID:1,
			},
		}) || []).map(v=>v.roomID)

		let roomRealtimes:RoomDefine.RoomRealtime[] = await Module_RoomRealtime.get({roomID:{$in:roomIDs}}) || []
		let roomDatas:RoomDefine.RoomData[] = await Module_RoomData.get({roomID:{$in:roomRealtimes.map(v=>v.roomID)}}) || []
		let datas = roomDatas.map(v=>{
			return {
				data:v,realtime:roomRealtimes.find(v=>v.roomID == v.roomID)
			}
		})
		return {
			datas,
			selfRoomID:await UserFlag.get(userID,UserFlagDefine.RoomID),
			selfRoomIDs:(await Module_UserRoomID.get({userID})).map(r=>r.roomID),
		}
	}
	
	export async function jiesanRoom(userID:number,params:{
		roomID?:number,
	}) {
		
		let roomID = 0
		if(params.roomID) {
			roomID = params.roomID
		} else {
			roomID = Number(await redis.get("t_test_room_id"))
		}
		if(roomID) {
			await Rpc.center.callException(kds.room.remove,roomID)
			return {}
		}
		// let rooms:RoomDefine.RoomData[] = await db.get(DBDefine.tableRoom,{})
		// for(let room of rooms) {
		// 	await Rpc.center.callException(kds.room.remove,room.roomID)
		// }
		return {}
	}

	export async function addValue(userID:number,params:{
		itemID:string,
		value:string,
	}) {
		await Rpc.center.callException(kds.item.add,userID,params.itemID,params.value)
		return {}
	}

}