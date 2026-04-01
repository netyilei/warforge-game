import { baseService } from "kdweb-core/lib/service/base";
import { Module_CustomerChatData, Module_CustomerChatRoom } from "../../pp-base-define/DM_CustomerDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { UserUtils } from "../../src/UserUtils";
import { ChatInternalUtils } from "./ChatInternalService";
import { CustomerDefine, CustomerMsgDefine } from "../../pp-base-define/CustomerDefine";
import { Module_UserLoginData, Module_UserLoginRole } from "../../pp-base-define/DM_UserDefine";
import { Log } from "../log";

export namespace ChatAdminService {
	export async function getRooms(userID:number,params:{
		page:number,
		limit:number,
	}) {
		let index:any
		if(await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager)) {
			index = {}
			Log.oth.info("chat mgr index = ",index)
		} else {
			index = {
				fromUserID:userID,
			}
			Log.oth.info("chat normal index = ",index)
		}
		let count = await Module_CustomerChatRoom.getCount(index)
		let datas = await Module_CustomerChatRoom.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
		})
		let userIDs = datas.map(v=>v.toUserID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		Log.oth.info("get datas = ",index,params,datas,count)
		return {
			count:count,
			datas:datas,

			loginDatas,
		}
	}

	// 更换转接客服
	export async function changeCustomer(userID:number,params:{
		roomID:number,
		userID:number,
	}) {
		if(await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager)) {

		} else if(await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChat)) {
			let room = await Module_CustomerChatRoom.getSingle({
				roomID:params.roomID,
				fromUserID:userID,
			})
			if(!room) {
				return baseService.errJson(1,"no permission")
			}
		} else {
			return baseService.errJson(1,"no permission")
		}
		let toLoginRole = await Module_UserLoginRole.getMain(params.userID)
		if(!toLoginRole) {
			return baseService.errJson(4,"user not exist")
		}
		let target = toLoginRole.targets?.find(v=>v.target == UserDefine.LoginTarget.Console)
		if(!target || (!target.roles.includes(UserDefine.RoleType.CustomerChat) && !target.roles.includes(UserDefine.RoleType.CustomerChatManager))) {
			return baseService.errJson(5,"user no customer role")
		}
		let module = await Module_CustomerChatRoom.searchLockedSingleData(params.roomID)
		if(!module) {
			return baseService.errJson(2,"room not exist")
		}
		if(module.data.fromUserID == params.userID) {
			module.release()
			return baseService.errJson(3,"same user")
		}
		let oldFromUserID = module.data.fromUserID
		module.data.fromUserID = params.userID
		await module.saveAndRelease()

		let sendUserIDs = oldFromUserID ? 
			[
				oldFromUserID,
				params.userID,
				module.data.toUserID
			]
			: 
			[
				params.userID,
				module.data.toUserID
			]
		for(let sendUserID of sendUserIDs) {
			ChatInternalUtils.sendToUser(sendUserID,
				CustomerMsgDefine.RoomChanged,
				<CustomerMsgDefine.tRoomChangedNT>{
					roomID:module.data.roomID,
					fromUserID:params.userID,
				}
			)
		}
		return {

		}
	}

	
	export async function getChats(userID:number,params:{
		roomID:number,
		msgID?:number,
		page:number,
		limit:number,
	}) {
		let roomIndex:any = {roomID:params.roomID}
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager)) {
			if(await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChat)) {
				roomIndex.fromUserID = userID
			}
		}
		let room = await Module_CustomerChatRoom.getSingle(roomIndex)
		if(!room) {
			return {
				count:0,
				datas:[],
			}
		}
		let index:any = {
			roomID:params.roomID,
		}
		if(params.msgID) {
			index.msgID = {$lte:params.msgID}
		}
		let count = await Module_CustomerChatData.getCount(index)
		let datas = await Module_CustomerChatData.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{msgID:-1},
		})
		return {
			count:count,
			datas:datas,
		}
	}

	// 这个函数没有page，客服可以固定返回
	export async function getNoFromRooms(userID:number,params:{
		limit?:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager) && 
			!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChat)) {
			return baseService.errJson(1,"no permission")
		}
		let index:any = {
			fromUserID:null,
		}
		let count = await Module_CustomerChatRoom.getCount(index)
		let datas = await Module_CustomerChatRoom.getOption(index,{
			limit:params.limit,
		})
		let userIDs = datas.map(v=>v.toUserID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		return {
			count:count,
			datas:datas,

			loginDatas,
		}
	}

	export async function startRoom(userID:number,params:{
		roomID:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager) && 
			!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChat)) {
			return baseService.errJson(1,"no permission")
		}
		let room = await Module_CustomerChatRoom.searchLockedSingleData(params.roomID)
		if(!room) {
			return baseService.errJson(2,"room not exist")
		}
		if(room.data.fromUserID) {
			if(room.data.fromUserID == userID) {
				room.release()
				return {}
			}
			return baseService.errJson(3,"room has from user")
		}
		room.data.fromUserID = userID
		await room.saveAndRelease()
		ChatInternalUtils.sendToUser(room.data.fromUserID,
			CustomerMsgDefine.RoomChanged,
			<CustomerMsgDefine.tRoomChangedNT>{
				roomID:room.data.roomID,
				fromUserID:userID,
			}
		)
		ChatInternalUtils.sendToUser(room.data.toUserID,
			CustomerMsgDefine.RoomChanged,
			<CustomerMsgDefine.tRoomChangedNT>{
				roomID:room.data.roomID,
				fromUserID:userID,
			}
		)
		return {}
	}

	export async function getChangeEnabledCustomers(userID:number,params:{
		
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager) && 
			!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChat)) {
			return baseService.errJson(1,"no permission")
		}
		let loginRoles = await Module_UserLoginRole.get({
			"targets.target":UserDefine.LoginTarget.Console,
			"targets.roles":{$in:[
				UserDefine.RoleType.CustomerChat,
				UserDefine.RoleType.CustomerChatManager,
			]},
		})
		let userIDs = loginRoles.map(v=>v.userID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		let retDatas = loginRoles.map(v=>{
			let loginData = loginDatas.find(ld=>ld.userID == v.userID)
			return {
				userID:v.userID,
				role:v,
				loginData:loginData,
			}
		})
		return {
			datas:retDatas,
		}
	}

	export async function isCustomerID(userID:number,params:{
		userID:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChatManager) && 
			!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.CustomerChat)) {
			return {
				b:false
			}
		}
		return {
			b:true
		}
	}
}