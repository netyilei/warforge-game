import { baseService } from "kdweb-core/lib/service/base";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { GroupDefine } from "../../pp-base-define/GroupDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { DB } from "../../src/db";
import { RedisLock } from "../../src/RedisLock";
import { kds } from "../../pp-base-define/GlobalMethods";
import { Rpc } from "../rpc";
import _ from "underscore";
import Decimal from "decimal.js";
import { GlobalUtils } from "../../src/GlobalUtils";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { LoginHeler } from "../../pp-login/helper/loginHelper";
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine";
import { NewsDefine } from "../../pp-base-define/NewsDefine";
import { Module_News } from "../../pp-base-define/DM_News";
import { Module_Banner, Module_Mail } from "../../pp-base-define/DM_MailDefine";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { Module_UserBag, Module_UserRoomID } from "../../pp-base-define/DM_UserDefine";
import { Module_RoomData } from "../../pp-base-define/DM_RoomDefine";
import { kdasync } from "kdweb-core/lib/tools/async";
import { Module_UserMatchEvent } from "../../pp-base-define/DM_MatchDefine";
import { MatchDefine } from "../../pp-base-define/MatchDefine";


let db = DB.get()
let redis = DB.getRedis()
export namespace LobbyService {
	export async function getBag(userID:number,params:{
		
	}) {
		let bag:ItemDefine.tBag = await Module_UserBag.getSingle({userID})
		return {
			bag
		}
	}

	export async function getGroups(userID:number,params:{
		gameID:number
	}) {
		return {
			groups:<GroupDefine.tData[]>await db.getOption(DBDefine.tableGroupData,{"gameData.gameID":params.gameID},{
				sort:{
					pri:1
				}
			})
		}
	}

	export async function lobbyEnter(userID:number,params:{
	}) {
		let index = {
            toUserID:userID,
            isRead:false,
            isDel:false,
        }
        let mailCount = await Module_Mail.getCount(index)
		let _userRedDot:UserDefine.UserRedBot = {
			mail:mailCount,
		}
		let data = {
			reddot:_userRedDot,
		}

		let userCounts:{
			gameID:number,
			count:number,
		}[] = []
		let config = await GlobalUtils.getMain()
		for(let fakeUserCount of config.fakeUserCounts) {
			let count = await fakeUserCount.count + kdutils.intRandom(0,fakeUserCount.offset)
			userCounts.push({
				gameID:fakeUserCount.gameID,
				count:count,
			})
		}
		let timestamp = kdutils.getMillionSecond()
		let matchEvents = await Module_UserMatchEvent.getOption({
			userID:userID,
			onlyPush:false,
			read:false,
			expireTimestamp:{$gt:timestamp},
		},{
			sort:{timestamp:-1},
			limit:10,
		})
		if(matchEvents.length > 0) {
			await Module_UserMatchEvent.updateManyOrigin({
				eventID:{$in:matchEvents.map(v=>v.eventID)},
			},{
				$set:{
					read:true,
				}
			})
		}
        return {
			data,
			items:await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemCsv,false),
			// lottery:await GlobalUtils.getLotteryConfig(),
			// tasks:(await GlobalUtils.getTasks()).filter(v=>v.enabled || v.enabled == null),
			// checkin:await GlobalUtils.getCheckinConfig(),
			banners:await Module_Banner.getOption({visible:true},{sort:{pri:1},limit:10}),

			userCounts,

			matchEvents,
		}
	}

    export async function getItemConfigs(userID:number,params:{
        
    }) {
        return {
            items:await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemCsv,false)
        }
    }
	
	export async function getNews(userID:number,params:{
		type?:NewsDefine.NewsType,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.type != null) {
			index.type = params.type
		}
		index.visible = true 
		let count = await Module_News.getCount(index)
		let datas = await Module_News.getOption(index,{
			sort:{timestamp:-1},
			skip:params.page * params.limit,
			limit:params.limit,
			projection:{
				contents:0,	
			}
		})
		return {
			count:count,
			datas:datas,
		}
	}

	export async function getNewsDetail(userID:number,params:{
		newsID:string
	}) {
		let data = await Module_News.getMain(params.newsID)
		return {
			data
		}
	}

	export async function getBanners(userID:number,params:{
		
	}) {
		let index:any = {}
		index.visible = true
		let banners = await Module_Banner.getOption(index,{
			sort:{pri:1},
			limit:10,
		})
		return {
			banners
		}
	}

	export async function createRoom(userID:number,params:{
		gameData:RoomDefine.GameData
	}) {
		let rooms = await Module_UserRoomID.getOption({userID})
		if(rooms.length > 0) {
			return baseService.errJson(1,"already in room")
		}
		return await RedisLock.callInLock(RedisLock.UserCreateRoom(userID),30,async ()=>{
			rooms = await Module_UserRoomID.getOption({userID})
			if(rooms.length > 0) {
				return baseService.errJson(1,"无法创建房间")
			}

			let roomData:RoomDefine.RoomData = await Rpc.center.callException(kds.room.create.user,userID,params.gameData)
			if(!roomData) {
				return baseService.errJson(2,"创建房间失败")
			}

			return {
				roomData
			}
		})
	}

	export async function joinRoom(userID:number,params:{
		boxCode:string
	}) {
		let roomData = await Module_RoomData.getSingle({boxCode:params.boxCode})
		if(!roomData) {
			await kdasync.timeout(1000)
			return baseService.errJson(1,"房间不存在")
		}
		let rooms = await Module_UserRoomID.getOption({userID})
		if(rooms.length > 0 || rooms.find(v=>v.roomID == roomData.roomID)) {
			return baseService.errJson(2,"已经在房间中")
		}
		return {
			roomData
		}
	}
}