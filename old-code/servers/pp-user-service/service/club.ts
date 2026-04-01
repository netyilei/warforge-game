import { baseService } from "kdweb-core/lib/service/base";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { kds } from "../../pp-base-define/GlobalMethods";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { LoginHeler } from "../../pp-login/helper/loginHelper";
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";

let db = DB.get()
export namespace ClubService {
	export async function getRooms(userID:number,params:{
		clubID:number,
		roomID?:boolean,	// 只要roomID
		page?:number,		// 必须和limit同时使用
		limit?:number,
	}) {
		let b = await Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)
		if(!b) {
			return baseService.errJson(1,"没有权限")
		}
		let roomIDObjs:{roomID:number}[] = await Module_RoomData.getOption({"club.clubID":params.clubID},{
			projection:{
				roomID:1,
			}
		})

		let roomIDs = roomIDObjs.map(v=>v.roomID)

		if(params.roomID) {
			return {
				roomIDs
			}
		}
		if(params.page != null && params.limit != null) {
			// let roomDatas:RoomDefine.RoomData[] = await dbRoom.getOption(DBDefine.tableRoom,{roomID:{$in:roomIDs}},{
			// 	skip:params.skip,limit:params.limit
			// }) || []
			let roomRealtimes:RoomDefine.RoomRealtime[] = await Module_RoomRealtime.getOption({roomID:{$in:roomIDs}},{
				skip:params.page*params.limit,limit:params.limit
			}) || []
			
			return {
				// roomDatas,
				roomRealtimes,
			}
		}

		// let roomDatas:RoomDefine.RoomData[] = await dbRoom.get(DBDefine.tableRoom,{roomID:{$in:roomIDs}}) || []
		let roomRealtimes:RoomDefine.RoomRealtime[] = await Module_RoomRealtime.getOption({roomID:{$in:roomIDs}}) || []
		return {
			// roomDatas,
			roomRealtimes,
		}
	}

	export async function getUserClubDatas(userID:number,params:{

	}) {
		let clubIDs = (await db.getOption(DBDefine.tableClubMember,{userID:userID},{
			projection:{
				clubID:1
			}
		}) || []).map(v=>v.clubID)
		if(clubIDs.length == 0) {
			return {
				clubDatas:[]
			}
		}
		let clubDatas:ClubDefine.tData[] = await db.get(DBDefine.tableClubData,{clubID:{$in:clubIDs}})
		return {
			clubDatas
		}
	}

	export async function getFullData(userID:number,params:{
		clubID:number
	}) {
		if(!await Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)) {
			return baseService.errJson(1,"没有权限")
		}
		let fullData:ClubDefine.tFull = await Rpc.center.callException(kds.club.data.getFull,params.clubID)	
		return {
			fullData
		}
	}
	export async function getBaseData(userID:number,params:{
		clubID:number
	}) {
		let data:ClubDefine.tData = await Rpc.center.callException(kds.club.data.getData,params.clubID)
		return {
			data
		}
	}
	export async function getBaseDatas(userID:number,params:{
		clubIDs:number[]
	}){
		let datas:ClubDefine.tData[] = await db.get(DBDefine.tableClubData,{clubID:{$in:params.clubIDs}})
		return{
			datas
		}
	}

	export async function getSubMembers(userID:number,params:{
		clubID:number,
		skip:number,limit:number,
		account:boolean,	// 包含下级账户？
	}) {
		if(!Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)) {
			return baseService.errJson(1,"不是成员")
		}
		if(params.account) {
			let ret = await Rpc.center.callException(kds.club.member.getSubMembers,params.clubID,userID,params.skip,params.limit,params.account)
			if(!ret) {
				return baseService.errJson(1,"获取失败")
			}
			return {
				members:ret.members,
				accounts:ret.accounts,
			}
		}
		let members = await Rpc.center.callException(kds.club.member.getSubMembers,params.clubID,userID,params.skip,params.limit) || []
		return {
			members
		}
	}

	export async function getSubMember(userID:number,params:{
		clubID:number,
		userID:number,
	}) {
		let member = await Rpc.center.callException(kds.club.member.getSubMember,params.clubID,userID,params.userID)
		return {
			member
		}
	}

	export async function getSubAccount(userID:number,params:{
		clubID:number,
		userID:number,
	}) {
		let account = await Rpc.center.callException(kds.club.member.getSubAccount,params.clubID,userID,params.userID)
		return {
			account,
		}
	}

	export async function getSelfMember(userID:number,params:{
		clubID:number,
	}) {
		if(!await Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)) {
			return baseService.errJson(1,"没有权限")
		}
		let member:ClubDefine.tUserMember = await db.getSingle(DBDefine.tableClubMember,{clubID:params.clubID,userID:userID})
		if(!member) {
			return baseService.errJson(1,"获取失败")
		}
		let account:ClubDefine.tUserAccount = await db.getSingle(DBDefine.tableClubUserAccount,{clubID:params.clubID,userID})
		// if(!account) {
		// 	return baseService.errJson(1,"获取失败")
		// }
		return {
			member,account
		}
		
	}
	export async function delMember(userID:number,params:{
		clubID:number,
		delUserID:number,
	}){
		let data:ClubDefine.tData = await Rpc.center.callException(kds.club.data.getData,params.clubID)
		if(!data) {
			return baseService.errJson(1,"俱乐部未找到")
		}
		if(!await Rpc.center.callException(kds.club.member.isMember,params.clubID,params.delUserID)) {
			return baseService.errJson(1,"不是成员")
		}
		let b = await Rpc.center.callException(kds.club.member.remove,params.clubID,params.delUserID,userID)
		return b ? {success:true} : baseService.errJson(1,"删除失败")
	}

	export async function req(userID:number,params:{
		code?:string,
		clubID?:number,

		reason?:string,
	}) {
		if(!params.code && !params.clubID) {
			return baseService.errJson(1,"加入错误")
		}

		let clubID = params.clubID
		if(params.code) {
			let data:ClubDefine.tData = await db.getSingle(DBDefine.tableClubData,{code:params.code})
			if(!data) {
				return baseService.errJson(1,"加入错误[2]")
			}
		}
		let b = await Rpc.center.callException(kds.club.member.req,clubID,userID,params.reason)
		return b ? {} : baseService.errJson(1,"加入错误[3]")
	}

	// export async function reqList(userID:number,params:{
		
	// }) {
	//     let reqList:ClubDefine.tMemberReq[] = await db.get(DBDefine.tableClubReq,{userID})
	// }

	export async function accept(userID:number,params:{
		clubID:number,
		toUserID:number,
		b:boolean
	}) {
		let b = await Rpc.center.callException(kds.club.member.accept,params.clubID,userID,params.toUserID,!!params.b)
		return b ? {} : baseService.errJson(1,"操作失败")
	}

	export async function invite(userID:number,params:{
		clubID:number,
		toUserID:number,
		reason?:string,
	}) {
		let b = await Rpc.center.callException(kds.club.member.invite,params.clubID,userID,params.toUserID,params.reason)
		return b ? {} : baseService.errJson(1,"操作失败")
	}

	export async function inviteList(userID:number,params:{
	    
	}){
		let _list = await db.get(DBDefine.tableClubInvite,{toUserID:userID})
		return {
			data:_list
		}
	}

	export async function agree(userID:number,params:{
		clubID:number,
		b:boolean,
	}) {
		let b = await Rpc.center.callException(kds.club.member.agree,params.clubID,userID,!!params.b)
		return b ? {} : baseService.errJson(1,"操作失败")
	} 

	export async function createTemplate(userID:number,params:{
		clubID:number,
		template:ClubDefine.tRoomTemplate
	}) {
		let template:ClubDefine.tRoomTemplate = await Rpc.center.callException(kds.club.realtime.createTemplate,params.clubID,userID,params.template)
		if(!template) {
			return baseService.errJson(1,"处理失败")
		}
		return {
			template
		}
	}

	export async function updateTemplate(userID:number,params:{
		clubID:number,
		template:ClubDefine.tRoomTemplate
	}) {
		let template:ClubDefine.tRoomTemplate = await Rpc.center.callException(kds.club.realtime.updateTemplate,params.clubID,userID,params.template)
		if(!template) {
			return baseService.errJson(1,"处理失败")
		}
		return {
			template
		}
	}

	export async function getTemplates(userID:number,params:{
		clubID:number,
	}) {
		if(!await Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)) {
			return baseService.errJson(1,"没有权限")
		}
		let templates:ClubDefine.tRoomTemplate[] = await db.get(DBDefine.tableClubRoomTemplate,{clubID:params.clubID})
		return {
			templates
		}
	}

	export async function delTemplate(userID:number,params:{
		clubID:number,
		templateID:number,
	}) {
		let b = await Rpc.center.callException(kds.club.realtime.delTemplate,params.clubID,userID,params.templateID)
		if(!b) {
			return baseService.errJson(1,"处理失败")
		}
		return {}
	}

	export async function updateSetting(userID:number,params:{
		clubID:number,
		setting:ClubDefine.tSetting
	}) {
		let member:ClubDefine.tUserMember = await db.getSingle(DBDefine.tableClubMember,{clubID:params.clubID,userID})
		if(!member || member.type != ClubDefine.MemberType.Boss) {
			return baseService.errJson(1,"没有权限")
		}
		await Rpc.center.callException(kds.club.data.updateSetting,params.clubID,params.setting)
		return {}
	}

	export async function searchUserID(userID:number,params:{
		clubID:number,
		content:string,
	}) {
		if(!await Rpc.center.callException(kds.club.member.isSearchUserIDEnabled,params.clubID,userID)) {
			return baseService.errJson(1,"没有权限")
		}
		let loginData:UserDefine.tLoginData 
			= await db.getSingle(DBDefine.tableUserLoginData,{strUserID:params.content.trim()})
		if(!loginData) {
			return {}
		}
		if(await Rpc.center.callException(kds.club.member.isMember,params.clubID,loginData.userID)) {
			return {}
		}
		return {
			loginData:LoginHeler.getUserLoginData(loginData)
		}
	}
	export async function changeMemberType(userID:number,params:{
		clubID:number,
		toUserID:number,
		memberType:ClubDefine.MemberType
	}){
		if(!await Rpc.center.callException(kds.club.member.changeMemberType,params.clubID,userID,params.toUserID,params.memberType)) {
			return baseService.errJson(1,"没有权限")
		}
		return {
			success:true
		}
	}

	export async function changeJobType(userID:number,params:{
		clubID:number,
		toUserID:number,
		jobType:ClubDefine.JobType
	}){
		if(!await Rpc.center.callException(kds.club.member.changeJobType,params.clubID,userID,params.toUserID,params.jobType)) {
			return baseService.errJson(1,"没有权限")
		}
		return {
			success:true
		}
	}

	export async function getAdminBillDataList(userID:number,params:{
		clubID:number,
		page:number,
		limit:number,
		userID?:number,
	}) {
		let b = await Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)
		if(!b) {
			return baseService.errJson(1,"没有权限")
		}
		
		let index = {
			juCount:-1,
		}
		if(params.userID) {
			index["users.userID"] = params.userID
		}else{
			let subIds = await Rpc.center.callException("kds.club.member.getSubIds",params.clubID,userID)
			if(!subIds) {
				return baseService.errJson(1,"没有成员")
			}
			index["users.userID"] = {$in:subIds}
			
		}
		let opt = {
			sort:{
				endTimestamp:-1
			},
			skip:params.page*params.limit,
			limit:params.limit,
		}
		let count = await db.getCount(DBDefine.tableRoundBill,index)
		let datas:RoomDefine.BillData[] = await db.getOption(DBDefine.tableRoundBill,index,opt) 
		return {
			datas:datas,
			count:count
		}
	}

	export async function getAdminBillDataSubList(userID:number,params:{
		clubID:number,
		roomID:number,
		page:number,
		limit:number,
		userID?:number,
	}) {
		let b = await Rpc.center.callException(kds.club.member.isMember,params.clubID,userID)
		if(!b) {
			return baseService.errJson(1,"没有权限")
		}
		let index = {
			roomID:params.roomID,
			juCount:{$ne:-1},
		}
		if(params.userID) {
			index["users.userID"] = params.userID
		}
		let opt = {
			sort:{
				endTimestamp:-1
			},
			skip:params.page*params.limit,
			limit:params.limit,
		}
		let count = await db.getCount(DBDefine.tableBill,index)
		let datas:RoomDefine.BillData[] = await db.getOption(DBDefine.tableBill,index,opt) 
		return {
			datas:datas,
			count:count
		}
	}

	export async function getMemberBillDataList(userID:number,params:{
		page:number,
		limit:number,
	}) {

		let index = {
			juCount:-1,
			"users.userID":userID
			//"users.0":{$exists: true}
			//users:{$ne: []}
		}
		let opt = {
			sort:{
				endTimestamp:-1
			},
			skip:params.page*params.limit,
			limit:params.limit,
		}
		let count = await db.getCount(DBDefine.tableRoundBill,index)
		let datas:RoomDefine.BillData[] = await db.getOption(DBDefine.tableRoundBill,index,opt) 
		return {
			datas:datas,
			count:count
		}
	}

	export async function getMemberBillDataSubList(userID:number,params:{
		roomID:number,
		page:number,
		limit:number,
	}) {

		let index = {
			juCount:{$ne:-1},
			roomID:params.roomID,
			"users.userID":userID
		}
		let opt = {
			sort:{
				endTimestamp:-1
			},
			skip:params.page*params.limit,
			limit:params.limit,
		}
		let count = await db.getCount(DBDefine.tableBill,index)
		let datas:RoomDefine.BillData[] = await db.getOption(DBDefine.tableBill,index,opt) 
		return {
			datas:datas,
			count:count
		}
	}

	export async function setDeskCost(userID:number,params:{
		tID:number,
		clubID:number,
		targetUserID:number,
		ratio:number,
	}){
		let b = await Rpc.center.callException(kds.club.member.setDeskCost,params.clubID,params.tID,userID,params.targetUserID,params.ratio)
		if(b){
			if(b.code == 0){
				return { success:true }
			}
			return { success:false,errMsg:b.msg }
		}
		return { success:false }
	}
	export async function setDeskCosts(userID:number,params:{
		clubID:number,
		targetUserID:number,
		list:{
			tID:number,
			ratio:number,
		}[],
	}){
		for(let i=0;i<params.list.length;i++){
			let item = params.list[i]
			await Rpc.center.callException(kds.club.member.setDeskCost,params.clubID,item.tID,userID,params.targetUserID,item.ratio)	
		}
		
		let result :ClubDefine.DeskCost[] = await Rpc.center.callException(kds.club.member.getDeskCost,params.clubID,userID,params.targetUserID)
		return { data:result }
	}
	export async function getDeskCosts(userID:number,params:{
		clubID:number,
		targetUserID:number,
	}){
		let result :ClubDefine.DeskCost[] = await Rpc.center.callException(kds.club.member.getDeskCost,params.clubID,userID,params.targetUserID)
		return { data:result }
	}

	export async function createRoom(userID:number,params:{
		clubID:number,
		templateID:number,
	}) {
		
	}
	export async function jiesanRoom(userID:number,params:{
		clubID:number,
		roomID:number,
	}) {
		
	}
}