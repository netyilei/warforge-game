import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { Rpc } from "../rpc";
import { knIpcMsg, knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { RobotIpcMessage } from "./RobotIpcMessage";
import { Log } from "../log";
import { kdutils } from "kdweb-core/lib/utils";
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { knRpcTools } from "../../src/knRpcTools";
import { DB } from "../../src/db";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { TimeDate } from "../../src/TimeDate";
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { Config } from "../config";
import { kdasync } from "kdweb-core/lib/tools/async";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { TraceLog } from "../../src/TraceLog";
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";
import { RobotExtDefine } from "../../pp-base-define/RobotExtDefine";
import { Module_RobotRuntime } from "../../pp-base-define/DM_RobotExtension";


let db = DB.get()
let redis = DB.getRedis()
export class RobotLogicProcessControl_Master {
	constructor() {
		this.master_ = new knProcess.master({
			count:-1,
			serviceInfo:Rpc.serviceInfo,
			keep:true,
			childClazz:knProcess.child,
			filename:"sub",
			funcGetArgs:(idx)=>{
				let info = this.childs_.find(v=>v.idx == idx)
				return [info.gameID,this.subLimitRobotCount_]
			},
			funcGetName:(idx)=>{
				return Rpc.serviceInfo.name + "-ipc-" + idx
			},
			funcCallMethod:async (req)=>{
				return null 
			},
			funcSendCallMethod:async (serverName,req)=>{
				return null 
			},
		})
		this.init()
	}
	private async init() {
		let runtimes:RobotDefine.tRuntime[] = await db.get(DBDefine.tableRobotRuntime,{
			status:{$in:[
				RobotDefine.Status.Using,
				RobotDefine.Status.Loading,
				RobotDefine.Status.MatchPlaying,
			]},
			logicName:Rpc.serviceInfo.name,
		}) || []
		if(runtimes.length > 0) {
			let maxIdx = 0
			let gsNames:string[] = []
			for(let i = 0 ; i < runtimes.length ; i ++) {
				let workerIdx = Math.floor(i / this.subLimitRobotCount_)
				if(workerIdx > maxIdx) {
					maxIdx = workerIdx
				}
				let runtime = runtimes[i]
				let roomRealtime:RoomDefine.RoomRealtime = runtime.roomID != null ? await Module_RoomRealtime.getMain(runtime.roomID) : null
				if(!roomRealtime) {
					this.updateRobotResting(runtime.robotUserID)
					continue 
				}
				Module_RobotRuntime.updateOrigin({robotUserID:runtime.robotUserID},{
					$set:{
						workerIdx:workerIdx
					}
				})
				gsNames.push(roomRealtime.gsName)
			}
			for(let gsName of gsNames) {
				await this.connectToGS(gsName)
			}

			// todo 需要判定gameid
			for(let i = 0 ; i <= maxIdx ; i ++) {
				this.startChild(Config.localConfig.games[0].gameID)
			}
		}
		setInterval(() => {
			this.update()
		},3000);
	}
	private subLimitRobotCount_:number = 50

	private master_:knProcess.master
	private childs_:{
		idx:number,
		gameID:number,
		child:knProcess.child,

		waitReady:kdasync.wait,
		loadedLimited:boolean	// 满负荷
	}[] = []

	private gss_:{
		gameID:number,
		gsName:string,
		online:boolean,
		focusWorkers:number[],
		timestamp:number,
		connectExpire?:number,

		waitConnect?:kdasync.wait<boolean>,
	}[] = []

	private robotGSMaps_:{
		workerIdx:number,
		userID:number,
		gsName:string,
	}[] = []
	selectChild(gameID:number) {
		for(let child of this.childs_) {
			if(child.gameID == gameID) {
				if(!child.loadedLimited) {
					return {
						wait:child.waitReady,
						workerIdx:child.idx
					}
				}
			}
		}
		return this.startChild(gameID)
	}
	startChild(gameID:number) {
		let workerIdx = this.master_.nextIndex
		let info = {
			idx: workerIdx,
			gameID,
			child:null,
			waitReady:new kdasync.wait,
			loadedLimited:false,
		}
		this.childs_.push(info)
		this.master_.startChild()
		let childInfo = this.master_.childs.find(v=>v.idx == workerIdx)
		info.child = childInfo.child

		Log.oth.info("start child logic gameID = " + gameID + " idx = " + workerIdx)
		TraceLog.robot(null,"start child logic gameID = " + gameID + " idx = " + workerIdx)

		childInfo.child.funcMessage = (child,obj:knIpcMsg.Base)=>{
			switch(obj.cmd) {
				case knIpcMsg.CMD.RpcProcess:{
					let msg:knIpcMsg.tCMDRpc = obj.data
					Log.oth.info("recv worker msg idx = " + info.idx,obj)
					TraceLog.robot(null,"recv worker message",info.idx,msg.msgName,msg.obj)
					switch(msg.msgName) {
						case RobotIpcMessage.ToMaster_WorkerReady:{
							Log.oth.info("worker is ready idx = " + info.idx)
							TraceLog.robot(null,"worker ready " + info.idx,info.idx)
							if(info.waitReady) {
								try {
									info.waitReady.resolve()
								} catch (error) {
									Log.oth.error("wait ready resolved error",error)
								}
								info.waitReady = null 
							}
						} break 
						case RobotIpcMessage.ToMaster_LoadedLimited:{
							let t:RobotIpcMessage.tToMaster_LoadedLimited = msg.obj
							info.loadedLimited = !!t.limited
							Log.oth.info("logic limited gameID = " + info.gameID + " idx = " + info.idx + " limited = " + info.loadedLimited)
							TraceLog.robot(null,"worker limited idx = " + info.idx,info.idx,t.limited)
						} break 
						case RobotIpcMessage.ToMaster_ConnectToGameServer:{
							let t:RobotIpcMessage.tToMaster_ConnectToGameServerReq = msg.obj
							this.connectToGS(t.gsName,workerIdx)
							TraceLog.robot(null,"worker req connect gs idx = " + workerIdx + " gs = " + t.gsName,t.gsName,t)
						} break 
						case RobotIpcMessage.ToMaster_CloseToGameServer:{
							let t:RobotIpcMessage.tToMaster_CloseToGameServer = msg.obj
							let gsInfo = this.gss_.find(v=>v.gsName == t.gsName)
							if(gsInfo) {
								let idx = gsInfo.focusWorkers.indexOf(workerIdx)
								if(idx >= 0) {
									gsInfo.focusWorkers.splice(idx,1)
									TraceLog.robot(null,"remove gs focus idx = " + workerIdx + " gs = " + t.gsName,t.gsName,t)
								}
								if(gsInfo.focusWorkers.length == 0) {
									let idx = this.gss_.indexOf(gsInfo)
									if(idx >= 0) {
										this.gss_.splice(idx,1)
									}
									if(gsInfo.online) {
										Rpc.robotGS.stopClient(gsInfo.gsName)
										TraceLog.robot(null,"stop gs idx = " + workerIdx + " gs = " + t.gsName,t.gsName,t)
									}
								}
							}
						} break 
						
						case RobotIpcMessage.ToMaster_SendToGameServer:{
							let t:RobotIpcMessage.tToMaster_SendToGameServerReq = msg.obj
							let gsInfo = this.gss_.find(v=>v.gsName == t.gsName)
							if(!gsInfo) {
								this.sendToChildIdx(workerIdx,RobotIpcMessage.ToMaster_SendToGameServer,<RobotIpcMessage.tToMaster_SendToGameServerRes>{
									sendID:t.sendID,
									status:1,
								})
								TraceLog.robot(t.robotUserID,"send to gs failed 1 idx = " + workerIdx,t.msgName,t.jsonObj,t.sendID)
							// } else if(!gsInfo.online || gsInfo.gameID == null) {
							} else if(!gsInfo.online) {
								this.sendToChildIdx(workerIdx,RobotIpcMessage.ToMaster_SendToGameServer,<RobotIpcMessage.tToMaster_SendToGameServerRes>{
									sendID:t.sendID,
									status:2,
								})
							} else {
								TraceLog.robot(t.robotUserID,"send to gs failed 2 idx = " + workerIdx,t.msgName,t.jsonObj,t.sendID)
								Rpc.robotGS.callServer(t.gsName,GSRpcMethods.userMessage,t.robotUserID,t.msgName,t.jsonObj)
								.then((ret)=>{
									if(ret.type == knRpcDefine.ClientCallReturnType.Success) {
										this.sendToChildIdx(workerIdx,RobotIpcMessage.ToMaster_SendToGameServer,<RobotIpcMessage.tToMaster_SendToGameServerRes>{
											sendID:t.sendID,
											status:0,
										})
									} else {
										Log.oth.error("send to gs failed",ret)
										this.sendToChildIdx(workerIdx,RobotIpcMessage.ToMaster_SendToGameServer,<RobotIpcMessage.tToMaster_SendToGameServerRes>{
											sendID:t.sendID,
											status:2,
										})
										TraceLog.robot(t.robotUserID,"send to gs failed 2 idx = " + workerIdx,t.msgName,t.jsonObj,t.sendID)
									}
								})
							}
						} break 
						case RobotIpcMessage.ToMaster_RegToGameServer:{
							let t:RobotIpcMessage.tToMaster_RegToGameServer = msg.obj
							let idx = this.robotGSMaps_.findIndex(v=>v.userID == t.robotUserID)
							Log.oth.info("robot reg to gs userID = " + t.robotUserID + " gs = " + t.gsName)
							if(t.gsName) {
								if(idx >= 0) {
									this.robotGSMaps_[idx].gsName = t.gsName
									this.robotGSMaps_[idx].workerIdx = workerIdx
								} else {
									this.robotGSMaps_.push({
										userID:t.robotUserID,
										gsName:t.gsName,
										workerIdx:workerIdx,
									})
								}
								TraceLog.robot(t.robotUserID,"reg to gs idx = " + workerIdx,t.gsName)
							} else {
								if(idx >= 0) {
									this.robotGSMaps_.splice(idx,1)
									TraceLog.robot(t.robotUserID,"unreg to gs idx = " + workerIdx)
								}
							}
						} break 
						case RobotIpcMessage.ToMaster_RobotReady:{
							let t:RobotIpcMessage.tToMaster_RobotReady = msg.obj
							
							let status = t.matchID ? RobotDefine.Status.MatchPlaying :  RobotDefine.Status.Using
							let startTime = kdutils.getMillionSecond()
							Module_RobotRuntime.updateOrigin({robotUserID:t.robotUserID},{
								$set:{
									roomID:t.roomID,
									strategy:t.strategy,
									strategyData:t.strategyData,
									personality:t.personality,
									strategyTaskID:t.taskID,

									logicName:Config.myName,
									workerIdx:workerIdx,

									startTimestamp:startTime,
									startDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",startTime),

									restTimestamp:null,
									restDate:null,

									status:status,
								}
							})
							TraceLog.robot(t.robotUserID,"robot ready idx = " + workerIdx,"status = " + RobotDefine.Status[status])
						} break 
						case RobotIpcMessage.ToMaster_RobotRelease:{
							let t:RobotIpcMessage.tToMaster_RobotRelease = msg.obj
							
							TraceLog.robot(t.robotUserID,"robot release idx = " + workerIdx)
							this.updateRobotResting(t.robotUserID)
						} break 
						case RobotIpcMessage.ToMaster_CheckGSRooms:{
							let t:RobotIpcMessage.tToMaster_CheckGSRoomsReq = msg.obj

							Rpc.robotGS.callServer(t.gsName,GSRpcMethods.robotIsRoomsExist,t.roomIDs)
							.then((ret)=>{
								this.sendToChildIdx(workerIdx,RobotIpcMessage.ToMaster_CheckGSRooms,<RobotIpcMessage.tToMaster_CheckGSRoomsRes>{
									gsName:t.gsName,
									rooms:ret.data,
								})
								TraceLog.robot(null,"gs check rooms ret idx = " + workerIdx,t,ret.data)
							})
						} break 
						
						// to worker responses
						case RobotIpcMessage.ToWorker_UserEnter:{
							let t:RobotIpcMessage.tToWorker_UserEnterRes = msg.obj
							Log.oth.info("robot enter room userID = " + t.robotUserID + " success = " + t.b)
							if(!t.b) {
								TraceLog.robot(t.robotUserID,"robot enter failed idx = " + workerIdx)
								this.updateRobotResting(t.robotUserID)
							} else {
								TraceLog.robot(t.robotUserID,"robot enter success idx = " + workerIdx,t.roomID)
							}
						} break 
					}
				} break 
			}
		}
		return {
			wait:info.waitReady,
			workerIdx:info.idx
		}
	}

	connectToGS(gsName:string,workerIdx?:number) {
		let gsInfo = this.gss_.find(v=>v.gsName == gsName)
		if(gsInfo && gsInfo.gameID != null) {
			if(workerIdx != null) {
				if(!gsInfo.focusWorkers.includes(workerIdx)) {
					gsInfo.focusWorkers.push(workerIdx)
				}
				this.sendGameServerReady(workerIdx,gsName)
			}
			if(gsInfo.online) {
				TraceLog.robot(null,"push connect: already online gs = " + gsName)
				return true 
			}
		}
		if(!gsInfo) {
			gsInfo = {
				gsName:gsName,
				gameID:null,
				online:false,
				focusWorkers:[workerIdx],
				timestamp:kdutils.getMillionSecond(),
				waitConnect:new kdasync.wait()
			}
			this.gss_.push(gsInfo)
			TraceLog.robot(null,"push connect: waiting for update gs = " + gsName)
		}
		this.update()
		return false 
	}

	setGameServerReady(gsName:string,opt:{
		gameID?:number,
		offline?:boolean,
	}) {
		let info = this.gss_.find(v=>v.gsName == gsName)
		if(!info) {
			if(opt.offline) {
				return true 
			}
			this.gss_.push({
				gsName,
				gameID:opt.gameID,
				online:true,
				focusWorkers:[],
				timestamp:kdutils.getMillionSecond(),
				waitConnect:null,
			})
		} else {
			if(opt.offline) {
				info.online = false 
			} else {
				info.gameID = opt.gameID
				info.online = true 
			}
			info.timestamp = kdutils.getMillionSecond()
		}
		this.sendGameServerReady(null,gsName)
		if(info.focusWorkers.length == 0) {
			let idx = this.gss_.indexOf(info)
			if(idx >= 0) {
				this.gss_.splice(idx,1)
			}
			if(info.online) {
				Rpc.robotGS.stopClient(info.gsName)
			}
		}
		if(info.waitConnect) {
			if(opt.offline && !info.waitConnect) {
				info.waitConnect = new kdasync.wait()
			} else {
				try {
					let wait = info.waitConnect
					info.waitConnect = null 
					wait.resolve(true)
				} catch (error) {
					Log.oth.error("info.waitConnect.resolve error",info,error)
				}
			}
		}
	}
	
	sendGameServerReady(toWorkerIdx?:number,gsName?:string) {
		if(toWorkerIdx == null) {
			if(gsName) {
				let info = this.gss_.find(v=>v.gsName == gsName)
				if(!info) {
					return false 
				}
				this.sendToAllChild(RobotIpcMessage.ToWorker_GameServerReady,<RobotIpcMessage.tToWorker_GameServerReady>{
					gameID:info.gameID,
					gsName:info.gsName,
					b:info.online,
				})
			} else {
				for(let gs of this.gss_) {
					this.sendToAllChild(RobotIpcMessage.ToWorker_GameServerReady,<RobotIpcMessage.tToWorker_GameServerReady>{
						gameID:gs.gameID,
						gsName:gs.gsName,
						b:gs.online,
					})
				}
			}
		} else {
			if(gsName) {
				let info = this.gss_.find(v=>v.gsName == gsName)
				if(!info) {
					return false 
				}
				return this.sendToChildIdx(toWorkerIdx,RobotIpcMessage.ToWorker_GameServerReady,<RobotIpcMessage.tToWorker_GameServerReady>{
					gameID:info.gameID,
					gsName:info.gsName,
					b:info.online,
				})
			} else {
				for(let gs of this.gss_) {
					this.sendToChildIdx(toWorkerIdx,RobotIpcMessage.ToWorker_GameServerReady,<RobotIpcMessage.tToWorker_GameServerReady>{
						gameID:gs.gameID,
						gsName:gs.gsName,
						b:gs.online,
					})
				}
			}
		}
	}

	sendMessageFromGameServer(gsName:string,userID:number,msgName:string,jsonObj:any) {
		let map = this.robotGSMaps_.find(v=>v.userID == userID)
		if(!map) {
			return false 
		}
		this.sendToChildIdx(map.workerIdx,RobotIpcMessage.ToWorker_FromGameServer,<RobotIpcMessage.tToWorker_FromGameServer>{
			robotUserID:userID,
			gameID:null,
			gsName,
			msgName,
			jsonObj,
		})
		return true 
	}
	
	userExitFromGameServer(gsName:string,userID:number,roomID:number) {
		let map = this.robotGSMaps_.find(v=>v.userID == userID)
		if(!map) {
			return false 
		}
		this.sendToChildIdx(map.workerIdx,RobotIpcMessage.ToWorker_ExitFromGameServer,<RobotIpcMessage.tToWorker_ExitFromGameServer>{
			robotUserID:userID,
			gsName,
			roomID,
		})
		return true 
	}

	sendToAllChild(msgName:string,data:any) {
		for(let childInfo of this.childs_) {
			this.sendToChildInfo(childInfo,msgName,data)
		}
	}
	sendToChildIdx(idx:number,msgName:string,data:any) {
		let childInfo = this.master_.childs.find(v=>v.idx == idx)
		if(!childInfo) {
			return false 
		}
		return this.sendToChildInfo(childInfo,msgName,data)
	}

	sendToChildInfo(childInfo,msgName:string,data:any) {
		Log.oth.info("send to worker " + childInfo.idx + " msg = " + msgName,data)
		TraceLog.robot(null,"send to worker idx = " + childInfo.idx,msgName,data)
		return childInfo.child.send({
			cmd:knIpcMsg.CMD.RpcProcess,
			data:<knIpcMsg.tCMDRpc>{
				msgName,
				obj:data,
			}
		})
	}

	private updateing_ = false 
	async update() {
		if(this.updateing_) {
			return 
		}
		this.updateing_ = true 
		try {
			let time = kdutils.getMillionSecond()
			for(let gs of this.gss_) {
				if(gs.online) {
					continue 	
				}
				if(gs.connectExpire && time >= gs.connectExpire) {
					Rpc.robotGS.stopClient(gs.gsName)
					gs.connectExpire = null 
				}
				if(!gs.connectExpire) {
					let kdsConfig = await knRpcTools.getKDSConfig(gs.gsName)
					if(!kdsConfig || !kdsConfig.other || !kdsConfig.other.robotPort) {
						Log.oth.error("get gs info failed name = " + gs.gsName,kdsConfig)
						gs.connectExpire = kdutils.getMillionSecond() + 30000
						continue 
					}
					Rpc.robotGS.startClient({
						name: gs.gsName,
						serverPort: kdsConfig.other.robotPort,
						serverHost:"ws://" + kdsConfig.other.ip + ":" + kdsConfig.other.robotPort,
						startTime: kdutils.getMillionSecond(),
						startDate: null,
					},{keep:true})
					gs.connectExpire = kdutils.getMillionSecond() + 3000
					TraceLog.robot(null,"start connect to gsName = " + gs.gsName,gs)
				}
			}
		} catch (error) {
			Log.oth.error("update error",error)
		} finally {
			this.updateing_ = false 
		}
	}

	onGSMessage() {

	}

	async createRobot(robotUserID:number,roomID:number,strategy:RobotDefine.RuntimeStrategy,strategyData:RobotDefine.tStrategyData_Base,personality:RobotDefine.tPersonalityGameConfig_Base,envItemBase:RobotDefine.tEnvConfig_ItemBase) {
		Log.oth.info("createRobot",{
			robotUserID,roomID,strategy,strategyData,personality,envItemBase
		})
		let roomData = await Module_RoomData.getMain(roomID)
		if(!roomData) {
			Log.oth.error("cannot find room id = " + roomID)
			return false 
		}
		let ret = await this.selectChild(roomData.gameData.gameID)
		if(!ret) {
			Log.oth.error("cannot select child roomID = " + roomID + " robot = " + robotUserID)
			return false 
		}
		let func = async ()=>{
			let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
			if(!realtime || !realtime.gsName) {
				Log.oth.error("cannot find realtime roomID = " + roomID + " robot = " + robotUserID)
				return false 
			}
			let b = this.connectToGS(realtime.gsName)
			let gsInfo = this.gss_.find(v=>v.gsName == realtime.gsName)
			if(!b) {
				if(!gsInfo) {
					Log.oth.error("gs info get failed",realtime,{robotUserID,roomID})
					return false 
				}
				let bConnect = await gsInfo.waitConnect.promise
				if(!bConnect) {
					Log.oth.error("connect to gs failed gsName = " + gsInfo.gsName)
					return false 
				}
			}
			let retEnterGS = await Rpc.robotGS.callServer(gsInfo.gsName,GSRpcMethods.robotUserEnter,roomID,robotUserID,{})
			TraceLog.robot(robotUserID,"send gs user enter gsName = " + gsInfo.gsName,roomID,{strategy,strategyData,personality})
			if(!retEnterGS.data) {
				Log.oth.error("robot enter gs failed roomID = " + roomID + " robot = " + robotUserID,retEnterGS)
				return false 
			}
			if(this.sendToChildIdx(ret.workerIdx,RobotIpcMessage.ToWorker_UserEnter,<RobotIpcMessage.tToWorker_UserEnterReq>{
				robotUserID:robotUserID,
				roomID:roomID,
				strategy:strategy,
				strategyData:strategyData,
				personality:personality,
				opt:null,
				buyinValue:null,
			})) {
				return true 
			}
			Log.oth.error("send to worker error robotUserID = " + robotUserID + " idx = " + ret.workerIdx)
			return false
		}
		if(ret.wait) {
			await ret.wait.promise
		}
		let b = await func()
		if(!b) {
			TraceLog.robot(robotUserID,"robot enter failed",roomID,{strategy,strategyData,personality})
			Log.oth.error("robot enter failed reset runtime",{
				robotUserID,roomID,strategy,strategyData,personality
			})
			this.updateRobotResting(robotUserID)
		}
		return b 
	}
	async createRobotWithTask(robotUserID:number,roomID:number,taskID:number) {
		Log.oth.info("createRobot",{
			robotUserID,roomID,taskID
		})
		let roomData = await Module_RoomData.getMain(roomID)
		if(!roomData) {
			Log.oth.error("cannot find room id = " + roomID)
			return false 
		}
		let ret = await this.selectChild(roomData.gameData.gameID)
		if(!ret) {
			Log.oth.error("cannot select child roomID = " + roomID + " robot = " + robotUserID)
			return false 
		}
		let func = async ()=>{
			let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
			if(!realtime || !realtime.gsName) {
				Log.oth.error("cannot find realtime roomID = " + roomID + " robot = " + robotUserID)
				return false 
			}
			let b = this.connectToGS(realtime.gsName)
			let gsInfo = this.gss_.find(v=>v.gsName == realtime.gsName)
			if(!b) {
				if(!gsInfo) {
					Log.oth.error("gs info get failed",realtime,{robotUserID,roomID})
					return false 
				}
				let bConnect = await gsInfo.waitConnect.promise
				if(!bConnect) {
					Log.oth.error("connect to gs failed gsName = " + gsInfo.gsName)
					return false 
				}
			}
			let retEnterGS = await Rpc.robotGS.callServer(gsInfo.gsName,GSRpcMethods.robotUserEnter,roomID,robotUserID,{})
			TraceLog.robot(robotUserID,"send gs user enter gsName = " + gsInfo.gsName,roomID,{taskID})
			if(!retEnterGS.data) {
				Log.oth.error("robot enter gs failed roomID = " + roomID + " robot = " + robotUserID,retEnterGS)
				return false 
			}
			if(this.sendToChildIdx(ret.workerIdx,RobotIpcMessage.ToWorker_UserEnter,<RobotIpcMessage.tToWorker_UserEnterReq>{
				robotUserID:robotUserID,
				roomID:roomID,
				taskID,
				opt:null,
				buyinValue:null,
			})) {
				return true 
			}
			Log.oth.error("send to worker error robotUserID = " + robotUserID + " idx = " + ret.workerIdx)
			return false
		}
		if(ret.wait) {
			await ret.wait.promise
		}
		let b = await func()
		if(!b) {
			TraceLog.robot(robotUserID,"robot enter failed",roomID,{taskID})
			Log.oth.error("robot enter failed reset runtime",{
				robotUserID,roomID,taskID
			})
			this.updateRobotResting(robotUserID)
		}
		return b 
	}

	async createRobotWithGroupPlan(robotUserID:number,roomID:number,plan:RobotExtDefine.tGroupPlan) {
		Log.oth.info("createRobotWithGroupPlan",{
			robotUserID,roomID,planID:plan.planID
		})
		let roomData = await Module_RoomData.getMain(roomID)
		if(!roomData) {
			Log.oth.error("cannot find room id = " + roomID)
			return false 
		}
		let ret = await this.selectChild(roomData.gameData.gameID)
		if(!ret) {
			Log.oth.error("cannot select child roomID = " + roomID + " robot = " + robotUserID)
			return false 
		}
		let func = async ()=>{
			let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
			if(!realtime || !realtime.gsName) {
				Log.oth.error("cannot find realtime roomID = " + roomID + " robot = " + robotUserID)
				return false 
			}
			let b = this.connectToGS(realtime.gsName)
			let gsInfo = this.gss_.find(v=>v.gsName == realtime.gsName)
			if(!b) {
				if(!gsInfo) {
					Log.oth.error("gs info get failed",realtime,{robotUserID,roomID})
					return false 
				}
				let bConnect = await gsInfo.waitConnect.promise
				if(!bConnect) {
					Log.oth.error("connect to gs failed gsName = " + gsInfo.gsName)
					return false 
				}
			}
			let retEnterGS = await Rpc.robotGS.callServer(gsInfo.gsName,GSRpcMethods.robotUserEnter,roomID,robotUserID,{})
			TraceLog.robot(robotUserID,"send gs user enter gsName = " + gsInfo.gsName,roomID,{planID:plan.planID})
			if(!retEnterGS.data) {
				Log.oth.error("robot enter gs failed roomID = " + roomID + " robot = " + robotUserID,retEnterGS)
				return false 
			}
			if(this.sendToChildIdx(ret.workerIdx,RobotIpcMessage.ToWorker_UserEnter,<RobotIpcMessage.tToWorker_UserEnterReq>{
				robotUserID:robotUserID,
				roomID:roomID,
				groupPlanID:plan.planID,
				opt:null,
				buyinValue:null,
			})) {
				return true 
			}
			Log.oth.error("send to worker error robotUserID = " + robotUserID + " idx = " + ret.workerIdx)
			return false
		}
		if(ret.wait) {
			await ret.wait.promise
		}
		let b = await func()
		if(!b) {
			TraceLog.robot(robotUserID,"robot enter failed",roomID,{planID:plan.planID})
			Log.oth.error("robot enter failed reset runtime",{
				robotUserID,roomID,planID:plan.planID
			})
			this.updateRobotResting(robotUserID)
		}
		return b 
	}

	async createRobotWithMatchPlan(robotUserID:number,roomID:number,plan:RobotExtDefine.tMatchPlan) {
		Log.oth.info("createRobotWithGroupPlan",{
			robotUserID,roomID,planID:plan.planID
		})
		let roomData = await Module_RoomData.getMain(roomID)
		if(!roomData) {
			Log.oth.error("cannot find room id = " + roomID)
			return false 
		}
		let ret = await this.selectChild(roomData.gameData.gameID)
		if(!ret) {
			Log.oth.error("cannot select child roomID = " + roomID + " robot = " + robotUserID)
			return false 
		}
		let func = async ()=>{
			let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
			if(!realtime || !realtime.gsName) {
				Log.oth.error("cannot find realtime roomID = " + roomID + " robot = " + robotUserID)
				return false 
			}
			let b = this.connectToGS(realtime.gsName)
			let gsInfo = this.gss_.find(v=>v.gsName == realtime.gsName)
			if(!b) {
				if(!gsInfo) {
					Log.oth.error("gs info get failed",realtime,{robotUserID,roomID})
					return false 
				}
				let bConnect = await gsInfo.waitConnect.promise
				if(!bConnect) {
					Log.oth.error("connect to gs failed gsName = " + gsInfo.gsName)
					return false 
				}
			}
			let retEnterGS = await Rpc.robotGS.callServer(gsInfo.gsName,GSRpcMethods.robotUserEnter,roomID,robotUserID,{})
			TraceLog.robot(robotUserID,"send gs user enter gsName = " + gsInfo.gsName,roomID,{planID:plan.planID})
			if(!retEnterGS.data) {
				Log.oth.error("robot enter gs failed roomID = " + roomID + " robot = " + robotUserID,retEnterGS)
				return false 
			}
			if(this.sendToChildIdx(ret.workerIdx,RobotIpcMessage.ToWorker_UserEnter,<RobotIpcMessage.tToWorker_UserEnterReq>{
				robotUserID:robotUserID,
				roomID:roomID,
				matchPlanID:plan.planID,
				opt:null,
				buyinValue:null,
			})) {
				return true 
			}
			Log.oth.error("send to worker error robotUserID = " + robotUserID + " idx = " + ret.workerIdx)
			return false
		}
		if(ret.wait) {
			await ret.wait.promise
		}
		let b = await func()
		if(!b) {
			TraceLog.robot(robotUserID,"robot enter failed",roomID,{planID:plan.planID})
			Log.oth.error("robot enter failed reset runtime",{
				robotUserID,roomID,planID:plan.planID
			})
			this.updateRobotResting(robotUserID)
		}
		return b 
	}

	async stopRobotLogicByMatchID(matchID:number) {
		for(let child of this.childs_) {
			this.sendToChildInfo(child,RobotIpcMessage.ToWorker_StopRobotLogicByMatchID,<RobotIpcMessage.tToWorker_StopRobotLogicByMatchID>{
				matchID,
			})
		}
	}

	async updateRobotResting(robotUserID:number) {
		let restTime = kdutils.getMillionSecond() + 30000
		let module = await Module_RobotRuntime.searchLockedSingleData(robotUserID)
		if(!module) {
			Log.oth.error("updateRobotResting cannot find robot runtime robotUserID = " + robotUserID)
			TraceLog.robot(robotUserID,"updateRobotResting cannot find robot runtime")
			return 
		}
		if(module.data.matchID) {
			if(module.data.status == RobotDefine.Status.MatchWaiting) {
				module.release()
				Log.oth.info("robot in match waiting cannot rest robotUserID = " + robotUserID)
				TraceLog.robot(robotUserID,"robot in match waiting cannot rest")
				return 
			}
			module.data.roomID = null 
			module.data.logicName = null
			module.data.workerIdx = null
			module.data.status = RobotDefine.Status.MatchWaiting
		} else {
			module.data.roomID = null
			module.data.strategy = null
			module.data.strategyData = null
			module.data.personality = null
			module.data.logicName = null
			module.data.workerIdx = null
			module.data.restTimestamp = restTime
			module.data.restDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",restTime)
			module.data.status = RobotDefine.Status.Rest
		}
		await module.saveAndRelease()
		Log.oth.info("reset robot to rest robotUserID = " + robotUserID)
		TraceLog.robot(robotUserID,"reset robot to rest","status = " + RobotDefine.Status[RobotDefine.Status.Rest])
	}
}