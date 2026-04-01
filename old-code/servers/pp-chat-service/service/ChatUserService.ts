import { kdasync } from "kdweb-core/lib/tools/async";
import { Module_CustomerChatData, Module_CustomerChatRoom } from "../../pp-base-define/DM_CustomerDefine";
import { kdlock } from "kdweb-core/lib/tools/lock";
import { IDUtils } from "../../src/IDUtils";
import { CustomerDefine } from "../../pp-base-define/CustomerDefine";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { DB } from "../../src/db";
import { UserFlag } from "../../src/UserFlag";
import { UserFlagDefine } from "../../pp-base-define/UserFlag";

let redis = DB.getRedis();
export namespace ChatService {
	export async function startChat(userID:number,params:{
		
	}) {
		return await kdlock.redis.callInLock(Module_CustomerChatRoom.getLockName(null),30,async ()=>{
			let room = await Module_CustomerChatRoom.getSingle({
				toUserID:userID,
			})
			if(room) {
				return {
					room
				}
			}
			room = {
				roomID:await IDUtils.getChatRoomID(),
				fromUserID:null,
				toUserID:userID,
				fromStatus:CustomerDefine.RoomUserStatus.None,
				toStatus:await UserFlag.get(userID,UserFlagDefine.CustomerChatServer) ? 
					CustomerDefine.RoomUserStatus.Online 
					: 
					CustomerDefine.RoomUserStatus.Offline,

				lastMsgID:0,
				createTimestamp:kdutils.getMillionSecond(),
				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			}
			await Module_CustomerChatRoom.insert(room)
			return {
				room
			}
		})
	}
	export async function getRooms(userID:number,params:{
		page:number,
		limit:number,
	}) {
		let index = {
			$or:[
				{fromUserID:userID},
				{toUserID:userID},
			]
		}
		let count = await Module_CustomerChatRoom.getCount(index)
		let datas = await Module_CustomerChatRoom.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
		})
		return {
			count:count,
			datas:datas,
		}
	}

	export async function getRoom(userID:number,params:{
		roomID:number,
	}) {
		let room = await Module_CustomerChatRoom.getSingle({
			roomID:params.roomID,
			toUserID:userID,
		})
		if(!room) {
			await kdasync.timeout(3000)
		}
		return {
			room:room,
		}
	}

	export async function getChats(userID:number,params:{
		roomID:number,
		msgID?:number,
		page:number,
		limit:number,
	}) {
		let room = await Module_CustomerChatRoom.getSingle({
			roomID:params.roomID,
			toUserID:userID,
		})
		if(!room) {
			await kdasync.timeout(3000)
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
}