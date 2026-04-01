import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { BaseRobotLogic } from "../base/BaseRobotLogic";
import { knIpcMsg } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { RobotIpcMessage } from "./RobotIpcMessage";
import { Log } from "../log";
import { IRobotProcessWorker } from "./IRobotProcessWorker";
import { BaseRobotStrategy } from "../base/BaseRobotStrategy";
import { kdasync } from "kdweb-core/lib/tools/async";
import md5 = require("md5")
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import _ = require("underscore");
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { DB } from "../../src/db";
import { RobotEntityRegister } from "./RobotEntityRegister";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { TraceLog } from "../../src/TraceLog";
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";
import { Module_RobotExtGroupPlan, Module_RobotExtMatchPlan, Module_RobotPersonalityConfig, Module_RobotRuntime } from "../../pp-base-define/DM_RobotExtension";

let db = DB.get()
export class RobotLogicProcessControl_Worker extends knProcess.handler implements IRobotProcessWorker{
	constructor() {
		super()
		Log.oth.info("sub thread initing")
		this.gameID_ = this.args[0]
		this.subLimitRobotCount_ = this.args[1]
		this.workerInited_ = false 
		this.cachedEnters_ = []
		this.initRobotWorkers()
	}

	private gameID_:number 
	private subLimitRobotCount_:number
	private robotInfos_:{
		userID:number,
		roomID:number,
		gsName:string,
		strategy:BaseRobotStrategy,
	}[] = []
	private gsStatuss_:{
		gameID:number,
		gsName:string,
		online:boolean,
		offlineTimestamp?:number,
	}[] = []
	private workerInited_:boolean 
	private cachedEnters_:RobotIpcMessage.tToWorker_UserEnterReq[]
	async initRobotWorkers() {
		TraceLog.robot(null,"initRobotWorkers")
		
		let runtimes:RobotDefine.tRuntime[] = await Module_RobotRuntime.get({
			logicName:this.serviceInfo.name,
			workerIdx:this.idx,
		}) || []
		this.sendToMaster(RobotIpcMessage.ToMaster_WorkerReady,{})
		this.workerInited_ = true 
		
		for(let runtime of runtimes) {
			Log.oth.info("recreate robot ",runtime)
			let b = await this.createRobot(runtime)
			TraceLog.robot(null,"sync recreate robot userID = " + runtime.robotUserID + " b = " + b,runtime)
			if(!b) {
				this.sendToMaster(RobotIpcMessage.ToMaster_RobotRelease,<RobotIpcMessage.tToMaster_RobotRelease>{
					robotUserID:runtime.robotUserID
				})
			}
		}

		if(this.cachedEnters_.length > 0) {
			let enters = this.cachedEnters_
			this.cachedEnters_ = []
			for(let t of enters) {
				TraceLog.robot(null,"cache robot enter userID = " + t.robotUserID,t)
				this.handleRobotEnter(t,true)
			}
		}
		
		setInterval(() => {
			this.onUpdate()
		}, 1000);
	}

	checkGSStatus(gsName:string) {
		return !!(this.gsStatuss_.find(v=>v.gsName == gsName)?.online)
	}

	onMasterMessage(obj: knIpcMsg.Base): void {
		super.onMasterMessage(obj)
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
				TraceLog.robot(null,"recv master message",msg.msgName,msg.obj)
				switch(msg.msgName) {
					case RobotIpcMessage.ToWorker_GameServerReady:{
						let t:RobotIpcMessage.tToWorker_GameServerReady = msg.obj
						
						let idx = this.gsStatuss_.findIndex(v=>v.gsName == t.gsName)
						Log.oth.info("gs status sync name = " + t.gsName + " gameID = " + t.gameID + " online = " + t.b)
						if(t.b) {
							TraceLog.robot(null,"gs ready",t.gsName,t.b)
						} else {
							TraceLog.robot(null,"gs offline",t.gsName,t.b)
						}
						if(t.b) {
							if(idx >= 0) {
								this.gsStatuss_[idx] = {
									gameID:t.gameID,
									gsName:t.gsName,
									online:true,
								}
							} else {
								this.gsStatuss_.push({
									gameID:t.gameID,
									gsName:t.gsName,
									online:true,
								})
							}
						} else {
							if(idx >= 0) {
								this.gsStatuss_.splice(idx,1)
							}
						}
						if(t.b) {
							let roomIDs = this.robotInfos_.filter(v=>v.gsName == t.gsName).map(v=>v.roomID)
							roomIDs = _.uniq(roomIDs)
							if(roomIDs.length > 0) {
								this.sendToMaster(RobotIpcMessage.ToMaster_CheckGSRooms,<RobotIpcMessage.tToMaster_CheckGSRoomsReq>{
									gsName:t.gsName,
									roomIDs,
								})
								TraceLog.robot(null,"gs ready check rooms",t.gsName,roomIDs)
								break 
							}
						}
						for(let info of this.robotInfos_) {
							if(info.gsName == t.gsName) {
								try {
									info.strategy.gsStatus = t.b
								} catch (error) {
									Log.oth.error("onGSStatusChanged to robot " + info.userID + " error",error)
								}
							}
						}
					} break 
					case RobotIpcMessage.ToWorker_StopRobotLogicByMatchID: {
						let t:RobotIpcMessage.tToWorker_StopRobotLogicByMatchID = msg.obj
						for (let info of this.robotInfos_) {
							if(info.strategy.roomData.matchID == t.matchID) { 
								info.strategy.release()	
							}
						}
					} break 
					case RobotIpcMessage.ToMaster_CheckGSRooms:{
						let t:RobotIpcMessage.tToMaster_CheckGSRoomsRes = msg.obj
						if(!t.rooms) {
							TraceLog.robot(null,"check gs rooms failed",t.gsName)
						} else {
							for(let room of t.rooms) {
								if(room.b) {
									for(let info of this.robotInfos_) {
										if(info.roomID == room.roomID) {
											try {
												if(!info.strategy.readyToDestory) {
													info.strategy.gsStatus = true
												}
											} catch (error) {
												Log.oth.error("onGSStatusChanged after check room to robot " + info.userID + " error",error)
											}
										}
									}
								} else {
									for(let info of this.robotInfos_) {
										if(info.roomID == room.roomID) {
											if(!info.strategy.readyToDestory) {
												info.strategy.release()
											}
										}
									}
								}
							}
						}
					} break 
					case RobotIpcMessage.ToWorker_UserEnter:{
						let t:RobotIpcMessage.tToWorker_UserEnterReq = msg.obj
						TraceLog.robot(t.robotUserID,"robot enter",t.roomID,t)
						if(!this.workerInited_) {
							this.cachedEnters_.push(t)
						} else {
							this.handleRobotEnter(t)
						}
					} break 
					case RobotIpcMessage.ToWorker_FromGameServer:{
						let t:RobotIpcMessage.tToWorker_FromGameServer = msg.obj
						let robot = this.robotInfos_.find(v=>v.userID == t.robotUserID)
						if(!robot) {
							Log.oth.error("on message: cannot find robot userID = " + t.robotUserID)
						} else {
							if(!robot.strategy.readyToDestory) {
								robot.gsName = t.gsName
								try {
									robot.strategy.handleMessage(t.msgName,t.jsonObj)
								} catch (error) {
									Log.oth.error("on message error ",t,error)
								}
							}
						}
					} break 
					case RobotIpcMessage.ToWorker_ExitFromGameServer:{
						let t:RobotIpcMessage.tToWorker_ExitFromGameServer = msg.obj
						let robot = this.robotInfos_.find(v=>v.userID == t.robotUserID)
						if(!robot) {
							Log.oth.error("robot already exit from gs ",t)
							TraceLog.robot(t.robotUserID,"robot exit from gs: already",t.gsName)
						} else {
							if(!robot.strategy.readyToDestory) {
								try {
									robot.strategy.handleForceExit(t.roomID)
									TraceLog.robot(t.robotUserID,"robot exit from gs: handle",t.gsName)
								} catch (error) {
									Log.oth.error("handleForceExit error ",t,error)
								}
							} else {
								TraceLog.robot(t.robotUserID,"robot exit from gs: dead",t.gsName)
							}
						}
					}


					case RobotIpcMessage.ToMaster_SendToGameServer:{
						let t:RobotIpcMessage.tToMaster_SendToGameServerRes = msg.obj
						this.resolveGSMessage(t.sendID,t.status)
					} break 
				}
			} break 
		}
	}

	async handleRobotEnter(t:RobotIpcMessage.tToWorker_UserEnterReq,sync?:boolean) {
		if(this.robotInfos_.find(v=>v.userID == t.robotUserID)) {
			Log.oth.error("robot already in working ",t)
			return false 
		}
		let roomRealtime = await Module_RoomRealtime.getMain(t.roomID)
		if(!roomRealtime) {
			Log.oth.error("cannot find room realtime id = " + t.roomID)
			return false 
		}
		let runtime = await Module_RobotRuntime.getMain(t.robotUserID)
		if(runtime.status != RobotDefine.Status.Loading && runtime.status != RobotDefine.Status.MatchWaiting) {
			Log.oth.error("robot not Loading while enter",t,runtime)
			return false 
		}
		runtime.roomID = t.roomID
		runtime.strategy = t.strategy
		runtime.strategyData = t.strategyData
		runtime.personality = t.personality
		runtime.strategyTaskID = t.taskID
		runtime.groupPlanID = t.groupPlanID
		runtime.matchPlanID = t.matchPlanID
		if(t.groupPlanID) {
			let plan = await Module_RobotExtGroupPlan.getMain(t.groupPlanID)
			if(!plan) {
				Log.oth.error("cannot find group plan id = " + t.groupPlanID)
				return false 
			}
			runtime.strategy = plan.strategy
			runtime.strategyData = plan.strategyData
			let personality = await Module_RobotPersonalityConfig.getSingle({personality:plan.personality,gameID:roomRealtime.gameData.gameID})
			if(!personality) {
				Log.oth.error("cannot find personality id = " + plan.personality + " gameID = " + roomRealtime.gameData.gameID)
				return false 
			}
			runtime.personality = personality
		} else if(t.matchPlanID) {
			let plan = await Module_RobotExtMatchPlan.getMain(t.matchPlanID)
			if(!plan) {
				Log.oth.error("cannot find match plan id = " + t.matchPlanID)
				return false 
			}
			runtime.strategy = plan.strategy
			runtime.strategyData = plan.strategyData
			let personality = await Module_RobotPersonalityConfig.getSingle({personality:plan.personality,gameID:roomRealtime.gameData.gameID})
			if(!personality) {
				Log.oth.error("cannot find personality id = " + plan.personality + " gameID = " + roomRealtime.gameData.gameID)
				return false 
			}
			runtime.personality = personality
		}
		let b = await this.createRobot(runtime)
		if(b) {
			await Module_RobotRuntime.update(runtime)
			this.sendToMaster(RobotIpcMessage.ToWorker_UserEnter,<RobotIpcMessage.tToWorker_UserEnterRes>{
				robotUserID:t.robotUserID,
				roomID:t.roomID,
				b:true,
			})
			this.sendToMaster(RobotIpcMessage.ToMaster_RobotReady,<RobotIpcMessage.tToMaster_RobotReady>{
				robotUserID:t.robotUserID,
				roomID:t.roomID,
				strategy:t.strategy,
				strategyData:t.strategyData,
				personality:t.personality,
				taskID:t.taskID,
				matchID:runtime.matchID,
			})
		} else {
			this.sendToMaster(RobotIpcMessage.ToWorker_UserEnter,<RobotIpcMessage.tToWorker_UserEnterRes>{
				robotUserID:t.robotUserID,
				roomID:t.roomID,
				b:false,
			})
		}
		return b 
	}

	async createRobot(runtime:RobotDefine.tRuntime) {
		let roomData:RoomDefine.RoomData = await Module_RoomData.getMain(runtime.roomID)
		if(!roomData) {
			Log.oth.error("cannot find room id = " + runtime.roomID,runtime)
			return false 
		}
		let roomRealtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getSingle({roomID:runtime.roomID,gsName:{$ne:null}})
		if(!roomRealtime) {
			Log.oth.error("cannot find room realtime id = " + runtime.roomID,runtime)
			return false 
		}
		let clazz = RobotEntityRegister.strategies.get(runtime.strategy || RobotDefine.RuntimeStrategy.Normal)
		if(!clazz) {
			Log.oth.error("robot strategy not support",runtime)
			return false 
		}
		let strategy = new clazz({
			worker:this,
			userID:runtime.robotUserID,
			roomData,
			gsName:roomRealtime.gsName,
			strategy:runtime.strategy || RobotDefine.RuntimeStrategy.Normal,
			strategyData:runtime.strategyData,
			personality:runtime.personality,
			taskID:runtime.strategyTaskID,
			groupPlanID:runtime.groupPlanID,
			matchPlanID:runtime.matchPlanID,
		})
		this.robotInfos_.push({
			userID:runtime.robotUserID,
			roomID:runtime.roomID,
			gsName:roomRealtime.gsName,
			strategy,
		})
		this.sendToMaster(RobotIpcMessage.ToMaster_RegToGameServer,<RobotIpcMessage.tToMaster_RegToGameServer>{
			robotUserID:runtime.robotUserID,
			gsName:roomRealtime.gsName,
		})
		if(this.robotInfos_.length>=this.subLimitRobotCount_) {
			this.sendToMaster(RobotIpcMessage.ToMaster_LoadedLimited,<RobotIpcMessage.tToMaster_LoadedLimited>{
				limited:true,
			})
		}
		let gsInfo = this.gsStatuss_.find(v=>v.gsName == roomRealtime.gsName)
		strategy.gsStatus = gsInfo && gsInfo.online
		Log.oth.info("robot create ",runtime)
		// this.sendToMaster(RobotIpcMessage.ToMaster_ConnectToGameServer,<RobotIpcMessage.tToMaster_ConnectToGameServerReq>{
		// 	gsName:roomRealtime.gsName,
		// })
		return true 
	}

	private gsMsgCaches_:{
		sendID:string,
		userID:number,
		gsName:string,
		msgName:string,
		jsonObj:any,
		wait:kdasync.wait<boolean>,

		retryCount:number,
		retryTimestamp:number,
		timestamp:number,
		date:string,
	}[] = []
	async sendToGS(userID:number, msgName: string, jsonObj: any): Promise<boolean> {
		let robotInfo = this.robotInfos_.find(v=>v.userID == userID)
		if(!robotInfo) {
			return false 
		}
		if(!robotInfo.strategy.gsStatus) { 
			return false
		}
		let wait = new kdasync.wait<boolean>()
		let time = kdutils.getMillionSecond()
		let sendID = md5("USER:" + userID + "TIME:" + time + "RAND:" + kdutils.intRandom(0,10000) + "MSG:" + msgName + "GS:" + robotInfo.gsName)
		this.gsMsgCaches_.push({
			sendID,
			userID,
			gsName:robotInfo.gsName,
			msgName,
			jsonObj,
			wait,

			retryCount:5,
			retryTimestamp:time,
			timestamp:time,
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time),
		})
		Log.oth.info("send to gs sendID = " + sendID + " userID = " + userID + " msgName = " + msgName,jsonObj)
		this.stepGSMessages()
		return await wait.promise
	}

	stepGSMessages() {
		let mutexUserIDs:number[] = []
		let removedUserIDs:number[] = []
		let time = kdutils.getMillionSecond()
		for(let i = 0 ; i < this.gsMsgCaches_.length ; i ++) {
			let cache = this.gsMsgCaches_[i]
			if(mutexUserIDs.includes(cache.userID)) {
				continue 
			}
			let robot = this.robotInfos_.find(v=>v.userID == cache.userID)
			if(robot.strategy.readyToDestory) {
				removedUserIDs.push(robot.userID)
				mutexUserIDs.push(robot.userID)
				Log.oth.error("robot removed cache invalid sendID = " + cache.sendID)
				continue 
			}
			if(cache.retryTimestamp == null || time < cache.retryTimestamp) {
				mutexUserIDs.push(cache.userID)
				continue 
			}
			this.sendToMaster(RobotIpcMessage.ToMaster_SendToGameServer,<RobotIpcMessage.tToMaster_SendToGameServerReq>{
				sendID:cache.sendID,
				robotUserID:cache.userID,
				gsName:cache.gsName,
				msgName:cache.msgName,
				jsonObj:cache.jsonObj,
			})
			cache.retryTimestamp = null 
			Log.oth.info("try send to gs sendID = " + cache.sendID + " userID = " + cache.userID + " gsName = " + cache.gsName + " msgName = " + cache.gsName)
		}
		_.each(removedUserIDs,(userID)=>{
			this.removeAllGSCache(userID)
		})
	}

	// // 0 成功 1 未连接 2 请重试
	resolveGSMessage(sendID:string,status:0|1|2) {
		let idx = this.gsMsgCaches_.findIndex(v=>v.sendID == sendID)
		if(idx < 0) {
			return 
		}
		switch(status) {
			case 0:{
				let cache = this.gsMsgCaches_[idx]
				this.gsMsgCaches_.splice(idx,1)
				Log.oth.info("send msg res success sendID = " + cache.sendID + " msgName = " + cache.msgName + " userID = " + cache.userID)
				try {
					cache.wait.resolve(true)
				} catch (error) {
					Log.oth.error("error",error)
				}
			} break 
			case 1:{
				let cache = this.gsMsgCaches_[idx]
				cache.retryCount -= 2
				if(cache.retryCount >= 0) {
					cache.retryTimestamp = kdutils.getMillionSecond() + 10000
					Log.oth.error("send msg res gs not connect retry sendID = " + cache.sendID + " msgName = " + cache.msgName + " userID = " + cache.userID)
				} else {
					this.gsMsgCaches_.splice(idx,1)
					Log.oth.error("send msg res gs not connect force stop sendID = " + cache.sendID + " msgName = " + cache.msgName + " userID = " + cache.userID)
					try {
						cache.wait.resolve(false)
					} catch (error) {
						Log.oth.error("error",error)
					}
					this.removeAllGSCache(cache.userID)
				}
			} break 
			case 2:{
				let cache = this.gsMsgCaches_[idx]
				cache.retryCount -= 1
				if(cache.retryCount >= 0) {
					cache.retryTimestamp = kdutils.getMillionSecond() + 10000
					Log.oth.error("send msg res gs not connect retry sendID = " + cache.sendID + " msgName = " + cache.msgName + " userID = " + cache.userID)
				} else {
					this.gsMsgCaches_.splice(idx,1)
					Log.oth.error("send msg res gs not connect force stop sendID = " + cache.sendID + " msgName = " + cache.msgName + " userID = " + cache.userID)
					try {
						cache.wait.resolve(false)
					} catch (error) {
						Log.oth.error("error",error)
					}
					this.removeAllGSCache(cache.userID)
				}
			} break 
		}
	}

	removeAllGSCache(userID:number) {
		let waits:kdasync.wait<boolean>[] = []
		for(let i = this.gsMsgCaches_.length - 1 ; i >= 0 ; i --) {
			let cache = this.gsMsgCaches_[i]
			if(cache.userID != userID) {
				continue 
			}
			waits.push(cache.wait)
			this.gsMsgCaches_.splice(i,1)

			Log.oth.info("removeAllGSCache userID = " + userID + " sendID = " + cache.sendID + " msgName = " + cache.msgName)
		}
		for(let wait of waits) {
			try {
				wait.resolve(false)
			} catch (error) {
				Log.oth.error("removeAllGSCache userID = " + userID + " error",error)
			}
		}
	}

	sendToMaster(msgName:string,data:any) {
		TraceLog.robot(null,"sendToMaster",msgName,data)
		this.send({
			cmd:knIpcMsg.CMD.RpcProcess,
			data:<knIpcMsg.tCMDRpc>{
				msgName,
				obj:data,
			}
		})
	}

	private prevUpdateShowTime_ = 0
	onUpdate() {
		let time = kdutils.getMillionSecond()
		let showLog = (time - this.prevUpdateShowTime_) >= 60000
		if(showLog) {
			this.prevUpdateShowTime_ = time
		}
		try {
			this.stepGSMessages()
			for(let i = this.robotInfos_.length - 1; i >= 0 ; i --) {
				let robot = this.robotInfos_[i]
				if(robot.strategy.readyToDestory) {
					Log.oth.error("robot released userID = " + robot.userID)
					this.sendToMaster(RobotIpcMessage.ToMaster_RobotRelease,<RobotIpcMessage.tToMaster_RobotRelease>{
						robotUserID:robot.userID
					})
					if(robot.gsName) {
						this.sendToMaster(RobotIpcMessage.ToMaster_RegToGameServer,<RobotIpcMessage.tToMaster_RegToGameServer>{
							robotUserID:robot.userID,
							gsName:null,
						})
					}
					this.robotInfos_.splice(i,1)
				}
			}
			for(let robot of this.robotInfos_) {
				try {
					robot.strategy.update()
					if(showLog) {
						Log.oth.info("robot update success userID = " + robot.userID)
						TraceLog.robot(robot.userID,"robot update success")
					}
				} catch (error) {
					Log.oth.error("robot update error",robot,error)
				}
			}
		} catch (error) {
			Log.oth.error("woker onUpdate error",error)
		}
	}
}