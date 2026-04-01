import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { DB } from "../../src/db";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { GroupDefine } from "../../pp-base-define/GroupDefine";
import { Log } from "../log";
import { knIpcMsg, knRpcMsg } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { GroupInternalDefine } from "./GroupInternalDefine";
import { UserFlag } from "../../src/UserFlag";
import { UserFlagDefine } from "../../pp-base-define/UserFlag";
import { RedisLock } from "../../src/RedisLock";
import { kds } from "../../pp-base-define/GlobalMethods";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { GameSet } from "../../pp-base-define/GameSet";
import { kdutils } from "kdweb-core/lib/utils";
import { kdasync } from "kdweb-core/lib/tools/async";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { Module_RoomData, Module_RoomGSSrsNode, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";


let db = DB.get()
let redis = DB.getRedis(1)

type tCache = {
	queueUsers:{
		userID:number,
		ignoreRoomIDs:number[],
	}[],
}
export class Group_Worker extends knProcess.handler {
	constructor() {
		super()
		
		this.groupID_ = this.args[0]
		this.init()
		.then((b)=>{
			if(!b) {
				this.sendGroupMsg(GroupInternalDefine.toMaster.InitFailed,{})
			}
		})
	}

	private groupID_:number
	private groupData_:GroupDefine.tData
	private gameSet_:GameSet
	private redisKey_:string 
	private cache_:tCache

	private rooms_:{
		data:RoomDefine.RoomData,
		realtime:RoomDefine.RoomRealtime,
	}[] = []
	private waitInit_:kdasync.wait
	async init() {
		try {
			this.waitInit_ = new kdasync.wait
			let groupData:GroupDefine.tData = await db.getSingle(DBDefine.tableGroupData,{groupID:this.groupID_})
			if(!groupData) {
				Log.oth.error("group init failed data not found")
				this.waitInit_.resolve()
				this.waitInit_ = null 
				return false
			}
			this.groupData_ = groupData
			this.redisKey_ = "group-" + this.groupID_
			let cache = await redis.hget("t_group_process_cache",this.redisKey_,true)
			if(!cache) {
				this.cache_ = {
					queueUsers:[]
				}
			} else {
				this.cache_ = cache 
			}
			if(this.cache_.queueUsers.length > 0) {
				for(let user of this.cache_.queueUsers) {
					let userID = user.userID
					Log.oth.error("user enter failed: on inited userID = " + userID)
					this.sendGroupMsg(GroupInternalDefine.toMaster.EnterFailed,<GroupInternalDefine.toMaster.tEnterFailed>{
						userID,
						groupID:this.groupID_
					})
					this.releaseUserFlag(userID)
				}
				this.cache_.queueUsers.splice(0)
				this.saveCache()
			} else {
				this.saveCache()
			}
			this.gameSet_ = GameSet.createWithData(this.groupData_.gameData)
			this.rooms_ = []
			let roomDatas:RoomDefine.RoomData[] = await Module_RoomData.get({groupID:this.groupID_}) || []
			if(roomDatas.length > 0) {
				let realtimes:RoomDefine.RoomRealtime[] = await Module_RoomRealtime.get({roomID:{$in:roomDatas.map(v=>v.roomID)}})
				for(let roomData of roomDatas) {
					let realtime = realtimes.find(v=>v.roomID == roomData.roomID)
					if(realtime) {
						this.rooms_.push({
							data:roomData,
							realtime,
						})
						Log.oth.info("loaded roomID = " + roomData.roomID,realtime)
					} else {
						Log.oth.error("load room failed roomID = " + roomData.roomID + " realtime is null",roomData)
					}
				}

			}

			setInterval(() => {
				this.onUpdate()
			}, 1000);
			this.waitInit_.resolve()
			this.waitInit_ = null 
			return true 
		} catch (error) {
			Log.oth.error("init error",error)
		}
	}

	async saveCache() {
		await redis.hset("t_group_process_cache",this.redisKey_,this.cache_,true)
	}
	sendGroupMsg(msgName:string,obj:any) {
		this.send({
			cmd:knIpcMsg.CMD.RpcProcess,
			data:<knIpcMsg.tCMDRpc>{
				msgName:msgName,
				obj:obj,
			}
		})
	}

	async onMasterMessage(obj: knIpcMsg.Base) {
		super.onMasterMessage(obj)
		
		if(this.waitInit_) {
			await this.waitInit_.promise
		}
		if(!this.groupData_) {
			return 
		}
		switch(obj.cmd) {
			case knIpcMsg.CMD.RpcProcess:{
				let msg:knIpcMsg.tCMDRpc = obj.data
				switch(msg.msgName) {
					case GroupInternalDefine.toWorker.Enter:{
						let t:GroupInternalDefine.toWorker.tEnter = msg.obj
						this.checkEnter(t.userID,t.ignoreRoomIDs)
					} break 
					case GroupInternalDefine.toWorker.RoomChanged:{
						let t:GroupInternalDefine.toWorker.tRoomChanged = msg.obj
						if(!t.realtime) {
							let idx = this.rooms_.findIndex(v=>v.data.roomID == t.roomID)
							if(idx >= 0) {
								let info = this.rooms_[idx]
								Log.oth.info("room removed roomID = " + info.data.roomID)
								this.rooms_.splice(idx,1)
							}
						} else {
							let info = this.rooms_.find(v=>v.data.roomID == t.roomID)
							if(info) {
								info.realtime = t.realtime
								Log.oth.info("room changed roomID = " + info.data.roomID)
							}
						}
					} break 
					case GroupInternalDefine.toWorker.Restart:{
						let t:GroupInternalDefine.toWorker.tEnter = msg.obj
						this.checkEnter(t.userID,t.ignoreRoomIDs)
					} break 
				}
			} break 
		}
	}

	async checkEnter(userID:number,ignoreRoomIDs?:number[]) {
		if(this.cache_.queueUsers.find(v=>v.userID == userID)) {
			return true 
		}
		return await RedisLock.callInLock(RedisLock.EnterGroup(userID),10,async ()=>{
			let groupID = await UserFlag.get(userID,UserFlagDefine.GroupID)
			if(groupID) {
				Log.oth.info("user enter group failed already in other groups userID = " + userID + " groupID = " + groupID)
				return false 
			}
			if(this.groupData_.minItemCount > 0) {
				let b = await this.callException(kds.item.lockItem,userID,this.getUserEnterLockID(),this.groupData_.itemID,this.groupData_.minItemCount,ItemDefine.SerialType.EnterGroup)
				if(!b) {
					Log.oth.info("user enter failed min item count try lock failed userID = " + userID + " itemID = " + this.groupData_.itemID + " count = " + this.groupData_.minItemCount)
					return false 
				}
				this.call(kds.item.unlockUser,userID,this.getUserEnterLockID(),ItemDefine.SerialType.EnterGroup)
			}
			await UserFlag.set(userID,UserFlagDefine.GroupID,this.groupID_)
			this.cache_.queueUsers.push({
				userID,
				ignoreRoomIDs:ignoreRoomIDs || []
			})
			this.saveCache()
			return true 
		})
	}

	getUserEnterLockID() {
		return "lock-group-enter|" + this.groupID_ + "|" + this.groupData_.itemID + "|" + this.groupData_.minItemCount
	}

	async releaseUserFlag(userID:number) {
		let b = await UserFlag.remove(userID,UserFlagDefine.GroupID,this.groupID_)
		if(!b) {
			return false 
		}
		this.call(kds.item.unlockUser,userID,this.getUserEnterLockID(),ItemDefine.SerialType.EnterGroup)
		return true 
	}
	
	private isWorking_ = false 
	async onUpdate() {
		if(this.isWorking_) {
			return 
		}
		this.isWorking_ = true 
		try {
			do {
				if(this.cache_.queueUsers.length == 0) {
					break 
				}
				let activeRooms = this.rooms_.filter(v=>v.realtime.status < RoomDefine.RoomStatus.End)
				let users = this.cache_.queueUsers.slice()
				for(let user of users) {
					let userID = user.userID

					let roomID:number
					let realtime:RoomDefine.RoomRealtime
					if(activeRooms.length > 0) {
						let rooms = activeRooms.filter(v=>v.realtime.users.length < this.gameSet_.getUserCount() && !user.ignoreRoomIDs.includes(v.data.roomID))
						if(rooms.length > 0) {
							let room = rooms[kdutils.intRandom(0,rooms.length)]
							roomID = room.data.roomID
							realtime = room.realtime
						}
					}
					if(!roomID) {
						// 创新新房间
						let roomData:RoomDefine.RoomData = await this.callException(kds.room.create.group,this.groupID_,this.groupData_.gameData)
						if(roomData) {
							roomID = roomData.roomID
							realtime = await Module_RoomRealtime.getMain(roomID)
						}
						if(!realtime) {
							Log.oth.error("create room failed when user enter userID = " + userID)
							this.sendUserEnterFailedAndRemove(userID)
							kdasync.timeout(1000)
							break 
						}
						this.rooms_.push({
							data:roomData,
							realtime:realtime,
						})
					}
					for(let i = 0 ; i < 3 ; i ++) {
						if(realtime.gsName == null) {
							realtime = await Module_RoomRealtime.getMain(roomID)
						} else {
							break 
						}
						await kdasync.timeout(1000)
					}
					if(!realtime.gsName) {
						Log.oth.error("create room failed gs name is null when user enter userID = " + userID)
						this.sendUserEnterFailedAndRemove(userID)
						kdasync.timeout(1000)
						break 
					}
					let gss = await Module_RoomGSSrsNode.get({gameID:realtime.gameData.gameID,name:realtime.gsName}) || []
					let gs = gss[kdutils.intRandom(0,gss.length)]
					let b = await this.callException(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.userEnter,roomID,userID,<GSRpcMethods.tUserEnterReq>{
						system:{
							groupID:this.groupID_
						}
					})
					if(!b) {
						Log.oth.error("user enter room failed userID = " + userID + " roomID = " + roomID)
						this.sendUserEnterFailedAndRemove(userID)
					} else {
						let activeRoom = this.rooms_.find(v=>v.data.roomID == realtime.roomID)
						if(activeRoom) {
							if(!activeRoom.realtime.users.find(v=>v.userID == userID)) {
								activeRoom.realtime.users.push({
									userID,
									chairNo:-1,
									score:"0",
								})
							}
						}
						Log.oth.info("user enter group room userID = " + userID + " roomID = " + roomID)
						this.sendUserEnterSuccessAndRemove(userID,roomID,this.groupData_.gameData)
					}
				}

			} while (false);
		} catch (error) {
			Log.oth.error("loop error",error)
		}
		this.isWorking_ = false 
	}

	sendUserEnterFailedAndRemove(userID:number) {
		this.sendGroupMsg(GroupInternalDefine.toMaster.EnterFailed,<GroupInternalDefine.toMaster.tEnterFailed>{
			groupID:this.groupID_,
			userID,
		})
		let idx = this.cache_.queueUsers.findIndex(v=>v.userID == userID)
		if(idx >= 0) {
			this.cache_.queueUsers.splice(idx,1)
			this.saveCache()
		}
		this.releaseUserFlag(userID)
	}
	sendUserEnterSuccessAndRemove(userID:number,roomID:number,gameData:RoomDefine.GameData) {
		this.sendGroupMsg(GroupInternalDefine.toMaster.EnterSuccess,<GroupInternalDefine.toMaster.tEnterSuccess>{
			groupID:this.groupID_,
			userID,
			roomID,
			gameData,
		})
		let idx = this.cache_.queueUsers.findIndex(v=>v.userID == userID)
		if(idx >= 0) {
			this.cache_.queueUsers.splice(idx,1)
			this.saveCache()
		}
		this.releaseUserFlag(userID)
	}
}