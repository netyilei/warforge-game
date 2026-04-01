import { DBDefine } from "../../pp-base-define/DBDefine";
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine";
import { DB } from "../../src/db";


let db = DB.get()
let redis = DB.getRedis()
export namespace LobbyUserAction {
	export async function checkin(userID:number,params:{
		
	}) {
		
	}

	export async function getCheckin(userID:number,params:{
		
	}) {
		return {
			checkin:<LoginLobbyDefine.tUserCheckin>await db.getSingle(DBDefine.tableUserCheckin,{userID})
		}
	}
}