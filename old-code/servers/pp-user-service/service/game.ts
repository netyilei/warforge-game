import { kdasync } from "kdweb-core/lib/tools/async"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { DB } from "../../src/db"


let db = DB.get()
let redis = DB.getRedis()
export namespace LobbyGameService {
	export async function getGameStepRecord(userID:number,params:{
		roomID:number,
		page:number,
		limit:number,
	}) {
		let datas:RoomDefine.GameStepRecord[]
		let count:number = 0
		if(params.page != null && params.limit != null ) {
			let index = {
				roomID:params.roomID
			}
			count = await db.getCount(DBDefine.tableGameStepRecord,index)

			if(params.page == 0 && params.limit == 1) {
				datas = []
			}else{
				
				datas = await db.getOption(DBDefine.tableGameStepRecord,index,{
					skip:params.page == 0 ? 0 : params.page * params.limit - 1,
					limit:params.page == 0 ? params.limit - 1 : params.limit,
					sort:{
						juCount:-1
					}
				}) || []
			}
			
		} else {
			datas = []
		}
		let cur:RoomDefine.GameStepRecord = await redis.hget(DBDefine.rTableGameStepRecord,String(params.roomID),true)
		if(cur) {
			
			if(!params.page || params.page == 0) {
				datas.splice(0,0,cur)
			}
			count++;
		}
	
		return {
			datas,
			count,
		}
	}

	export async function getFupanData(userID:number,params:{
		roomID:number,
		juCount:number,
	}) {
		let data:RoomDefine.FupanRecord = await db.getSingle(DBDefine.tableFupan,{roomID:params.roomID,juCount:params.juCount})
		if(!data) {
			await kdasync.timeout(1000)
		}
		return {
			data
		}
	}

	export async function getGameUserScores(userID:number,params:{
		roomID:number
	}){
		let list_:RoomDefine.UserScore[] = await redis.hget(DBDefine.tableRoomUserScores,String(params.roomID),true)
		return {
			datas:list_ || [],	
		}
	}


	export async function getBills(userID:number,params:{
		roomID?:number,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.roomID != null) {
			index.roomID = params.roomID
		} else {
			index["users.userID"] = userID
		}
		let count = await db.getCount(DBDefine.tableBill,index)
		let datas = await db.getOption(DBDefine.tableBill,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				billID:-1,
			}
		}) || []
		return {
			count,
			datas,
		}
	}

	export async function getFinalBills(userID:number,params:{
		roomID?:number,
		userID?:number,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		index["users.userID"] = params.userID || userID
		if(params.roomID != null) {
			index.roomID = params.roomID
		}
		let count = await db.getCount(DBDefine.tableRoundBill,index)
		let datas = await db.getOption(DBDefine.tableRoundBill,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				billID:-1,
			}
		}) || []
		return {
			count,
			datas,
		}
	}
}