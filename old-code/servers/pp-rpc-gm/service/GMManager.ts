import { baseService } from "kdweb-core/lib/service/base"
import { ClubDefine } from "../../pp-base-define/ClubDefine"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { kds } from "../../pp-base-define/GlobalMethods"
import { GroupDefine } from "../../pp-base-define/GroupDefine"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { YDefine } from "../../pp-base-define/YDefine"
import { DB } from "../../src/db"
import { IDUtils } from "../../src/IDUtils"
import { Rpc } from "../rpc"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "../../src/TimeDate"
import { RewardDefine } from "../../pp-base-define/RewardDefine"
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine"
import { GlobalUtils } from "../../src/GlobalUtils"

let db = DB.get()
export namespace GMManager {
	
	export async function getGroups(userID:number,params:{
		
	}) {
		let groups:GroupDefine.tData[] = await db.get(DBDefine.tableGroupData,{}) || []
		groups.sort((a,b)=>a.gameID * 100000 + a.groupID - (b.gameID * 100000 + b.groupID))
		let waters:RewardDefine.tGroupWater[] = await Promise.all(groups.map(v=>GlobalUtils.getGroupWater(v.groupID)))
		return {
			groups,
			waters,
		}
	}

	export async function createGroup(userID:number,params:{
		groupData:GroupDefine.tData,
		water?:RewardDefine.tGroupWater,
	}) {
		params.groupData.groupID = await IDUtils.getGroupID()
		params.groupData.timestamp = kdutils.getMillionSecond()
		params.groupData.date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		await db.insert(DBDefine.tableGroupData,params.groupData)
		delete params.groupData["_id"]
		if(params.water) {
			params.water.groupID = params.groupData.groupID
			await GlobalUtils.setGroupWater(params.water)
		}
		return {
			groupData:params.groupData,
			water:await GlobalUtils.getGroupWater(params.groupData.groupID),
		}
	}

	export async function updateGroup(userID:number,params:{
		groupData:GroupDefine.tData
	}) {
		await db.update(DBDefine.tableGroupData,{groupID:params.groupData.groupID},params.groupData)
		return {}
	}

	export async function updateGroupWater(userID:number,params:{
		water:RewardDefine.tGroupWater,
	}) {
		await GlobalUtils.setGroupWater(params.water)
		return {}
	}


	export async function delGroup(userID:number,params:{
		groupID:number,
	}) {
		await db.del(DBDefine.tableGroupData,{groupID:params.groupID})
		await GlobalUtils.delGroupWater(params.groupID)
		return {}
	}

	export async function getUserLoginData(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.userID) {
			index.userID = params.userID
		} else if(params.userIDs) {
			index.userID = {
				$in:params.userIDs
			}
		}
		let count = await db.getCount(DBDefine.tableUserLoginData,index)
		let datas:UserDefine.tLoginData[] = await db.getOption(DBDefine.tableUserLoginData,index,{
			skip:params.page * params.limit,limit:params.limit
		})
		return {
			datas,
			count:count,
		}
	}

	export async function getAllRooms(userID:number,params:{
		groupID?:number,
		matchID?:number,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.groupID != null) {
			index.groupID = params.groupID
		}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		let skip = params.page * params.limit
		let limit = params.limit
		let count = await Module_RoomData.getCount(index)
		let roomIDObjs:{roomID:number}[] = await Module_RoomData.getOption(index,{
			projection:{
				roomID:1,
			},
			skip:skip,limit:limit
		})
		let roomIDs = roomIDObjs.map(v=>v.roomID)
		let roomRealtimes:RoomDefine.RoomRealtime[] = await Module_RoomRealtime.getOption({roomID:{$in:roomIDs}}) || []
		let roomDatas:RoomDefine.RoomData[] = await Module_RoomData.getOption({roomID:{$in:roomRealtimes.map(v=>v.roomID)}}) || []
		let datas = roomDatas.map(v=>{
			return {
				data:v,realtime:roomRealtimes.find(v=>v.roomID == v.roomID)
			}
		})
		return {
			datas,
			count,
		}
	}


	export async function jiesanRoom(userID:number,params:{
		roomID:number,
		removeType:RoomDefine.RemoveType
	}) {
		let b = await Rpc.center.callException(kds.room.remove,params.roomID,params.removeType != null ? params.removeType : RoomDefine.RemoveType.GM)
		if(!b) {
			return baseService.errJson(1,"解散失败")
		}
		return {}
	}
}