import { baseService } from "kdweb-core/lib/service/base";
import { AdminDefine } from "../../pp-base-define/AdminDefine";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { DB } from "../../src/db";
import { GroupDefine } from "../../pp-base-define/GroupDefine";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { YDefine } from "../../pp-base-define/YDefine";
import { IDUtils } from "../../src/IDUtils";


let db = DB.get()
async function callInCheckAuth(userID:number,auth:AdminDefine.Auth,func) {
	let admin:AdminDefine.tAdmin = await db.getSingle(DBDefine.tableGMAdminUsers,{userID:userID})
	if(!auth && !admin) {
		return baseService.errJson(1,"权限不足")
	}
	if(!admin || !admin.auths.includes(auth)) {
		return baseService.errJson(1,"权限不足")
	}
	return await func()
}
export namespace AdminUserService {
	export async function getAuth(userID:number,params:{
		
	}) {
		let admin:AdminDefine.tAdmin = await db.getSingle(DBDefine.tableGMAdminUsers,{userID:userID})
		return {
			admin
		}
	}

	export async function getGroups(userID:number,params:{
		
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Group,async ()=>{
			return {
				groups:await db.get(DBDefine.tableGroupData,{})
			}
		})	
	}

	export async function createGroup(userID:number,params:{
		groupData:GroupDefine.tData
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Group,async ()=>{
			params.groupData.groupID = await IDUtils.getGroupID()
			await db.insert(DBDefine.tableGroupData,params.groupData)
			delete params.groupData["_id"]
			return {
				groupData:params.groupData
			}
		})		
	}

	export async function updateGroup(userID:number,params:{
		groupData:GroupDefine.tData
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Group,async ()=>{
			await db.update(DBDefine.tableGroupData,{groupID:params.groupData.groupID},params.groupData)
			return {}
		})		
	}


	export async function delGroup(userID:number,params:{
		groupID:number,
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Group,async ()=>{
			await db.del(DBDefine.tableGroupData,{groupID:params.groupID})
			return {}
		})		
	}

	export async function getUserLoginData(userID:number,params:{
		userID:number,
	}) {
		return await callInCheckAuth(userID,null,async ()=>{
			return {
				loginData:await db.getSingle(DBDefine.tableUserLoginData,{userID:params.userID})
			}
		})	
	}
	export async function getClubDatas(userID:number,params:{
		index?:any,
		cursor:YDefine.Cursor
	}) {
		let index = params.index || {}
		return await callInCheckAuth(userID,AdminDefine.Auth.Club,async ()=>{
			let count = await db.getCount(DBDefine.tableClubData,index)
			let datas:ClubDefine.tData[] = await db.getOption(DBDefine.tableClubData,index,{
				skip:params.cursor.from,
				limit:params.cursor.count
			}) || []
			return {
				data:<YDefine.Data>{
					cursor:{
						max:count,
						from:params.cursor.from,
						count:datas.length,
					},
					datas,
				}
			}
		})
	}
	export async function createClub(userID:number,params:{
		bossUserID:number,
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Club,async ()=>{
			let data:ClubDefine.tData = await Rpc.center.callException(kds.club.data.create,params.bossUserID)
			return {
				data
			}
		})
	}

	export async function updateClub(userID:number,params:{
		data:ClubDefine.tData
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Club,async ()=>{
			await Rpc.center.callException(kds.club.data.updateData,params.data)
			return {
			}
		})
	}
	export async function setCode(userID:number,params:{
		clubID:number,
		code:string,
	}) {
		return await callInCheckAuth(userID,AdminDefine.Auth.Club,async ()=>{
			let b = await Rpc.center.callException(kds.club.data.setCode,params.clubID,params.code)
			return {
				b
			}
		})
	}
}