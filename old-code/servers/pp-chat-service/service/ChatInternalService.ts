import { kdreq } from "kdweb-core/lib/service/req";
import { CustomerDefine, CustomerMsgDefine } from "../../pp-base-define/CustomerDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { UserFlag } from "../../src/UserFlag";
import { Rpc } from "../rpc";
import { UserFlagDefine } from "../../pp-base-define/UserFlag";
import { Module_CustomerChatData, Module_CustomerChatRoom } from "../../pp-base-define/DM_CustomerDefine";
import { kdasync } from "kdweb-core/lib/tools/async";
import { IDUtils } from "../../src/IDUtils";
import { TimeDate } from "../../src/TimeDate";
import { kdutils } from "kdweb-core/lib/utils";
import { kds } from "../../pp-base-define/GlobalMethods";
import { Module_UserLoginRole } from "../../pp-base-define/DM_UserDefine";

export namespace ChatInternalService {
	export async function sendToUser(params:{
		userID:number,
		msgName:string,
		jsonObj:any,
	}) {
		return {
			b:await Rpc.userServer.sendToUserFromHttp(params.userID,params.msgName,params.jsonObj),
		}
	}
}
export namespace ChatInternalUtils {
	export async function sendToUser(userID:number,msgName:string,jsonObj:any) {
		let b = Rpc.userServer.sendToUserFromHttp(userID,msgName,jsonObj)
		if(b) {
			return true 
		}
		let flag:CustomerDefine.WSUserFlag = await UserFlag.get(userID,UserFlagDefine.CustomerChatServer)
		if(!flag) {
			return false 
		}
		kdreq.postJson(flag.internalHost + "/sendtouser",{
			userID,
			msgName,
			jsonObj,
		})
		return true 
	}

	export async function roomsChange(opt:{
		fromUserID?:number,
		toUserID?:number,
	}) {
		let index:any = {}
		if(opt.fromUserID) {
			index.fromUserID = opt.fromUserID
		}
		if(opt.toUserID) {
			index.toUserID = opt.toUserID
		}
		let rooms = await Module_CustomerChatRoom.get(index)
		let userIDs = new Set<number>()
		for(let room of rooms) {
			if(room.fromUserID) {
				sendToUser(room.fromUserID,CustomerMsgDefine.RoomChanged,<CustomerMsgDefine.tRoomChangedNT>{
					roomID:room.roomID,
				})
			}
			if(room.toUserID) {
				sendToUser(room.toUserID,CustomerMsgDefine.RoomChanged,<CustomerMsgDefine.tRoomChangedNT>{
					roomID:room.roomID,
				})
			}
		}
		let loginRoles = await Module_UserLoginRole.get({"targets.roles":UserDefine.RoleType.CustomerChatManager})
		let roomIDs = rooms.map(r=>r.roomID)
		for(let lr of loginRoles) {
			sendToUser(lr.userID,CustomerMsgDefine.RoomChanged,<CustomerMsgDefine.tRoomChangedNT>{
				roomIDs,
			})
		}
	}

	export async function chat(roomID:number,type:CustomerDefine.ChatType,content:string,data:any,params:{
		fromUserID?:number,
		toUserID?:number,
	}) {
		if(content.length >= 1024 * 1000) {
			return null 
		} 
		let index:any = {roomID}
		if(params.fromUserID) {
			index.fromUserID = params.fromUserID
		}
		if(params.toUserID) {
			index.toUserID = params.toUserID
		}
		let room = await Module_CustomerChatRoom.getSingle(index)
		if(!room) {
			await kdasync.timeout(1000)
			return null 
		}
		let module = await Module_CustomerChatRoom.searchLockedSingleData(room.roomID)

		let timestamp = kdutils.getMillionSecond()
		let chatData:CustomerDefine.tChat = {
			msgID:await IDUtils.getChatSeq(),

			userID:params.fromUserID || params.toUserID,
			from:params.fromUserID ? true : false,
			roomID:roomID,

			type:type,
			content:null,
			data:null,

			timestamp,
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",timestamp),
		}
		module.saveAndRelease()
		switch(type) {
			case CustomerDefine.ChatType.Text: {
				chatData.content = content
			} break 
			case CustomerDefine.ChatType.Emoji: {
				chatData.content = content
			} break 
			case CustomerDefine.ChatType.Image: {
				if(!data || typeof(data) != "string" || data.length >= 1024 * 1024) {
					chatData.content = null 
				} else {
					let ext = content 
					if(!ext.startsWith(".") || ext.length > 5) { 
						chatData.content = null
					} else {
						chatData.content = "(image..)"
						let path = "customer/" + TimeDate.getFmtMoment("YYYYMMDD",timestamp) + "/" + chatData.msgID
						Rpc.center.callException(kds.oss.upload,null,path + ext,data)
						.then(async (url)=>{
							// do nothing
							if(url) {
								chatData.content = url 
								await Module_CustomerChatData.updateOrigin({
									msgID:chatData.msgID,
								},{
									$set:{
										content:chatData.content
									},
								})
								let room = await Module_CustomerChatRoom.getMain(roomID)
								sendToUser(room.fromUserID,CustomerMsgDefine.Chat,{
									chat:chatData,
								})
								sendToUser(room.toUserID,CustomerMsgDefine.Chat,{
									chat:chatData,
								})
							}
						})
					}
				}
			} break 
		}
		await Module_CustomerChatData.insert(chatData)
		module.data.lastMsgID = chatData.msgID
		sendToUser(room.fromUserID,CustomerMsgDefine.Chat,{
			chat:chatData,
		})
		sendToUser(room.toUserID,CustomerMsgDefine.Chat,{
			chat:chatData,
		})
		return chatData.msgID
	}
}