import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { knIpcMsg } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { MatchIpcMessage } from "./MatchIpcMessage";
import { Log } from "../log";
import { kdasync } from "kdweb-core/lib/tools/async";
import md5 = require("md5")
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import _ = require("underscore");
import { DB } from "../../src/db";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { TraceLog } from "../../src/TraceLog";
import { Module_RoomGSSrsNode, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { resolve } from "dns";
import { Module_MatchData, Module_MatchExecuterRoomInfo, Module_MatchReward, Module_MatchRuntime, Module_MatchUserRank, Module_MatchUserRuntime, Module_MatchUserSignUp } from "../../pp-base-define/DM_MatchDefine";
import { MatchDefine } from "../../pp-base-define/MatchDefine";
import { GameSet } from "../../pp-base-define/GameSet";
import { RedisLock } from "../../src/RedisLock";
import { GSMatchControl } from "../../pp-base-define/GSMatchControl";
import { kds } from "../../pp-base-define/GlobalMethods";
import Decimal from "decimal.js";
import { TexasRule } from "../../pp-game-texas/TexasDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { MatchUtils } from "./MatchUtils";
import { UserDCNHttpLayerUtils } from "../../src/UserDCNHttpLayerUtils";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
import { RobotEnvTools } from "../../src/RobotEnvTools";
import { GSMatchUserMsg } from "../../pp-base-define/GSMatchUserMsg";

let db = DB.get()
let redis = DB.getRedis()
export class Match_SubExecuter extends knProcess.handler{
	constructor() {
		super()
		Log.oth.info("sub thread initing")
		this.matchID_ = this.args[0]
		this.executerID_ = this.args[1]
		this.workerInited_ = false 
		this.initWorker()
	}
	private matchID_:number
	private data_:MatchDefine.tData
	private runtime_:MatchDefine.tRuntime
	private executerID_:string
	private workerInited_:boolean
	private cachedMessages_:knIpcMsg.Base[] = []
	async initWorker() {
		let success = false 
		do {
			let matchData = await Module_MatchData.getMain(this.matchID_)
			if(!matchData) {
				this.logError("initWorker matchData not found matchID = " + this.matchID_)
				break 
			}
			this.data_ = matchData
			this.runtime_ = await Module_MatchRuntime.getMain(this.matchID_)
			if(!this.runtime_) {
				this.logError("initWorker matchRuntime not found matchID = " + this.matchID_)
				break
			}
			success = true 
		} while (false);
		this.workerInited_ = true 
		if(!success) {
			this.sendToMaster(MatchIpcMessage.ToMaster_WorkerReady,<MatchIpcMessage.tToMaster_WorkerReady>{
				success:false,
			})
			return 
		} else {
			this.sendToMaster(MatchIpcMessage.ToMaster_WorkerReady,<MatchIpcMessage.tToMaster_WorkerReady>{
				success:true,
			})	
		}

		for(let msg of this.cachedMessages_) {
			try {
				this.handleMasterMessage(msg)
			} catch (error) {
				Log.oth.error("initWorker handle cached message error",error)
			}
		}
		this.cachedMessages_ = []
		this.updateH_ = setInterval(()=>{
			this.onUpdate()
		},5000)
	}

	private updateH_:any
	stopUpdate() {
		if(this.updateH_) {
			clearInterval(this.updateH_)
			this.updateH_ = null
		}
	}

	onMasterMessage(obj: knIpcMsg.Base): void {
		super.onMasterMessage(obj)
		if(!this.workerInited_) {
			this.cachedMessages_.push(obj)
			return 
		}
		try {
			this.handleMasterMessage(obj)
		} catch (error) {
			Log.oth.error("onMasterMessage",error)
		}
	}
	handleMasterMessage(obj: knIpcMsg.Base): void {
		switch(obj.cmd) {
			case knIpcMsg.CMD.RpcProcess:{
				let msg:knIpcMsg.tCMDRpc = obj.data
				TraceLog.match(this.idx,"recv master message",msg.msgName,msg.obj)
				switch(msg.msgName) {
					case MatchIpcMessage.ToWorker_RoomRealtimeChanged:{
						let t:MatchIpcMessage.tToWorker_RoomRealtimeChanged = msg.obj
						this.onRoomRealtimeChanged(t.roomID,!!t.removed)
					} break
					// case MatchIpcMessage.ToWorker_RoomJuEnd:{
					// 	let t:MatchIpcMessage.tToWorker_RoomJuEnd = msg.obj
					// 	this.onRoomJuEnd(t.roomID,t.bill)
					// } break
					// case MatchIpcMessage.ToWorker_GameServerReady:{
					// 	let t:MatchIpcMessage.tToWorker_GameServerReady = msg.obj
						
						
					// } break 
				}
			} break 
		}
	}

	sendToMaster(msgName:string,data:any) {
		TraceLog.match(null,"sendToMaster",msgName,data)
		this.send({
			cmd:knIpcMsg.CMD.RpcProcess,
			data:<knIpcMsg.tCMDRpc>{
				msgName,
				obj:data,
			}
		})
	}
	
	private gsCaches_:{
		name:string,
		info:SrsDefine.Mongo.tGSSrsNode,
		timestamp:number,
	}[] = []
	private q_ = new kdasync.queue
	async callGS(gsName:string,roomID:number,msgName:string,data:any) {
		return await new Promise<any>((resolve,reject)=>{
			this.q_.call(async ()=>{
				try {
					let ret = await this._callGS(gsName,roomID,msgName,data)
					resolve(ret)
				} catch (error) {
					Log.oth.error("callGS error gsName = " + gsName + " msgName = " + msgName + " data = ",data,error)
					resolve(null)
				}
			})
		})
	}

	async _callGS(gsName:string,roomID:number,msgName:string,data:any) {
		let res:SrsRpcMethods.LayerCenter.tCallGSRes
		let cache = this.gsCaches_.find(v=>v.name == gsName)
		if(cache && kdutils.getMillionSecond() - cache.timestamp < 60000) {
			res = await this.callGSByLayer(cache.info.layer,cache.info.name,roomID,msgName,data)
		} else {
			let gs = await Module_RoomGSSrsNode.getSingle({name:gsName})	
			if(!gs) {
				return null 
			}
			this.gsCaches_.push({
				name:gsName,
				info:gs,
				timestamp:kdutils.getMillionSecond(),
			})
			res = await this.callGSByLayer(gs.layer,gs.name,roomID,msgName,data)
		}
		if(!res || !res.b) {
			Log.oth.error("callGS failed gsName = " + gsName + " msgName = " + msgName + " data = ",data)
			let idx = this.gsCaches_.findIndex(v=>v.name == gsName)
			if(idx >= 0) {
				this.gsCaches_.splice(idx,1)
			}
			return null 
		}
		return res.data
	}

	async callGSByLayer(layerName:string,gsName:string,roomID:number,msgName:string,data:any): Promise<SrsRpcMethods.LayerCenter.tCallGSRes> {
		let layer:SrsDefine.LayerOtherConfig = await redis.hget(SrsDefine.Redis.tableLayer,layerName,true)
		if(!layer) {
			return null 
		}
		return await this.callServerException(layerName,SrsRpcMethods.LayerCenter.callGS,gsName,GSRpcMethods.matchControl,roomID,msgName,data)
	}

	async changeStatus(newStatus:MatchDefine.MatchStatus) {
		if(this.data_.status == newStatus) {
			return 
		}
		Log.oth.info("match status changed matchID = " + this.matchID_ + " from " + MatchDefine.MatchStatus[this.data_.status] + " to " + MatchDefine.MatchStatus[newStatus])
		TraceLog.match(this.idx,"match status changed matchID = " + this.matchID_ + " from " + MatchDefine.MatchStatus[this.data_.status] + " to " + MatchDefine.MatchStatus[newStatus])
		let module = await Module_MatchData.searchLockedSingleData(this.matchID_)
		if(module) {
			module.data.status = newStatus
			module.data.changeStatusTimestamp = kdutils.getMillionSecond()
			this.data_.status = newStatus
			this.data_.changeStatusTimestamp = module.data.changeStatusTimestamp
			await module.saveAndRelease()
			this.sendToMaster(MatchIpcMessage.ToMaster_StatusChanged,<MatchIpcMessage.tToMaster_StatusChanged>{
				status:newStatus,
			})
		}
		return 
	}

	// private realtimes_:RoomDefine.RoomRealtime[] = []
	private qRealtime_ = new kdasync.queue
	// 处理房间实时数据变化：来自room通知
	async onRoomRealtimeChanged(roomID:number,removed:boolean) {
		this.qRealtime_.call(async ()=>{
			if(!removed) {
				let realtime = await Module_RoomRealtime.getMain(roomID)
				if(realtime) {
					await RedisLock.callInLock(RedisLock.MatchUserRuntimeGlobal(this.matchID_),30,async ()=>{
						await this.operRoomRealtimeChanged(realtime)
					})
					return 
				}
				removed = true 
				Log.oth.error("room realtime changed not found roomID = " + roomID)
				TraceLog.match(this.idx,"room realtime changed not found roomID = " + roomID)
			}
			if(removed) {
				let idx = this.roomInfos_.findIndex(v=>v.roomID == roomID)
				if(idx >= 0) {
					let roomInfo = this.roomInfos_[idx]
					this.roomInfos_.splice(idx,1)
					await Module_MatchExecuterRoomInfo.del({matchID:this.matchID_,roomID})
					let index = {
						matchID:this.matchID_,roomID,
						status:{$ne:MatchDefine.UserMatchStatus.Out},
					}
					if(this.data_.status == MatchDefine.MatchStatus.Ended || this.data_.status == MatchDefine.MatchStatus.FullyEnded) {
						await Module_MatchUserRuntime.updateManyOrigin(index,{
							$set:{
								roomID:null,
							},
						})
					} else {
						await Module_MatchUserRuntime.updateManyOrigin(index,{
							$set:{
								roomID:null,
								status:MatchDefine.UserMatchStatus.ReadyToPlay,
							},
						})
					}
					Log.oth.info("room realtime removed matchID = " + this.matchID_ + " roomID = " + roomID)
					TraceLog.match(this.idx,"room realtime removed matchID = " + this.matchID_ + " roomID = " + roomID)
				} else {
					Log.oth.error("room realtime remove not found matchID = " + this.matchID_ + " roomID = " + roomID)
					TraceLog.match(this.idx,"room realtime remove not found matchID = " + this.matchID_ + " roomID = " + roomID)
				}
			}

		})
	}

	// 处理房间实时数据变化
	async operRoomRealtimeChanged(realtime:RoomDefine.RoomRealtime) {
		let roomInfo = this.roomInfos_.find(v=>v.roomID == realtime.roomID)
		if(!roomInfo) {
			roomInfo = {
				matchID:this.matchID_,
				executerID:this.executerID_,
				roomID:realtime.roomID,
				status:realtime.status,
				gsName:realtime.gsName,
				waitingCombine:false,
				forceWaitingCombine:false,
				users:[],
			}
			this.roomInfos_.push(roomInfo)
			Log.oth.info("room realtime added matchID = " + this.matchID_ + " roomID = " + realtime.roomID)
			TraceLog.match(this.idx,"room realtime added matchID = " + this.matchID_ + " roomID = " + realtime.roomID)
		} else {
			roomInfo.status = realtime.status
			roomInfo.gsName = realtime.gsName
		}

		let changeRuntimes:MatchDefine.tUserRuntime[] = []
		for(let i = roomInfo.users.length - 1 ; i >= 0 ; i --) {
			let roomUser = roomInfo.users[i]
			let realtimeUser = realtime.users.find(v=>v.userID == roomUser.userID)
			if(!realtimeUser) {
				roomInfo.users.splice(i,1)
				let runtime = await Module_MatchUserRuntime.getLockedSingleData({userID:roomUser.userID,matchID:this.matchID_})
				if(runtime && runtime.data.roomID == realtime.roomID) {
					runtime.data.roomID = null
					Log.oth.info("operRoomRealtimeChanged user left room matchID = " + this.matchID_ + " roomID = " + realtime.roomID + " userID = " + roomUser.userID + " score = " + runtime.data.score)
					TraceLog.match(this.idx,"operRoomRealtimeChanged user left room matchID = " + this.matchID_ + " roomID = " + realtime.roomID + " userID = " + roomUser.userID + " score = " + runtime.data.score)
					await runtime.saveAndRelease()
					changeRuntimes.push(runtime.data)
				} else {
					runtime?.release()
				}
			}
		}

		let lockID = MatchDefine.getLockID(this.matchID_,this.data_.gameData.gameID)
		for(let user of realtime.users) {
			let roomUser = roomInfo.users.find(v=>v.userID == user.userID)
			if(!roomUser) {
				roomUser = {
					userID:user.userID,
					lastScore:user.score,
				}
				roomInfo.users.push(roomUser)
			} else {
				roomUser.lastScore = user.score
			}
			roomUser.lastScore = await this.callException(kds.item.getUserLockItemCount,user.userID,lockID,this.data_.itemID)

			let runtime = await Module_MatchUserRuntime.getLockedSingleData({userID:user.userID,matchID:this.matchID_})
			runtime.data.roomID = realtime.roomID
			runtime.data.score = roomUser.lastScore
			runtime.data.scoreNum = new Decimal(roomUser.lastScore).toNumber()
			runtime.data.scoreChange = Decimal.sub(roomUser.lastScore,runtime.data.scoreOrigin).toString()
			await runtime.saveAndRelease()
			changeRuntimes.push(runtime.data)
			Log.oth.info("operRoomRealtimeChanged user in room matchID = " + this.matchID_ + " roomID = " + realtime.roomID + " userID = " + user.userID + " score = " + roomUser.lastScore)
			TraceLog.match(this.idx,"operRoomRealtimeChanged user in room matchID = " + this.matchID_ + " roomID = " + realtime.roomID + " userID = " + user.userID + " score = " + roomUser.lastScore)
		}
		await Module_MatchExecuterRoomInfo.updateOrInsert(roomInfo)
		if(changeRuntimes.length > 0) {
			MatchUtils.onUserRuntimesChanged(this.data_,changeRuntimes)
		}
	}
	private updating_ = false
	private prevUpdateTime_ = 0
	async onUpdate() {
		if(this.updating_) {
			return 
		}
		this.updating_ = true
		try {
			switch(this.data_.status) {
				case MatchDefine.MatchStatus.Signup:{
					await this.onUpdate_Status_Signup()
				} break 
				case MatchDefine.MatchStatus.Running:{
					await this.onUpdate_Status_Running()
				} break 
				case MatchDefine.MatchStatus.Ended:{
					await this.onUpdate_Status_Ended()
				} break 
			}
		} catch (error) {
			Log.oth.error("woker onUpdate error",error,this.data_)
		}
		this.updating_ = false
		this.prevUpdateTime_ = kdutils.getMillionSecond()

		if(this.data_.status == MatchDefine.MatchStatus.FullyEnded) {
			this.stopUpdate()
			this.sendToMaster(MatchIpcMessage.ToMaster_WorkerFullyEnded,{})
			return 
		}
	}

	// 处理状态为Signup的更新
	async onUpdate_Status_Signup() {
		let time = kdutils.getMillionSecond()
		// 开赛前十分钟推送消息
		let tipDurations = [
			10 * 60000,
			5 * 60000,
			3 * 60000,
		]
		let tipEvent = false 
		for(let tipDuration of tipDurations) {
			let targetTime = this.data_.startTime - tipDuration
			if(this.prevUpdateTime_ <= targetTime && time >= targetTime) {
				tipEvent = true 
				break 
			}
		}
		if(tipEvent) {
			let skip = 0
			let limit = 1000
			while(true) {
				let users = await Module_MatchUserSignUp.getOption({
					matchID:this.matchID_,
				},{
					skip,
					limit,
					projection:{
						userID:1,
					}
				})
				for(let user of users) {
					MatchUtils.sendMatchEvent({
						userID:user.userID,
						matchID:this.matchID_,
						type:MatchDefine.UserMatchEventType.ReadyStart,
						onlyPush:true,
					})
				}
				if(users.length < limit) {
					break 
				}
				skip += limit
			}
		}
		if(time < this.data_.startTime) {
			return 
		}
		
		let skip = 0
		let limit = 1000
		while(true) {
			let users = await Module_MatchUserSignUp.getOption({
				matchID:this.matchID_,
			},{
				skip,
				limit,
				projection:{
					userID:1,
				}
			})
			for(let user of users) {
				MatchUtils.sendMatchEvent({
					userID:user.userID,
					matchID:this.matchID_,
					type:MatchDefine.UserMatchEventType.Start,
					onlyPush:false,
				})
			}
			if(users.length < limit) {
				break 
			}
			skip += limit
		}
		await this.changeStatus(MatchDefine.MatchStatus.Running)
		await RedisLock.callInLock(RedisLock.MatchSignup(this.matchID_),30,async ()=>{
			let skip = 0
			let limit = 1000
			while(true) {
				let users = await Module_MatchUserSignUp.getOption({
					matchID:this.matchID_,
				},{
					skip,
					limit,
				})
				for(let user of users) {
					let runtime:MatchDefine.tUserRuntime = {
						matchID:this.matchID_,
						userID:user.userID,

						roomID:null,

						signupTime:user.timestamp,
						enterCount:1,

						scoreOrigin:"0",
						scoreChange:"0",
						score:"0",
						scoreNum:0,

						status:MatchDefine.UserMatchStatus.Wait,
						robot:!!user.robot,

						timestamp:time,
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time),
					}
					await Module_MatchUserRuntime.updateOrInsert({matchID:this.matchID_,userID:user.userID},runtime)
				}

				if(users.length < limit) {
					break 
				}
				skip += limit
			}
		})

		Log.oth.info("match signup ended matchID = " + this.matchID_)
		TraceLog.match(this.idx,"match signup ended matchID = " + this.matchID_)
	}

	// 发送用户进入房间请求
	async sendUserEnterRoom(userID:number,roomID:number,realtime?:RoomDefine.RoomRealtime) {
		realtime = realtime || await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			Log.oth.error("sendUserEnterRoom realtime not found roomID = " + roomID + " userID = " + userID)
			TraceLog.match(this.idx,"sendUserEnterRoom realtime not found roomID = " + roomID + " userID = " + userID)
			return false
		}
		if(realtime.users.find(v=>v.userID == userID)) {
			return true 
		}
		
		let gss = await Module_RoomGSSrsNode.get({gameID:realtime.gameData.gameID,name:realtime.gsName}) || []
		let gs = gss[kdutils.intRandom(0,gss.length)]
		if(!gs) {
			Log.oth.error("sendUserEnterRoom gs not found gsName = " + realtime.gsName + " roomID = " + roomID + " userID = " + userID)
			TraceLog.match(this.idx,"sendUserEnterRoom gs not found gsName = " + realtime.gsName + " roomID = " + roomID + " userID = " + userID)
			return false
		}
		let enterReq:GSRpcMethods.tUserEnterReq = {
			chairNo:null,
			system:{
				matchID:this.matchID_,
			}
		}
		return await this.sendUserEnterRoomToGS(userID,roomID,gs.name,enterReq)
	}
	// 发送用户进入房间请求到GS
	async sendUserEnterRoomToGS(userID:number,roomID:number,gsName:string,enterReq:GSRpcMethods.tUserEnterReq) {
		let b = await this.callException(SrsRpcMethods.LayerCenter.callGS,gsName,GSRpcMethods.userEnter,roomID,userID,enterReq)
		if(!b) {
			Log.oth.error("sendUserEnterRoom call userEnter failed roomID = " + roomID + " userID = " + userID)
			TraceLog.match(this.idx,"sendUserEnterRoom call userEnter failed roomID = " + roomID + " userID = " + userID)
			return false
		}
		// UserDCNHttpLayerUtils.dcnFilter([userID],SrsDCN.matchEnterRoom(),<SrsDCN.tMatchEnterRoom>{
		// 	matchID:this.matchID_,
		// 	roomID:roomID,
		// })
		UserDCNHttpLayerUtils.sendToUser(userID,GSMatchUserMsg.MatchStartEnterRoom,<GSMatchUserMsg.tMatchStartEnterRoomReq>{
			matchID:this.matchID_,
			roomID:roomID,
		})
		return true
	}

	async sendRoomCombine(fromRoomInfo:MatchDefine.tExecuterRoomInfo,toRoomInfo:MatchDefine.tExecuterRoomInfo) {
		let switchRoom:GSMatchControl.tRoomCombine = {
			fromRoomID:fromRoomInfo.roomID,
			toRoomID:toRoomInfo.roomID,
			userIDs:fromRoomInfo.users.map(v=>v.userID),
		}
		Log.oth.info("sendRoomCombine start fromRoomID = " + fromRoomInfo.roomID + " toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_,switchRoom)
		let bFrom = false 
		let bTo = false 
		let toRealtime = await Module_RoomRealtime.getMain(toRoomInfo.roomID)
		if(!toRealtime) {
			Log.oth.error("sendRoomCombine toRealtime not found toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_)
			TraceLog.match(this.idx,"sendRoomCombine toRealtime not found toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_)
			return false 
		}
		let matchUserRuntimes = await Module_MatchUserRuntime.get({userID:{$in:switchRoom.userIDs},matchID:this.matchID_})
		for(let runtime of matchUserRuntimes) {
			if(runtime.robot) {
				continue 
			}
			UserDCNHttpLayerUtils.sendToUser(runtime.userID,GSMatchUserMsg.WaitForCombine,<GSMatchUserMsg.tWaitForCombineNT>{
				roomID:toRoomInfo.roomID,
			})
		}
		do { 
			bFrom = await this.callGS(fromRoomInfo.gsName,fromRoomInfo.roomID,GSMatchControl.RoomCombine,switchRoom)
			Log.oth.info("sendRoomCombine [from] fromRoomID = " + fromRoomInfo.roomID + " toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_ + " result = " + bFrom)
			TraceLog.match(this.idx,"sendRoomCombine [from] fromRoomID = " + fromRoomInfo.roomID + " toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_ + " result = " + bFrom)
			if(!bFrom) {
				for(let runtime of matchUserRuntimes) {
					if(runtime.robot) {
						continue 
					}
					UserDCNHttpLayerUtils.sendToUser(runtime.userID,GSMatchUserMsg.WaitForCombine,<GSMatchUserMsg.tWaitForCombineNT>{
						roomID:null,
					})
				}
				break 
			}
			await Module_MatchUserRuntime.updateManyOrigin({matchID:this.matchID_,userID:{$in:switchRoom.userIDs}},{
				$set:{
					roomID:null,
					status:MatchDefine.UserMatchStatus.ReadyToPlay,
				}
			})
			await kdasync.timeout(500)
			// switchRoom.userIDs = realUserIDs
			bTo = await this.callGS(toRoomInfo.gsName,toRoomInfo.roomID,GSMatchControl.RoomCombine,switchRoom)
			if(!bTo) {
				break 
			}
			let enterUserIDs:number[] = []
			for(let runtime of matchUserRuntimes) {
				if(runtime.robot) {
					enterUserIDs.push(runtime.userID)
					continue 
				}
				let b = await this.sendUserEnterRoom(runtime.userID,toRoomInfo.roomID,toRealtime)
				if(b) {
					enterUserIDs.push(runtime.userID)
					
					UserDCNHttpLayerUtils.sendToUser(runtime.userID,GSMatchUserMsg.CombineFinished,<GSMatchUserMsg.tCombineFinishedNT>{
						roomID:toRoomInfo.roomID,
					})
				}
			}
			await Module_MatchUserRuntime.updateManyOrigin({matchID:this.matchID_,userID:{$in:enterUserIDs}},{
				$set:{
					roomID:toRoomInfo.roomID,
					status:MatchDefine.UserMatchStatus.Playing,
				}
			})
			
			// 恢复游戏
			await this.callGS(toRealtime.gsName,toRealtime.roomID,GSMatchControl.GameResume, <GSMatchControl.tGameResume>{
				timeoutSec:0,
				resumeContainsWait:true,
				nextWait:{
					timeoutSec:0,		// null | 0是无限等待
					waitType:GSMatchControl.GameWaitType.System,
				}
			})
			Log.oth.info("sendRoomCombine [to] fromRoomID = " + fromRoomInfo.roomID + " toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_ + " result = " + bTo,enterUserIDs)
			TraceLog.match(this.idx,"sendRoomCombine [to] fromRoomID = " + fromRoomInfo.roomID + " toRoomID = " + toRoomInfo.roomID + " matchID = " + this.matchID_ + " result = " + bTo,enterUserIDs)
		} while(false)
		return bFrom && bTo
	}

	async createRoomForUserRuntimes(runtimes:MatchDefine.tUserRuntime[]) {
		let roomData:RoomDefine.RoomData = await this.callException(kds.room.create.match,this.matchID_,this.data_.gameData,<GSRpcMethods.tCreateRoomExtensionParams>{
			lastForever:true,
			pauseBeforePlaying:true,
			matchID:this.matchID_,
			lockID:MatchDefine.getLockID(this.matchID_,this.data_.gameData.gameID),
		})
		if(!roomData) {
			Log.oth.error("match start create room failed matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match start create room failed matchID = " + this.matchID_)
			return false  
		}
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomData.roomID)
		if(!realtime) {
			Log.oth.error("match start created room realtime not found roomID = " + roomData.roomID + " matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match start created room realtime not found roomID = " + roomData.roomID + " matchID = " + this.matchID_)
			return false 
		}
		let timeout = 10000
		let time = kdutils.getMillionSecond()
		while(true) {
			await kdasync.timeout(500)
			realtime = await Module_RoomRealtime.getMain(roomData.roomID)
			if(realtime.gsName) {
				break 
			}
			if(kdutils.getMillionSecond() - time >= timeout) {
				Log.oth.error("match start wait created room gsName timeout roomID = " + roomData.roomID + " matchID = " + this.matchID_)
				TraceLog.match(this.idx,"match start wait created room gsName timeout roomID = " + roomData.roomID + " matchID = " + this.matchID_)
				return false 
			}
		}
		
		await this.callGS(realtime.gsName,roomData.roomID,GSMatchControl.GamePause, <GSMatchControl.tGamePause>{
			timeoutSec:0,
		})

		let lockID = MatchDefine.getLockID(this.matchID_,this.data_.gameData.gameID)
		for(let runtime of runtimes) {
			let success = false 
			if(runtime.robot) {
				success = true 
			} else {
				success = await this.sendUserEnterRoom(runtime.userID,roomData.roomID,realtime)
				if(!success) {
					Log.oth.error("match start user enter room failed userID = " + runtime.userID + " roomID = " + roomData.roomID + " matchID = " + this.matchID_)
					TraceLog.match(this.idx,"match start user enter room failed userID = " + runtime.userID + " roomID = " + roomData.roomID + " matchID = " + this.matchID_)

					runtime.status = MatchDefine.UserMatchStatus.Out
					runtime.roomID = null 
					runtime.outTimestamp = time
					await Module_MatchUserRuntime.update({matchID:this.matchID_,userID:runtime.userID},runtime)
					MatchUtils.onUserRuntimeChanged(this.data_,runtime)
					
					this.callException(kds.item.unlockUser,runtime.userID,lockID)

					MatchUtils.sendMatchEvent({
						userID:runtime.userID,
						matchID:this.matchID_,
						type:MatchDefine.UserMatchEventType.Out_EnterFailed,
						onlyPush:false,
					})
					continue 
				}
			}
			Log.oth.info("match start user enter room success userID = " + runtime.userID + " roomID = " + roomData.roomID + " matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match start user enter room success userID = " + runtime.userID + " roomID = " + roomData.roomID + " matchID = " + this.matchID_)
			runtime.status = MatchDefine.UserMatchStatus.Playing
			runtime.roomID = roomData.roomID
			await Module_MatchUserRuntime.update({matchID:this.matchID_,userID:runtime.userID},runtime)
			MatchUtils.onUserRuntimeChanged(this.data_,runtime)
		}

		// 恢复游戏
		await this.callGS(realtime.gsName,roomData.roomID,GSMatchControl.GameResume, <GSMatchControl.tGameResume>{
			timeoutSec:0,
			resumeContainsWait:true,
			nextWait:{
				timeoutSec:0,		// null | 0是无限等待
				waitType:GSMatchControl.GameWaitType.System,
			}
		})
		return true 
	}

	async createMultiRoomForUserRuntimes(runtimes:MatchDefine.tUserRuntime[]) {
		let count = runtimes.length
		let gameSet = GameSet.createWithData(this.data_.gameData)
		let maxUserCount = gameSet.getUserCount()
		let roomCount = Math.ceil(count / maxUserCount)
		let planCounts: number[] = []
		for(let i = 0 ; i < roomCount; i ++) {
			if(i == roomCount -1) {
				planCounts.push(count - maxUserCount * i)
			} else {
				planCounts.push(maxUserCount)
			}
		}
		if(planCounts[roomCount -1] < 2 && roomCount >= 2) {
			let lastCount = planCounts[roomCount -1] + planCounts[roomCount -2]
			planCounts[roomCount -2] -= Math.ceil(lastCount / 2)
			planCounts[roomCount -1] = Math.ceil(lastCount - planCounts[roomCount -2])
		}
		let skip = 0
		for(let planCount of planCounts) {
			let subRuntimes = runtimes.slice(skip,skip + planCount)
			skip += planCount
			let b = await this.createRoomForUserRuntimes(subRuntimes)
			if(!b) {
				Log.oth.error("createMultiRoomForUserRuntimes createRoomForUserRuntimes failed matchID = " + this.matchID_ + " planCount = " + planCount,subRuntimes.map(v=>v.userID))
				TraceLog.match(this.idx,"createMultiRoomForUserRuntimes createRoomForUserRuntimes failed matchID = " + this.matchID_ + " planCount = " + planCount,subRuntimes.map(v=>v.userID))
			}
		}
	}

	private leadRoomInfo_:MatchDefine.tExecuterRoomInfo
	private roomInfos_:MatchDefine.tExecuterRoomInfo[]
	async onUpdate_Status_Running() {
		let time = kdutils.getMillionSecond()
		if(time >= this.data_.startTime + this.data_.duration) {
			Log.oth.info("match running ended matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match running ended matchID = " + this.matchID_)
			await this.sendAllRoomWaitRoundEnd()
			await this.changeStatus(MatchDefine.MatchStatus.Ended)
			return 
		}

		// 准备用户检查
		if(!await this.onUpdate_Status_Running_ReadyUsers(time)) {
			Log.oth.info("[onUpdate_Status_Running_ReadyUsers] skip loop")
			return 
		}
		// 初始化
		if(!await this.onUpdate_Status_Running_LeadInfo(time)) {
			Log.oth.info("[onUpdate_Status_Running_LeadInfo] skip loop")
			return 
		}
		// 用户出局检查
		if(!await this.onUpdate_Status_Running_UserOut(time)) {
			Log.oth.info("[onUpdate_Status_Running_UserOut] skip loop")
			return 
		}
		// 无房间用户检查
		if(!await this.onUpdate_Status_Running_NoRoomUserCheck(time)) {
			Log.oth.info("[onUpdate_Status_Running_NoRoomUserCheck] skip loop")
			return 
		}
		// 合桌检查
		if(!await this.onUpdate_Status_Running_CombineRoomCheckEnd(time)) {
			Log.oth.info("[onUpdate_Status_Running_CombineRoomCheckEnd] skip loop")
			return 
		}
	}

	async onUpdate_Status_Running_LeadInfo(time:number) {
		let gameSet = GameSet.createWithData(this.data_.gameData)
		let minUserCount = 2
		// vtest 测试 combine 合桌
		let maxUserCount = gameSet.getUserCount()

		// TraceLog.match(this.idx,"onUpdate_Status_Running_LeadInfo leadRoomInfo =",leadRoomInfo)
		// 首次进入Running状态，分配房间
		if(!this.leadRoomInfo_) {
			Log.oth.info("leadRoomInfo not found matchID = " + this.matchID_ + " executerID = " + this.executerID_)
			this.leadRoomInfo_ = {
				matchID:this.matchID_,
				executerID:this.executerID_,
				roomID:null,
				waitingCombine:false,
				forceWaitingCombine:false,
				status:null,
				gsName:null,
				users:[]
			}
			this.roomInfos_ = []
			this.roomInfos_.push(this.leadRoomInfo_)
			await Module_MatchExecuterRoomInfo.updateOrInsert({matchID:this.matchID_,executerID:this.executerID_,roomID:null},this.leadRoomInfo_)

			let count = await Module_MatchUserRuntime.getCount({
				matchID:this.matchID_,
				status:{$in:[
					MatchDefine.UserMatchStatus.ReadyToPlay,
					MatchDefine.UserMatchStatus.Playing,
				]},
			})
			Log.oth.info("match start distribute rooms matchID = " + this.matchID_ + " userCount = " + count)
			TraceLog.match(this.idx,"match start distribute rooms matchID = " + this.matchID_ + " userCount = " + count)
			if(count < minUserCount) {
				this.changeStatus(MatchDefine.MatchStatus.Ended)
				Log.oth.info("not enough user to start match matchID = " + this.matchID_ + " userCount = " + count)
				TraceLog.match(this.idx,"not enough user to start match matchID = " + this.matchID_ + " userCount = " + count)
				return 
			}
			let countPlans:number[] = []
			let lastCount = count % maxUserCount
			let roomCount = Math.ceil(count / maxUserCount)
			if(lastCount > 0 && lastCount < minUserCount) {
				let curCount = count
				for(let i = 0 ; i < roomCount - 2; i ++) {
					countPlans.push(maxUserCount)
					curCount -= maxUserCount
				}
				let count1 = Math.ceil(curCount / 2)
				let count2 = curCount - count1
				countPlans.push(count1)
				countPlans.push(count2)
			} else {
				let curCount = count
				for(let i = 0 ; i < roomCount; i ++) {
					if(i == roomCount -1 && curCount > 0) {
						countPlans.push(curCount)
					} else {
						countPlans.push(maxUserCount)
						curCount -= maxUserCount
					}
				}
			}
			let mutexUserIDs = new Set<string>()
			let skip = 0
			await RedisLock.callInLock(RedisLock.MatchUserRuntimeGlobal(this.matchID_),30,async ()=>{
				for(let planCount of countPlans) {
					let userRuntimes = await Module_MatchUserRuntime.getOption({
						matchID:this.matchID_,
						status:{$in:[
							MatchDefine.UserMatchStatus.ReadyToPlay,
							MatchDefine.UserMatchStatus.Playing,
						]},
						userID:{$nin:Array.from(mutexUserIDs)},
					},{
						skip,
						limit:planCount,
						sort:{signupTime:1},
					})
					skip += planCount
					if(userRuntimes.length == 0) {
						Log.oth.error("match start get user runtimes empty matchID = " + this.matchID_ + " planCount = " + planCount)
						continue 
					}
					let filterRuntimes:MatchDefine.tUserRuntime[] = []
					for(let runtime of userRuntimes) {
						if(mutexUserIDs.has(runtime.userID.toString())) {
							Log.oth.error("match start user runtime duplicated userID = " + runtime.userID + " matchID = " + this.matchID_)
							continue 
						}
						filterRuntimes.push(runtime)
						mutexUserIDs.add(runtime.userID.toString())
					}
					if(filterRuntimes.length < minUserCount) {
						Log.oth.error("match start user runtimes not enough after filter matchID = " + this.matchID_ + " planCount = " + planCount + " filteredCount = " + filterRuntimes.length)
						continue 
					}
					let b = await this.createRoomForUserRuntimes(filterRuntimes)
					if(!b) {
						Log.oth.error("match start create room for user runtimes failed matchID = " + this.matchID_,filterRuntimes.map(v=>v.userID))
						TraceLog.match(this.idx,"match start create room for user runtimes failed matchID = " + this.matchID_,filterRuntimes.map(v=>v.userID))
					} else {
						Log.oth.info("match start create room for user runtimes success matchID = " + this.matchID_ + " userCount = " + filterRuntimes.length,filterRuntimes.map(v=>v.userID))
						TraceLog.match(this.idx,"match start create room for user runtimes success matchID = " + this.matchID_ + " userCount = " + filterRuntimes.length,filterRuntimes.map(v=>v.userID))
					}
				}
			})
		} else {
			this.roomInfos_ = await Module_MatchExecuterRoomInfo.get({
				matchID:this.matchID_,
				executerID:this.executerID_,
			})
			let realtimes = await Module_RoomRealtime.getOption({
				matchID:this.matchID_,
			})
			for(let realtime of realtimes) {
				await this.operRoomRealtimeChanged(realtime)
			}
		}
		return true 
	}

	async onUpdate_Status_Running_ReadyUsers(time:number) {
		let lockItemCount = this.data_.lockItemCount ? new Decimal(this.data_.lockItemCount).toString() : null
		let gameSet = GameSet.createWithData(this.data_.gameData)
		let bb = gameSet.iSets[TexasRule.Group6_SBlind] * 2
		await RedisLock.callInLock(RedisLock.MatchUserRuntimeGlobal(this.matchID_),30,async ()=>{
			let limit = 1000
			let skip = 0
			let lockID = MatchDefine.getLockID(this.data_.matchID,this.data_.gameData.gameID)
			let updateRuntimes:MatchDefine.tUserRuntime[] = []
			while(true) {
				let runtimes = await Module_MatchUserRuntime.getOption({
					matchID:this.matchID_,
					status:{$lte:MatchDefine.UserMatchStatus.Ready},
				},{
					skip,
					limit,
				})
				for(let runtime of runtimes) {
					let count = await this.callException(kds.item.matchLockItem,runtime.userID,lockID,this.data_.itemID,lockItemCount,
						ItemDefine.SerialType.MatchBuyin
					)
					let countValue = new Decimal(count || "0")
					if(count && countValue.greaterThan(bb)) {
						runtime.status = MatchDefine.UserMatchStatus.ReadyToPlay
						runtime.scoreOrigin = await this.callException(kds.item.getUserLockItemCount,runtime.userID,lockID,this.data_.itemID)
						runtime.score = runtime.scoreOrigin
						runtime.scoreNum = new Decimal(runtime.score).toNumber()
						Log.oth.info("match ready to play user lock item success matchID = " + this.matchID_ + " userID = " + runtime.userID + " itemID = " + this.data_.itemID + " score = " + runtime.score)
						TraceLog.match(this.idx,"match ready to play user lock item success matchID = " + this.matchID_ + " userID = " + runtime.userID + " itemID = " + this.data_.itemID + " score = " + runtime.score)
					} else {
						runtime.status = MatchDefine.UserMatchStatus.Out
						runtime.outTimestamp = kdutils.getMillionSecond()
						Log.oth.info("match ready to play user lock item failed user out matchID = " + this.matchID_ + " userID = " + runtime.userID + " itemID = " + this.data_.itemID)
						TraceLog.match(this.idx,"match ready to play user lock item failed user out matchID = " + this.matchID_ + " userID = " + runtime.userID + " itemID = " + this.data_.itemID)
						
						MatchUtils.sendMatchEvent({
							userID:runtime.userID,
							matchID:this.matchID_,
							type:MatchDefine.UserMatchEventType.Out_NotReady,
							onlyPush:false,
						})
					}
					updateRuntimes.push(runtime)
				}
				if(runtimes.length < limit) {
					break 
				}
				skip += limit
			}
			for(let runtime of updateRuntimes) {
				await Module_MatchUserRuntime.update({matchID:this.matchID_,userID:runtime.userID},runtime)
			}
			MatchUtils.onUserRuntimesChanged(this.data_,updateRuntimes)
		})
		return true
	}

	async onUpdate_Status_Running_UserOut(time:number) {
		let gameSet = GameSet.createWithData(this.data_.gameData)
		let bb = gameSet.iSets[TexasRule.Group6_SBlind] * 2
		return await new Promise<boolean>(async (resolve,reject)=>{
			this.qRealtime_.call(async ()=>{
				let userOuts = false 
				// 先检查出局
				for(let roomInfo of this.roomInfos_) {
					if(!roomInfo.roomID || roomInfo.status != RoomDefine.RoomStatus.JuEnd) {
						continue 
					}
					for(let i = roomInfo.users.length -1 ; i >= 0 ; i --) {
						let user = roomInfo.users[i]
						if(new Decimal(user.lastScore).lessThan(bb)) {
							this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.UserOut,<GSMatchControl.tUserOut>{
								userID:user.userID,
								reason:"积分不足小盲注的两倍，强制退出比赛",
							})
							Log.oth.info("user out of match score not enough matchID = " + this.matchID_ + " userID = " + user.userID)
							TraceLog.match(this.idx,"user out of match score not enough matchID = " + this.matchID_ + " userID = " + user.userID)

							userOuts = true 
							roomInfo.users.splice(i,1)

							let userRuntime = await Module_MatchUserRuntime.getLockedSingleData({userID:user.userID,matchID:this.matchID_})
							if(userRuntime) {
								userRuntime.data.status = MatchDefine.UserMatchStatus.Out
								userRuntime.data.outTimestamp = kdutils.getMillionSecond()
								userRuntime.data.roomID = null
								await userRuntime.saveAndRelease()
								let lockID = MatchDefine.getLockID(this.matchID_,this.data_.gameData.gameID)
								this.callException(kds.item.unlockUser,user.userID,lockID)
								MatchUtils.sendMatchEvent({
									userID:user.userID,
									matchID:this.matchID_,
									type:MatchDefine.UserMatchEventType.Out,
									onlyPush:false,
								})
							}
						}
					}
				}
				// 如果有出局的，先处理出局的
				if(userOuts) {
					resolve(false)
					return 
				}
				// 继续执行
				resolve(true)
			})
		})
	}

	async onUpdate_Status_Running_NoRoomUserCheck(time:number) {
		let gameSet = GameSet.createWithData(this.data_.gameData)
		let minUserCount = 2
		let maxUserCount = gameSet.getUserCount()
		return await new Promise<boolean>(async (resolve,reject)=>{
			this.qRealtime_.call(async ()=>{
				let noRoomUserCount = await Module_MatchUserRuntime.getCount({
					matchID:this.matchID_,
					status:{$in:[
						// MatchDefine.UserMatchStatus.Playing,
						MatchDefine.UserMatchStatus.ReadyToPlay,
					]},
					roomID:null,
				})
				if(noRoomUserCount == 0) {
					resolve(true)
					return 
				}
				// vtodo:分配用户到房间
				let runtimes = await Module_MatchUserRuntime.get({
					matchID:this.matchID_,
					status:{$in:[
						// MatchDefine.UserMatchStatus.Playing,
						MatchDefine.UserMatchStatus.ReadyToPlay,
					]},
					roomID:null,
				})
				let noRoomRuntimes:MatchDefine.tUserRuntime[] = []
				let roomAddCounts:{
					roomInfo:MatchDefine.tExecuterRoomInfo,
					userIDs:number[],
				}[] = []
				// 先尝试加入已有房间
				for(let runtime of runtimes) {
					let selectRoomInfo:MatchDefine.tExecuterRoomInfo = null
					for(let roomInfo of this.roomInfos_) {
						if(roomInfo.users.length < maxUserCount) {
							let addCountInfo = roomAddCounts.find(v=>v.roomInfo.roomID == roomInfo.roomID)
							if(!addCountInfo) {
								addCountInfo = {
									roomInfo:roomInfo,
									userIDs:[],
								}
								roomAddCounts.push(addCountInfo)
							}
							if(roomInfo.users.length + addCountInfo.userIDs.length > maxUserCount) {
								continue 
							}
							addCountInfo.userIDs.push(runtime.userID)
							selectRoomInfo = roomInfo
							break 
						}
					}
					if(!selectRoomInfo) {
						noRoomRuntimes.push(runtime)
					}
				}
				// 创建新房间
				if(noRoomRuntimes.length > 0) {
					Log.oth.info("match running no room to enter matchID = " + this.matchID_ + " noRoomUserCount = " + noRoomRuntimes.length)
					TraceLog.match(this.idx,"match running no room to enter matchID = " + this.matchID_ + " noRoomUserCount = " + noRoomRuntimes.length)
					// 满足开新房间条件
					if(noRoomRuntimes.length >= minUserCount) {
						await this.createMultiRoomForUserRuntimes(noRoomRuntimes)
					} else {
						// 不满足开新房间条件，拆最后一个房间的用户进去
						if(roomAddCounts.length > 0) {
							// 这里没有检测minUserCount，如果minUserCount>2，可能会导致开启的房间人数不够
							let lastCountInfo = roomAddCounts[roomAddCounts.length -1]
							roomAddCounts.splice(roomAddCounts.length -1,1)
							for(let userID of lastCountInfo.userIDs) {
								noRoomRuntimes.push(runtimes.find(v=>v.userID == userID))
							}
							Log.oth.info("match running no room user not enough to create room, move to existing rooms matchID = " + this.matchID_ + " moveUserCount = " + lastCountInfo.userIDs.length,noRoomRuntimes.map(v=>v.userID))
							TraceLog.match(this.idx,"match running no room user not enough to create room, move to existing rooms matchID = " + this.matchID_ + " moveUserCount = " + lastCountInfo.userIDs.length,noRoomRuntimes.map(v=>v.userID))
							let roomData = await this.createRoomForUserRuntimes(noRoomRuntimes)
							if(!roomData) {
								Log.oth.error("match running no room user not enough to create room failed matchID = " + this.matchID_ + " moveUserCount = " + lastCountInfo.userIDs.length,noRoomRuntimes.map(v=>v.userID))
								TraceLog.match(this.idx,"match running no room user not enough to create room failed matchID = " + this.matchID_ + " moveUserCount = " + lastCountInfo.userIDs.length,noRoomRuntimes.map(v=>v.userID))
								for(let runtime of noRoomRuntimes) {
									runtime.status = MatchDefine.UserMatchStatus.ReadyToPlay
									runtime.roomID = null
									await Module_MatchUserRuntime.update({matchID:this.matchID_,userID:runtime.userID},runtime)	
								}
								MatchUtils.onUserRuntimesChanged(this.data_,noRoomRuntimes)
							}
						} else {
							Log.oth.error("match running no room user not enough to create room and no existing room to move matchID = " + this.matchID_ + " noRoomUserCount = " + noRoomRuntimes.length,noRoomRuntimes.map(v=>v.userID))
							TraceLog.match(this.idx,"match running no room user not enough to create room and no existing room to move matchID = " + this.matchID_ + " noRoomUserCount = " + noRoomRuntimes.length,noRoomRuntimes.map(v=>v.userID))
						}
					}
				}
				for(let addCountInfo of roomAddCounts) {
					for(let userID of addCountInfo.userIDs) {
						let runtime = runtimes.find(v=>v.userID == userID)
						let roomInfo = addCountInfo.roomInfo
						if(!runtime.robot) {
							this.sendUserEnterRoomToGS(runtime.userID,roomInfo.roomID,roomInfo.gsName,<GSRpcMethods.tUserEnterReq>{
								chairNo:null,
								system:{
									matchID:this.matchID_,
								}
							})
						}
						roomInfo.users.push({
							userID:runtime.userID,
							lastScore:"0",
						})
						runtime.status = MatchDefine.UserMatchStatus.Playing
						runtime.roomID = roomInfo.roomID
						await Module_MatchUserRuntime.update({matchID:this.matchID_,userID:runtime.userID},runtime)
						MatchUtils.onUserRuntimesChanged(this.data_,noRoomRuntimes)
						Log.oth.info("match running no room user enter existing room matchID = " + this.matchID_ + " userID = " + runtime.userID + " roomID = " + roomInfo.roomID)
						TraceLog.match(this.idx,"match running no room user enter existing room matchID = " + this.matchID_ + " userID = " + runtime.userID + " roomID = " + roomInfo.roomID)
					}
				}
				resolve(false)
				return 
			})
		})
	}

	async onUpdate_Status_Running_CombineRoomCheckEnd(time:number) {
		let rt = {
			switchToEnd:false,
			containsContinue:false,
			containsCombine:false,
		}
		let b = await new Promise<boolean>(async (resolve,reject)=>{
			this.qRealtime_.call(async ()=>{
				// 检查是否结束
				if(this.roomInfos_.length == 1) {
					rt.switchToEnd = true
					Log.oth.info("match running ended(match to end, only one room left) matchID = " + this.matchID_)
					TraceLog.match(this.idx,"match running ended(match to end, only one room left) matchID = " + this.matchID_)
					resolve(true)
					return 
				} else if(this.roomInfos_.length == 2) {
					let roomInfo = this.roomInfos_.find(v=>v.roomID != null)
					if(roomInfo.users.length <= 1) {
						rt.switchToEnd = true
						Log.oth.info("match running ended(match to end, las t room only one user) matchID = " + this.matchID_)
						TraceLog.match(this.idx,"match running ended(matchto end, last room only one user) matchID = " + this.matchID_)
						resolve(true)
						return 
					}
					if(roomInfo.status == RoomDefine.RoomStatus.JuEnd) {
						// 直接继续
						this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.GameResume,<GSMatchControl.tGameResume>{
							timeoutSec:0,
							resumeContainsWait:true,
							nextWait:{
								waitType:GSMatchControl.GameWaitType.System,
							}
						})
						rt.containsContinue = true 
					}
				} else {
					// vtodo 合桌
					let combineRoomInfos:MatchDefine.tExecuterRoomInfo[] = []
					for(let roomInfo of this.roomInfos_) {
						if(!roomInfo.roomID) {
							continue 
						}
						if(roomInfo.status == RoomDefine.RoomStatus.JuEnd) {
							let continueGame = true 
							if(!roomInfo.waitingCombine) {
								if(roomInfo.users.length <= this.data_.combineMinUserCount) {
									roomInfo.waitingCombine = true
									roomInfo.forceWaitingCombine = true 
									continueGame = false 
									combineRoomInfos.push(roomInfo)
									Log.oth.info("match combine room marked waitingCombine combineMinUserCount roomID = " + roomInfo.roomID + " matchID = " + this.matchID_)
									TraceLog.match(this.idx,"match combine room marked waitingCombine roomID = " + roomInfo.roomID + " matchID = " + this.matchID_)
									
									this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.GameForceWaitCombine,<GSMatchControl.tGameForceWaitCombine>{
										timeoutSec:0,
										b:true
									})
								} else if(roomInfo.users.length <= this.data_.combineStartUserCount) {
									roomInfo.waitingCombine = true
									roomInfo.forceWaitingCombine = false 
									continueGame = false 
									combineRoomInfos.push(roomInfo)
									Log.oth.info("match combine room marked waitingCombine combineStartUserCount roomID = " + roomInfo.roomID + " matchID = " + this.matchID_)
									TraceLog.match(this.idx,"match combine room marked waitingCombine roomID = " + roomInfo.roomID + " matchID = " + this.matchID_)
								}
							} else {
								continueGame = false
							}

							if(continueGame) {
								rt.containsContinue = true 
								this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.GameResume,<GSMatchControl.tGameResume>{
									timeoutSec:0,
									resumeContainsWait:true,
									nextWait:{
										waitType:GSMatchControl.GameWaitType.System,
									}
								})
							}
						}
					}
					if(combineRoomInfos.length >= 2) {
						Log.oth.info("match combine rooms count = " + combineRoomInfos.length + " matchID = " + this.matchID_)
						TraceLog.match(this.idx,"match combine rooms count = " + combineRoomInfos.length + " matchID = " + this.matchID_)
						// 开始合桌
						let gameSet = GameSet.createWithData(this.data_.gameData)
						let maxUserCount = gameSet.getUserCount()
						combineRoomInfos.sort((a,b)=>a.users.length - b.users.length)
						let combineResults:MatchDefine.tExecuterRoomInfo[][] = []
						for(let combineRoomInfo of combineRoomInfos) {
							let lastGroup = combineResults[combineResults.length -1]
							if(!lastGroup) {
								lastGroup = [combineRoomInfo]
								combineResults.push(lastGroup)
								continue 
							}
							let userCount = 0
							for(let roomInfo of lastGroup) {
								userCount += roomInfo.users.length
							}
							if(userCount + combineRoomInfo.users.length <= maxUserCount) {
								lastGroup.push(combineRoomInfo)
							} else {
								combineResults.push([combineRoomInfo])
							}
						}
						Log.oth.info("match combine rooms groups = " + combineResults.length + " matchID = " + this.matchID_)
						TraceLog.match(this.idx,"match combine rooms groups = " + combineResults.length + " matchID = " + this.matchID_,combineResults)
						let ps = []
						for(let combineGroup of combineResults) {
							if(combineGroup.length >= 2) {
								let targetRoomInfo = combineGroup[0]
								Log.oth.info("match combine rooms target roomID = " + targetRoomInfo.roomID + " matchID = " + this.matchID_)
								TraceLog.match(this.idx,"match combine rooms target roomID = " + targetRoomInfo.roomID + " matchID = " + this.matchID_)
								for(let i = 1 ; i < combineGroup.length; i ++) {
									let fromRoomInfo = combineGroup[i]
									fromRoomInfo.waitingCombine = true 
									ps.push(
										this.sendRoomCombine(fromRoomInfo,targetRoomInfo)
									)
									fromRoomInfo.waitingCombine = false 
									targetRoomInfo.waitingCombine = false 
									Log.oth.info("match combine rooms from roomID = " + fromRoomInfo.roomID + " to roomID = " + targetRoomInfo.roomID + " matchID = " + this.matchID_ + " gIdx = " + (ps.length - 1))
									TraceLog.match(this.idx,"match combine rooms from roomID = " + fromRoomInfo.roomID + " to roomID = " + targetRoomInfo.roomID + " matchID = " + this.matchID_ + " gIdx = " + (ps.length - 1))
								}
								rt.containsCombine = true
							} else {
								let roomInfo = combineGroup[0]
								if(roomInfo.forceWaitingCombine) {
									Log.oth.info("match combine room force waiting combine but no enough rooms to combine, end match roomID = " + roomInfo.roomID + " matchID = " + this.matchID_)
									TraceLog.match(this.idx,"match combine room force waiting combine but no enough rooms to combine, end match roomID = " + roomInfo.roomID + " matchID = " + this.matchID_)
								} else {
									roomInfo.waitingCombine = false 
									rt.containsContinue = true 
									// 继续游戏
									await this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.GameResume,<GSMatchControl.tGameResume>{
										timeoutSec:0,
										resumeContainsWait:true,
										nextWait:{
											waitType:GSMatchControl.GameWaitType.System,
										}
									})
								}
							}
						}
						if(ps.length > 0) {
							// 等待用户切换完成
							let bs = await Promise.all(ps)
							for(let i = 0 ; i < bs.length; i ++) {
								if(!bs[i]) {
									Log.oth.error("match combine rooms failed matchID = " + this.matchID_ + " gIdx = " + i)
									TraceLog.match(this.idx,"match combine rooms failed matchID = " + this.matchID_ + " gIdx = " + i)
								}
							}
						}
					}
				}
				resolve(true)
				return 
			})
		})
		Log.oth.info("match running combine check end result matchID = " + this.matchID_ + " b = " + b,rt)
		if(rt.switchToEnd) {
			await this.changeStatus(MatchDefine.MatchStatus.Ended)
			this.sendAllRoomWaitRoundEnd()
			Log.oth.info("match running ended(match to end) matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match running ended(match to end) matchID = " + this.matchID_)
			return false
		} else if(rt.containsContinue || rt.containsCombine) {
			// 继续处理
			Log.oth.info("match running continue after combine/continue check matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match running continue after combine/continue check matchID = " + this.matchID_)
			await kdasync.timeout(10000)
			Log.oth.info("match running continue after combine/continue check matchID = " + this.matchID_)
			TraceLog.match(this.idx,"match running continue after combine/continue check matchID = " + this.matchID_)
			return false 
		}
		return true 
	}
	async sendAllRoomWaitRoundEnd() {
		for(let roomInfo of this.roomInfos_) {
			if(roomInfo.roomID) {
				await this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.GameRoundEnd,<GSMatchControl.tGameRoundEnd>{
					waitEnd:true,roundEndRemoveType:RoomDefine.RemoveType.Match,
					removeUserMatchID:true,
				})
			}
		}
	}
	
	async onUpdate_Status_Ended() {
		// wait all room end
		let time = kdutils.getMillionSecond()
		if(this.roomInfos_.length != 1) {
			// 还有房间在运行,检查是否超时
			if(time - this.data_.changeStatusTimestamp >= 1 * 60000) {
				Log.oth.info("match ended force all room end matchID = " + this.matchID_)
				TraceLog.match(this.idx,"match ended force all room end matchID = " + this.matchID_)
				for(let roomInfo of this.roomInfos_) {
					await this.callGS(roomInfo.gsName,roomInfo.roomID,GSMatchControl.GameRoundEnd,<GSMatchControl.tGameRoundEnd>{
						waitEnd:false,roundEndRemoveType:RoomDefine.RemoveType.MatchForce,
					})
				}
				await kdasync.timeout(10000)
			} else {
				Log.oth.info("match ended waiting all room end matchID = " + this.matchID_)
				TraceLog.match(this.idx,"match ended waiting all room end matchID = " + this.matchID_)
				return false
			}
		}
		let lockID = MatchDefine.getLockID(this.matchID_,this.data_.gameData.gameID)
		let date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		await RedisLock.callInLock(RedisLock.MatchUserRuntimeGlobal(this.matchID_),30,async ()=>{
			let skip = 0
			let limit = 1000
			let rankUsers:{userID:number,score:string,scoreNum:number}[] = []
			let rankLoseUsers:{userID:number,score:string,scoreNum:number,outTimestamp:number}[] = []
			while(true) {
				let runtimes = await Module_MatchUserRuntime.getOption({
					matchID:this.matchID_,
				},{
					skip,
					limit,
				})
				for(let runtime of runtimes) {
					let count = await this.callException(kds.item.getUserLockItemCount,runtime.userID,lockID,this.data_.itemID)
					count = new Decimal(count || 0)
					let scoreChange = Decimal.sub(count,runtime.scoreOrigin || "0")
					Log.oth.info("match ended user final score matchID = " + this.matchID_ + " userID = " + runtime.userID + " finalScore = " + count.toString() + " scoreChange = " + scoreChange.toString())
					TraceLog.match(this.idx,"match ended user final score matchID = " + this.matchID_ + " userID = " + runtime.userID + " finalScore = " + count.toString() + " scoreChange = " + scoreChange.toString())
					if([MatchDefine.UserMatchStatus.Out,
						MatchDefine.UserMatchStatus.Wait,
						MatchDefine.UserMatchStatus.Ready,
						MatchDefine.UserMatchStatus.ReadyToPlay,
					].indexOf(runtime.status) >= 0) {
						runtime.status = MatchDefine.UserMatchStatus.Out
						Log.oth.info("match ended user out matchID = " + this.matchID_ + " userID = " + runtime.userID + " lastCount = " + count.toString())
						TraceLog.match(this.idx,"match ended user out matchID = " + this.matchID_ + " userID = " + runtime.userID + " lastCount = " + count.toString())
					} else {
						runtime.status = MatchDefine.UserMatchStatus.Win
						Log.oth.info("match ended user win matchID = " + this.matchID_ + " userID = " + runtime.userID + " lastCount = " + count.toString())
						TraceLog.match(this.idx,"match ended user win matchID = " + this.matchID_ + " userID = " + runtime.userID + " lastCount = " + count.toString())
					}
					await Module_MatchUserRuntime.update({matchID:this.matchID_,userID:runtime.userID},runtime)
					if(runtime.status == MatchDefine.UserMatchStatus.Win) {
						rankUsers.push({userID:runtime.userID,score:scoreChange.toString(),scoreNum:scoreChange.toNumber()})
					} else {
						rankLoseUsers.push({userID:runtime.userID,score:scoreChange.toString(),scoreNum:scoreChange.toNumber(),outTimestamp:runtime.outTimestamp || 0})
					}
				}
				if(runtimes.length < limit) {
					break 
				}
				skip += limit
			}
			// 返还锁定物品
			await this.callException(kds.item.unlockAll,lockID,ItemDefine.SerialType.MatchEnd,{matchID:this.matchID_})
			rankUsers.sort((a,b)=>b.scoreNum - a.scoreNum)
			rankLoseUsers.sort((a,b)=>{
				return b.outTimestamp != a.outTimestamp ? 
					b.outTimestamp - a.outTimestamp
					:
					b.scoreNum - a.scoreNum
			})

			let rewardConfig:MatchDefine.tReward = await Module_MatchReward.getMain(this.matchID_)
			let rank = 0
			for(let i = 0 ; i < rankUsers.length; i ++) {
				rank ++ 
				let rankUser = rankUsers[i]
				Log.oth.info("match final rank matchID = " + this.matchID_ + " rank = " + rank + " userID = " + rankUser.userID + " score = " + rankUser.score)
				TraceLog.match(this.idx,"match final rank matchID = " + this.matchID_ + " rank = " + rank + " userID = " + rankUser.userID + " score = " + rankUser.score)
				let rankInfo:MatchDefine.tUserRank = {
					userID:rankUser.userID,
					matchID:this.matchID_,
					rank:rank,
					rewards:[],
					score:rankUser.score,
					scoreNum:rankUser.scoreNum,

					timestamp:time,
					date:date,
				}
				if(rewardConfig) {
					for(let rankRewardInfo of rewardConfig.ranks) {
						if(rank >= rankRewardInfo.minRank && rank <= rankRewardInfo.maxRank) {
							rankInfo.rewards.push(...rankRewardInfo.items)
						}
					}
					for(let reward of rankInfo.rewards) {
						Log.oth.info("match final rank reward matchID = " + this.matchID_ + " rank = " + rank + " userID = " + rankUser.userID + " rewardItemID = " + reward.itemID + " rewardCount = " + reward.count)
						TraceLog.match(this.idx,"match final rank reward matchID = " + this.matchID_ + " rank = " + rank + " userID = " + rankUser.userID + " rewardItemID = " + reward.itemID + " rewardCount = " + reward.count)
					}
					if(rankInfo.rewards.length > 0) {
						let items:ItemDefine.tItem[] = rankInfo.rewards.map(v=>({
							id:v.itemID,
							count:v.count,
						}))
						await this.callException(kds.item.addItems,rankUser.userID,items,ItemDefine.SerialType.MatchRank,{matchID:this.matchID_})
					}
				}
				await Module_MatchUserRank.insert(rankInfo)

				
				MatchUtils.sendMatchEvent({
					userID:rankInfo.userID,
					matchID:this.matchID_,
					type:MatchDefine.UserMatchEventType.Win,
					onlyPush:false,
					rankInfo: rankInfo,
				})
			}
			for(let rankLoseUser of rankLoseUsers) {
				rank ++ 
				
				Log.oth.info("match final rank matchID = " + this.matchID_ + " rank = " + rank + " userID = " + rankLoseUser.userID + " score = " + rankLoseUser.score)
				TraceLog.match(this.idx,"match final rank matchID = " + this.matchID_ + " rank = " + rank + " userID = " + rankLoseUser.userID + " score = " + rankLoseUser.score)
				let rankInfo:MatchDefine.tUserRank = {
					userID:rankLoseUser.userID,
					matchID:this.matchID_,
					rank:rank,
					rewards:[],
					score:rankLoseUser.score,
					scoreNum:rankLoseUser.scoreNum,

					timestamp:time,
					date:date,
				}
				await Module_MatchUserRank.insert(rankInfo)

				MatchUtils.sendMatchEvent({
					userID:rankInfo.userID,
					matchID:this.matchID_,
					type:MatchDefine.UserMatchEventType.Lose,
					onlyPush:false,
					rankInfo: rankInfo,
				})
			}
		})
		await this.call(kds.robotenv.stopRobotLogicByMatchID,this.matchID_)
		this.changeStatus(MatchDefine.MatchStatus.FullyEnded)
		Log.oth.info("match fully ended matchID = " + this.matchID_)
		TraceLog.match(this.idx,"match fully ended matchID = " + this.matchID_)
		return true 
	}
}