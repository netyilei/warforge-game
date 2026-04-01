import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { knIpcMsg } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { RobotEnvIpcMessage } from "./RobotEnvIpcMessage";
import { Log } from "../log";
import { tRobotEnvLogicInfo } from "../delegate/RobotEnvRpcDelegate";
import { kdasync } from "kdweb-core/lib/tools/async";
import md5 = require("md5")
import { DB } from "../../src/db";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { GameSet } from "../../pp-base-define/GameSet";
import _ = require("underscore");
import { RedisLock } from "../../src/RedisLock";
import { Rpc } from "../rpc";
import { RobotRpcMethods } from "../../pp-base-define/RobotRpcMethods";
import { TraceLog } from "../../src/TraceLog";
import { RobotEnvTools } from "../../src/RobotEnvTools";
import { Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";
import { RobotUtils } from "../../src/RobotUtils";
import { RobotExtDefine } from "../../pp-base-define/RobotExtDefine";
import { Module_RobotExtChargeStore, Module_RobotExtChargeStoreRecord, Module_RobotExtGroupPlan, Module_RobotExtMatchPlan, Module_RobotExtRobotChargeRecord, Module_RobotRuntime } from "../../pp-base-define/DM_RobotExtension";
import { Module_UserBag } from "../../pp-base-define/DM_UserDefine";
import { kdlock } from "kdweb-core/lib/tools/lock";
import Decimal from "decimal.js";
import { GlobalUtils } from "../../src/GlobalUtils";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { IDUtils } from "../../src/IDUtils";
import { TimeDate } from "../../src/TimeDate";
import { Module_MatchData, Module_MatchUserRuntime, Module_MatchUserSignUp } from "../../pp-base-define/DM_MatchDefine";
import { MatchDefine } from "../../pp-base-define/MatchDefine";

let db = DB.get()
let redis = DB.getRedis()
let updateInterval = 5000
export class RobotEnvWorker extends knProcess.handler {
	constructor() {
		super()
		switch(this.args[0]) {
			case 0:{
				this.clubID_ = this.args[1]
			} break 
			case 1:{
				this.groupID_ = this.args[1]
				let planID = this.args[2]
				this.onChangePlan(planID)
			} break 
			case 2:{
				this.matchID_ = this.args[1]
				let planID = this.args[2]
				this.onChangePlan(planID)
			} break 
		}

		setInterval(()=>{
			this.onUpdate()
		},updateInterval)

		TraceLog.robotEnv(null,"worker start groupID = " + this.groupID_ + " clubID = " + this.clubID_ + " matchID = " + this.matchID_)
		this.sendToMaster(RobotEnvIpcMessage.ToMaster_RefreshLogicClient,{})
	}

	private changingPlanQ_ = new kdasync.queue
	private groupPlan_:RobotExtDefine.tGroupPlan
	private matchPlan_:RobotExtDefine.tMatchPlan
	async onChangePlan(planID:number) {
		this.changingPlanQ_.call(async ()=>{
			try {
				if(this.groupID_) {
					this.groupPlan_ = await Module_RobotExtGroupPlan.getMain(planID)
					if(!this.groupPlan_) {
						Log.oth.error("group plan not found planID = " + planID)
						TraceLog.robotEnv(null,"group plan not found planID = " + planID)
					}
				} else if(this.matchID_) {
					this.matchPlan_ = await Module_RobotExtMatchPlan.getMain(planID)
					if(!this.matchPlan_) {
						Log.oth.error("match plan not found planID = " + planID)
						TraceLog.robotEnv(null,"match plan not found planID = " + planID)
					}
				}
			} catch (error) {
				Log.oth.error("chaning plan failed planID = " + planID,error)
				TraceLog.robotEnv(null,"chaning plan failed planID = " + planID,error)
			}
		})
	}
	private groupID_:number
	private clubID_:number
	private matchID_:number
	private logicClients_:tRobotEnvLogicInfo[] = []
	onMasterMessage(obj: knIpcMsg.Base) {
		super.onMasterMessage(obj)
		switch(obj.cmd) {
			case knIpcMsg.CMD.RpcProcess:{
				let msg:knIpcMsg.tCMDRpc = obj.data
				Log.oth.info("recv master msg",obj)
				switch(msg.msgName) {
					case RobotEnvIpcMessage.ToWorker_LogicClientChanged:{
						let t:RobotEnvIpcMessage.tToWorker_LogicClientChanged = msg.obj
						this.logicClients_ = t.clients
						Log.oth.info("logic client refresh")
						Log.oth.info(JSON.stringify(t.clients,null,4))
						TraceLog.robotEnv(null,"logic client changed",t.clients)
					} break 
					case RobotEnvIpcMessage.ToMaster_CallRpcCenter:{
						let t:RobotEnvIpcMessage.tToMaster_CallRpcCenterRes = msg.obj
						let idx = this.waitCallInfos_.findIndex(v=>v.callID == t.callID)
						if(idx < 0) {
							Log.oth.error("lose rpc handler callID = " + t.callID)
							TraceLog.robotEnv(null,"ToMaster_CallRpcCenter failed",t.callID,t)
						} else {
							TraceLog.robotEnv(null,"ToMaster_CallRpcCenter success",t.callID,t)

							let info = this.waitCallInfos_[idx]
							this.waitCallInfos_.splice(idx,1)
							try {
								info.wait.resolve(t.data)
							} catch (error) {
								Log.oth.error("",error)
								TraceLog.robotEnv(null,"ToMaster_CallRpcCenter resolve error",error)
							}
						}
					} break 
					case RobotEnvIpcMessage.ToWorker_PlanChanged:{
						let t:RobotEnvIpcMessage.tToWorker_PlanChanged = msg.obj
						this.onChangePlan(t.planID)
					} break 
				}
			} break 
		}
	}
	private updating_ = false 
	private mutexRoomIDs_:{
		roomID:number,
		expireTime:number,
	}[] = []
	private waitCallInfos_:{
		callID:string,
		timestamp:number,
		wait:kdasync.wait,
	}[] = []
	async onUpdate() {
		if(this.updating_) {
			return 
		}
		if(this.changingPlanQ_.length > 0) {
			return 
		}
		this.updating_ = true 
		try {
			let time = kdutils.getMillionSecond()
			for(let i = this.mutexRoomIDs_.length - 1 ; i >= 0 ; i --) {
				let info = this.mutexRoomIDs_[i]
				if(time >= info.expireTime) {
					this.mutexRoomIDs_.splice(i,1)
				}
			}
			let control = await RobotUtils.getGlobalControl()
			if(this.groupID_ != null) {
				if(!control) {
					return 
				}
				let group = control.groups.find(v=>v.groupID == this.groupID_)
				if(!group || group.enabled){
					await this.processGroup()
				}
			} else if(this.clubID_ != null) {
				// if(!config) {
				// 	return 
				// }
				// await this.processClub(config,this.clubID_)
			} else if(this.matchID_ != null) {
				if(!control || !control.matchEnabled) {
					return 
				}
				await this.processMatch()
			}
		} catch (error) {
			Log.oth.error("RobotEnvLooper",error)
		} finally {
			this.updating_ = false 
		}
	}

// async processNone(config:RobotDefine.tEnvConfig) {
// 		// if(!config) {
// 		if(!config ||!config.enabled) {
// 			return;
// 		}
// 		Log.oth.info("processNone")
// 		let realtimes:RoomDefine.RoomRealtime[] = await db.get(DBDefine.tableRoomRealtime,{
// 			roomID:{$nin:this.mutexRoomIDs_.map(v=>v.roomID)},
// 			gsName:{$ne:null}
// 		})
// 		for(let realtime of realtimes) {
// 			let gameSet = GameSet.createWithData(realtime.gameData)
// 			let need = Math.floor(gameSet.getUserCount() / 2)
// 			let cur = realtime.users.length
// 			if(cur > 0 && cur < need)  {
// 				let count = kdutils.intRandom(0,need - cur) + 1
// 				let runtimes:RobotDefine.tRuntime[] = await db.get(DBDefine.tableRobotRuntime,{roomID:realtime.roomID}) || []
// 				for(let runtime of runtimes) {
// 					if(realtime.users.find(v=>v.userID == runtime.robotUserID)) {
// 						continue 
// 					}
// 					count --
// 				}
// 				if(count <= 0) {
// 					continue 
// 				}
// 				await this.addRobotToRoom({
// 					roomID:realtime.roomID,
// 					gameSet,
// 					groupID:realtime.groupID,
// 					clubID:realtime.clubID,
// 					count,
// 					base:config.defaultClub,
// 				})
// 			}
// 		}
// 		return 
// 		// }
// 	}

	async processGroup() {
		let plan = this.groupPlan_
		if(!plan) {
			return false 
		}
		
		let realtimeIndex:any = {
			roomID:{$nin:this.mutexRoomIDs_.map(v=>v.roomID)},
			gsName:{$ne:null},
			groupID:plan.groupID
		}
		let realtimes = await Module_RoomRealtime.get(realtimeIndex)
		
		// Log.oth.info("realtime room count = " ,realtimes)
		// Log.oth.info("base = ",base," clubID = ",clubID," groupID = ",groupID)
		let time = kdutils.getMillionSecond()
		for(let realtime of realtimes) {
			if(!realtime.gsTimestamp || time - realtime.gsTimestamp < 15 * 1000) {
				continue
			}
			// if(realtime.clubID != clubID && realtime.groupID!= groupID){
			// 	continue;
			// }
			// if(clubID){
			// 	if(realtime.clubID != clubID ){
			// 		continue;
			// 	}
			// }
			// if(groupID){
			// 	if(realtime.groupID != groupID ){
			// 		continue;
			// 	}
			// }
			
			let gameSet = GameSet.createWithData(realtime.gameData)
			let need = this.groupPlan_.roomRobotCount || Math.floor(gameSet.getUserCount() / 2)
			let cur = realtime.users.length
			let isLimit = true
			//TODO 测试期间club 也是必须有真人才进入
			isLimit = cur>0
			for (const user of realtime.users) {
				if(user.userID){
					let _result = await RobotEnvTools.isRobot(user.userID)
					if(_result){
						cur--;
					}
				}
				
			}
			// 匹配必须有一个真人 才进入机器人
			isLimit = cur>0;

			// Log.oth.info("roomID = ",realtime.roomID," need = ",need," cur = ",cur)
			if(isLimit && realtime.users.length < need)  {
				let count = kdutils.intRandom(0,need - cur) + 1
				let runtimes:RobotDefine.tRuntime[] = await Module_RobotRuntime.get({roomID:realtime.roomID}) || []
				for(let runtime of runtimes) {
					if(realtime.users.find(v=>v.userID == runtime.robotUserID)) {
						continue 
					}
					count --
				}
				if(count <= 0) {
					continue 
				}
				await this.addRobotToRoom({
					roomRealtime:realtime,
					gameSet,
					count,
					planID:plan.planID,
					planBase:plan,
				})
			}
		}
	}
	async processClub(clubID:number) {
		// if(!config || !config.enabled) {
		// 	return;
		// }
		// let _groupEnv = config.clubs.find(v=>v.clubID == clubID)
		// if(!_groupEnv){
		// 	_groupEnv = config.defaultClub
		// 	if(_groupEnv.clubID != clubID){
		// 		return;
		// 	}
		// }
		// if(!_groupEnv || !_groupEnv.enabled){
		// 	return;
		// }
		// if(_groupEnv.clubID != clubID){
		// 	return;
		// }
		// await this.processRoomRealtime(_groupEnv,clubID,null);
	}

	private async setPrevAddRobotTime(tag:any,time:number) {
		await redis.hset("t_robot_env_worker","prev_add_robot_time:" + tag,String(time))
	}
	private async getPrevAddRobotTime(tag:any) {
		let str = await redis.hget("t_robot_env_worker","prev_add_robot_time:" + tag)
		return str ? Number(str) : 0
	}
	async processMatch() {
		let plan = this.matchPlan_
		if(!plan) {
			return false
		}

		let matchData = await Module_MatchData.getMain(this.matchID_)
		if(!matchData) {
			this.sendToMaster(RobotEnvIpcMessage.ToMaster_ChildEnd,{})
			return false 
		}
		let time = kdutils.getMillionSecond()
		let prevAddTime = await this.getPrevAddRobotTime(this.matchID_)
		if(!prevAddTime) {
			prevAddTime = time
			await this.setPrevAddRobotTime(this.matchID_,prevAddTime)
		}
		switch(matchData.status) {
			case MatchDefine.MatchStatus.Signup:{
				let robotCount = await Module_RobotRuntime.getCount({matchID:this.matchID_,status:RobotDefine.Status.MatchSignup})
				if(robotCount < plan.robotCount) {
					let endTime = matchData.signupEndTime < matchData.startTime ? matchData.signupEndTime : matchData.startTime
					endTime -= 60000	// 开赛前60秒不再报名
					let dt = endTime - time 
					let addedCount = 0
					let maxCount = plan.robotCount - robotCount
					if(dt < 0) {
						addedCount = maxCount
					} else {
						let perMS = maxCount / dt
						let maxAdd = Math.floor(perMS * (time - prevAddTime))
						if(maxAdd > maxCount) {
							maxAdd = maxCount
						} else if(maxAdd < 0) {
							maxAdd = 0
						}
						addedCount = maxAdd
					}
					if(addedCount > 0) {
						let startDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
						await RedisLock.callInLock(RedisLock.SearchRobot(),30,async ()=>{
							let lastCount = addedCount
							let count = await Module_RobotRuntime.getCount({targetMatchID:this.matchID_,status:RobotDefine.Status.Ready})
							if(count > 0) {
								let minCount = count > lastCount ? lastCount : count
								let runtimes = await Module_RobotRuntime.getOption({
									targetMatchID:this.matchID_,
									status:RobotDefine.Status.Ready,
								},{
									limit:minCount,
									projection:{robotUserID:1}
								})
								let userIDs = runtimes.map(v=>v.robotUserID)
								let updateCount = await Module_RobotRuntime.updateManyOrigin({
									robotUserID:{$in:userIDs},
									status:RobotDefine.Status.Ready,
								},{
									$set:{
										status:RobotDefine.Status.MatchSignup,
										matchID:this.matchID_,
										startTimestamp:time,
										startDate,
									}
								})
								for(let userID of userIDs) {
									RobotUtils.refreshRobotLoginData(userID)
								}
								TraceLog.robotEnv(null,"match signup add robots by target count = " + count + " real = " + updateCount,this.matchID_,userIDs)
								lastCount -= updateCount
								await this.chargeMatchRobot(this.matchID_,userIDs)
								await this.addMatchSignupRecord(matchData,userIDs)
							}
							if(lastCount > 0) {
								let runtimes = await Module_RobotRuntime.getOption({
									// targetMatchID:this.matchID_,
									status:RobotDefine.Status.Ready,
								},{
									limit:lastCount,
									projection:{robotUserID:1}
								})
								let userIDs = _.shuffle(runtimes.map(v=>v.robotUserID)).slice(0,lastCount)
								let updateCount = await Module_RobotRuntime.updateManyOrigin({
									robotUserID:{$in:userIDs},
									status:RobotDefine.Status.Ready,
								},{
									$set:{
										status:RobotDefine.Status.MatchSignup,
										matchID:this.matchID_,
										startTimestamp:time,
										startDate,
									}
								})
								for(let userID of userIDs) {
									RobotUtils.refreshRobotLoginData(userID)
								}
								TraceLog.robotEnv(null,"match signup add robots by ready pool target count = " + lastCount + " real = " + updateCount,this.matchID_,userIDs)
								lastCount -= updateCount
								await this.chargeMatchRobot(this.matchID_,userIDs)
								await this.addMatchSignupRecord(matchData,userIDs)
							}
						})
					}
				}
			} break 
			case MatchDefine.MatchStatus.Running:{
				await Module_RobotRuntime.updateManyOrigin({
					matchID:this.matchID_,
					status:RobotDefine.Status.MatchSignup,
				},{
					$set:{
						status:RobotDefine.Status.MatchWaiting,
					}
				})
				let count = await Module_MatchUserRuntime.getCount({
					matchID:this.matchID_,
					robot:true,
				})
				let skip = 0
				let limit = 50
				let logicClients = this.logicClients_.filter(v=>v.gameIDs.includes(matchData.gameData.gameID))
				if(logicClients.length == 0) {
					Log.oth.error("no logic client support gameID = " + matchData.gameData.gameID)
					return false 
				}
				let logicClient = logicClients[kdutils.intRandom(0,logicClients.length)]
				let rpcName = RobotRpcMethods.logic_internalCreateRobotWithMatchPlan

				// 让机器人进入比赛房间
				while(true) {
					let matchRuntimes = await Module_MatchUserRuntime.getOption({
						matchID:this.matchID_,
						robot:true,
					},{
						skip,limit,
					})
					for(let matchRuntime of matchRuntimes) {
						if(matchRuntime.status == MatchDefine.UserMatchStatus.Out) {
							// 是否重复报名
						} else if(matchRuntime.status != MatchDefine.UserMatchStatus.Playing) {
							continue 
						}
						let robotRuntime = await Module_RobotRuntime.searchLockedSingleData(matchRuntime.userID)
						try {
							if(matchRuntime.roomID != robotRuntime.data.roomID) {
								if(robotRuntime.data.roomID) {
									TraceLog.robotEnv(matchRuntime.userID,"robot roomID mismatch fix robotRuntime roomID = " + robotRuntime.data.roomID + " matchRuntime roomID = " + matchRuntime.roomID)
									robotRuntime.release()
									continue 
								}
								if(matchRuntime.roomID != null) {
									this.rpcCallRobotServer(logicClient.serviceInfo.name,
										rpcName,
										matchRuntime.userID,
										matchRuntime.roomID,
										this.matchPlan_.planID,
									)
									robotRuntime.data.roomID = matchRuntime.roomID
									robotRuntime.saveAndRelease()
									TraceLog.robotEnv(matchRuntime.userID,"robot enter match roomID = " + matchRuntime.roomID)
								}
							}
						} catch (error) {
							Log.oth.error("match robot runtime lock failed userID = " + matchRuntime.userID,error)
							TraceLog.robotEnv(matchRuntime.userID,"match robot runtime lock failed",error)
						} finally {
							robotRuntime?.release()
						}
					}
					if(matchRuntimes.length < limit) {
						break 
					}
					skip += limit
				}
			} break 
			case MatchDefine.MatchStatus.Ended:
			case MatchDefine.MatchStatus.FullyEnded:{
				let restTime = kdutils.getMillionSecond() + 30000
				let restDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",restTime)
				await Module_RobotRuntime.updateManyOrigin({
					matchID:this.matchID_,
				},{
					$set:{
						roomID:null,
						strategy:null,
						strategyData:null,
						personality:null,
						logicName:null,
						workerIdx:null,
						restTimestamp:restTime,
						restDate:restDate,
						status:RobotDefine.Status.Rest,
					}
				})
				let module = await Module_RobotExtMatchPlan.searchLockedSingleData(this.matchPlan_.planID)
				if(module && module.data.enabled) {
					module.data.enabled = false 
					await module.saveAndRelease()
					Log.oth.info("match plan disabled after match ended planID = " + this.matchPlan_.planID)
					TraceLog.robotEnv(null,"match plan disabled after match ended planID = " + this.matchPlan_.planID)
				} else {
					module?.release()
				}
				this.sendToMaster(RobotEnvIpcMessage.ToMaster_ChildEnd,{})
			} break 
		}
	}

	async addRobotToRoom(opt:{
		roomRealtime:RoomDefine.RoomRealtime,
		gameSet:GameSet,
		count?:number,
		planID:number,
		planBase:RobotExtDefine.RobotPlanBase
	}) {
		let count = opt.count || 1
		Log.oth.info("addRobotToRoom ",opt)
		let logicClients = this.logicClients_.filter(v=>v.gameIDs.includes(opt.gameSet.gameID))
		if(logicClients.length == 0) {
			Log.oth.error("no logic client support gameID = " + opt.gameSet.gameID)
			return false 
		}
		let logicClient = logicClients[kdutils.intRandom(0,logicClients.length)]
		let support:RoomDefine.RobotSupport = await db.getSingle(DBDefine.tableRoomRobotSupport,{roomID:opt.roomRealtime.roomID})
		if(!support) {
			Log.oth.error("get robot support failed roomID = " + opt.roomRealtime.roomID)
			return false 
		}
		//let roomRealtime:RoomDefine.RoomRealtime = await db.getSingle(DBDefine.tableRoom,{roomID:opt.roomID})
		// if(!opt.roomRealtime) {
		// 	Log.oth.error("room not found roomID = " + opt.roomID)
		// 	return false 
		// }
		let rpcName:string 
		if(this.groupPlan_) {
			rpcName = RobotRpcMethods.logic_internalCreateRobotWithGroupPlan
		} else if(this.matchPlan_) {
			rpcName = RobotRpcMethods.logic_internalCreateRobotWithMatchPlan
		} else {
			Log.oth.error("no plan found for roomID = " + opt.roomRealtime.roomID)
			return false 
		}
		if(support.itemID != null) {
			let skip = 0
			let limit = 100
			let validUserIDs:number[] = []
			let runtimeIndex:any = {
				status:RobotDefine.Status.Ready,
			}
			if(opt.roomRealtime.groupID) {
				runtimeIndex.targetGroupID = opt.roomRealtime.groupID
			} else if(opt.roomRealtime.matchID) {
				runtimeIndex.targetMatchID = opt.roomRealtime.matchID
			}

			while(true) {
				let runtimes:RobotDefine.tRuntime[] = await Module_RobotRuntime.getOption(runtimeIndex,{
					projection:{robotUserID:1},skip,limit
				}) || []
				let userIDs = runtimes.map(v=>v.robotUserID)
				let bags:{
					userID:number,itemID:string,count:number,
				}[] = await Module_UserBag.aggregateOption([
					{$match:{userID:{$in:userIDs}}},
					{$unwind:"$items"},
					{$match:{"items.id":support.itemID}},
					{$project:{
						userID:1,
						itemID:"$items.id",
						count:{$toDouble:"$items.count"},
					}},
					{$match:{count:{$gte:support.minValue}}},
				],{allowDiskUse:true}) || []
				validUserIDs.push.apply(validUserIDs,bags.map(v=>v.userID))
				if(runtimes.length < limit) {
					break 
				}
				skip += limit
			}
			Log.oth.info("pick robot to room = " + opt.roomRealtime.roomID + " valid = ",validUserIDs)
			if(validUserIDs.length == 0) {
				// 何时自动充值?
				let runtimeCount = await Module_RobotRuntime.getCount(runtimeIndex)
				if(runtimeCount > 0) { 
					this.chargeGroupRobots(opt.roomRealtime.groupID)
				}
				return false 
			}
			validUserIDs = _.shuffle(validUserIDs)
			TraceLog.robotEnv(null,"add robot to room",opt,validUserIDs)
			await RedisLock.callInLock(RedisLock.SearchRobot(),30,async ()=>{
				for(let userID of validUserIDs) {
					let runtime = await Module_RobotRuntime.getLockedSingleData({robotUserID:userID})
					if(!runtime || runtime.data.status != RobotDefine.Status.Ready) {
						runtime?.release()
						continue
					}
					count --
					Log.oth.info("robot in id = " + userID + " roomID = " + opt.roomRealtime.roomID)

					runtime.data.status = RobotDefine.Status.Loading
					runtime.data.logicName = logicClient.serviceInfo.name
					await runtime.saveAndRelease()
					await RobotUtils.refreshRobotLoginData(userID)
					TraceLog.robotEnv(userID,"robot try enter roomID = " + opt.roomRealtime.roomID,"status = " + RobotDefine.Status[RobotDefine.Status.Loading])
					this.rpcCallRobotServer(logicClient.serviceInfo.name,
						rpcName,
						userID,
						opt.roomRealtime.roomID,
						opt.planID,
					)
					TraceLog.robotEnv(userID,"call logic to add robot roomID = " + opt.roomRealtime.roomID,logicClient.serviceInfo.name,{
						planBase:opt.planBase,
						planID:opt.planID,
					})
					if(count <= 0) {
						break 
					}
				}
			})
			this.mutexRoomIDs_.push({
				roomID:opt.roomRealtime.roomID,expireTime:kdutils.getMillionSecond() + 30000
			})
			return true 
		}
	}

	async chargeGroupRobots(groupID:number,userID?:number) {
		Log.oth.info("chargeGroupRobots groupID = " + groupID + " userID = " + userID)
		TraceLog.robotEnv(null,"chargeGroupRobots groupID = " + groupID + " userID = " + userID)
		return await kdlock.redis.callInLock(Module_RobotExtChargeStore.getLockName(null),30,async ()=>{
			return await RedisLock.callInLock(RedisLock.SearchRobot(),30,async ()=>{
				let stores = await Module_RobotExtChargeStore.get({storeID:this.groupPlan_.storeID,enabled:true})
				if(!stores || stores.length == 0) {
					return false 
				}	
				let skip = 0
				let limit = 100
				let runtimeIndex:any = {
					status:RobotDefine.Status.Ready,
					targetGroupID:groupID,
				}
				if(userID != null) {
					runtimeIndex.robotUserID = userID
				}
				let userCharges:{
					userID:number,
					itemID:string,
					count:Decimal,
				}[] = []
				while(true) {
					let runtimes:RobotDefine.tRuntime[] = await Module_RobotRuntime.getOption(runtimeIndex,{
						projection:{robotUserID:1},skip,limit
					}) || []
					for(let runtime of runtimes) {
						let bag = await Module_UserBag.getMain(runtime.robotUserID)
						let item = bag?.items?.find(v=>v.id == this.groupPlan_.itemNeeded.itemID)
						let count = new Decimal(item?.count || 0)
						if(count.lessThan(this.groupPlan_.itemNeeded.count)) {
							userCharges.push({
								userID:runtime.robotUserID,
								itemID:this.groupPlan_.itemNeeded.itemID,
								count,
							})
						}
					}
					if(runtimes.length < limit) {
						break 
					}
					skip += limit
				}
				let storeChanges:RobotExtDefine.tChargeStore[] = []
				for(let userCharge of userCharges) {
					let chargeFloat = Decimal.mul(this.groupPlan_.chargeMinCount,kdutils.intRandom(0,200) / 1000)
					let chargeLimit = Decimal.add(this.groupPlan_.chargeMinCount,chargeFloat)
					chargeLimit = GlobalUtils.roundUp(chargeLimit)
					let needCharge = Decimal.sub(chargeLimit,userCharge.count)
					if(needCharge.lte(0)) {
						Log.oth.info("robot charge enough userID = " + userCharge.userID + " needCharge = " + needCharge.toString() + " userCharge = " + userCharge.count.toString())
						continue 
					}
					let chargeStores:{
						store: RobotExtDefine.tChargeStore,
						storeLastCount: Decimal,
						storeCount: Decimal,
					}[] = []
					let curNeedCharge = new Decimal(needCharge)
					for(let store of stores) {
						if(store.itemID != userCharge.itemID) {
							continue 
						}
						let storeCount = new Decimal(store.count)
						if(storeCount.lte(0)) {
							continue 
						}
						let toCharge = Decimal.min(curNeedCharge,storeCount)
						curNeedCharge = Decimal.sub(curNeedCharge,toCharge)

						chargeStores.push({
							store,
							storeLastCount:storeCount.sub(toCharge),
							storeCount:toCharge,
						})
						if(curNeedCharge.lte(0)) {
							break 
						}
					}
					if(curNeedCharge.gt(0)) {
						Log.oth.info("robot charge store not enough userID = " + userCharge.userID + " needCharge = " + needCharge.toString() + " userCharge = " + userCharge.count.toString())
						TraceLog.robotEnv(userCharge.userID,"robot charge store not enough","needCharge = " + needCharge.toString() + " userCharge = " + userCharge.count.toString())
						continue 
					}
					let userAdditionCount = new Decimal(userCharge.count)
					for(let chargeStore of chargeStores) {
						chargeStore.store.count = chargeStore.storeLastCount.toString()
						if(chargeStore.storeLastCount.lte(0)) {
							chargeStore.store.enabled = false 
						}
						storeChanges.push(chargeStore.store)

						let prevCount = new Decimal(userAdditionCount)
						userAdditionCount = userAdditionCount.add(chargeStore.storeCount)
						Module_RobotExtRobotChargeRecord.insert({
							no:await IDUtils.getRobotExtChargeRecordNo(),
							storeID:chargeStore.store.storeID,
							robotUserID:userCharge.userID,

							groupID:this.groupPlan_.groupID,
							matchID:null,

							itemID:chargeStore.store.itemID,
							fromCount:prevCount.toString(),		// 充值前数量
							count:chargeStore.storeCount.toString(),			// 充值数量
							floatingCount:null,	// 浮动数量
							lastCount:userAdditionCount.toString(),		// 充值后数量

							reason:"robot charge",			// 充值原因
							data:{
								storeID:chargeStore.store.storeID,
								robotUserID:userCharge.userID,
							},				// 充值附加数据

							timestamp:kdutils.getMillionSecond(),
							date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
						})
					}
					let b = await this.rpcCall(kds.item.add,userCharge.userID,userCharge.itemID,needCharge.toString(),ItemDefine.SerialType.System,{
						reason:"RobotEnvWorker chargeGroupRobots charge",
					})
					TraceLog.robotEnv(userCharge.userID,"robot charged","needCharge = " + needCharge.toString() + " userCharge = " + userCharge.count.toString() + " rpcResult = " + b)
					Log.oth.info("robot charged userID = " + userCharge.userID + " needCharge = " + needCharge.toString() + " userCharge = " + userCharge.count.toString() + " rpcResult = " + b)
				}
				await Promise.all(storeChanges.map(v=>Module_RobotExtChargeStore.update(v)))
				return true 
			})
		})

	}

	async chargeMatchRobot(matchID:number,userIDs:number[]) {
		let bags = await Module_UserBag.get({userID:{$in:userIDs}})
		for(let userID of userIDs) {
			let bag = bags.find(v=>v.userID == userID)
			let item = bag?.items?.find(v=>v.id == this.matchPlan_.itemNeeded.itemID)
			let count = new Decimal(item?.count || 0)
			if(count.lessThan(this.matchPlan_.itemNeeded.count)) {
				let chargeFloat = Decimal.mul(this.matchPlan_.chargeMinCount,kdutils.intRandom(0,200) / 1000)
				let chargeLimit = Decimal.add(this.matchPlan_.chargeMinCount,chargeFloat)
				chargeLimit = GlobalUtils.roundUp(chargeLimit)
				let needCharge = Decimal.sub(chargeLimit,count)
				if(needCharge.gt(0)) {
					await this.rpcCall(kds.item.add,userID,this.matchPlan_.itemNeeded.itemID,needCharge.toString(),ItemDefine.SerialType.System,{
						reason:"RobotEnvWorker chargeMatchRobot charge",
						planID:this.matchPlan_.planID,
						matchID:matchID,
					})
					TraceLog.robotEnv(userID,"match robot charged","needCharge = " + needCharge.toString() + " userCharge = " + count.toString())
					Log.oth.info("match robot charged userID = " + userID + " needCharge = " + needCharge.toString() + " userCharge = " + count.toString())

					
					Module_RobotExtRobotChargeRecord.insert({
						no:await IDUtils.getRobotExtChargeRecordNo(),
						storeID:null,
						robotUserID:userID,

						groupID:null,
						matchID:matchID,

						itemID:this.matchPlan_.itemNeeded.itemID,
						fromCount:count.toString(),		// 充值前数量
						count:needCharge.toString(),			// 充值数量
						floatingCount:chargeFloat.toString(),	// 浮动数量
						lastCount:count.add(needCharge).toString(),		// 充值后数量

						reason:"robot charge match",			// 充值原因
						data:{
							storeID:null,
							robotUserID:userID,
						},				// 充值附加数据

						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					})
				}
			}
		}
	}

	async addMatchSignupRecord(matchData:MatchDefine.tData,userIDs:number[]) {
		let signupItem = matchData.signup ? matchData.signup[0] : null
		let ps = []
		for(let userID of userIDs) {
			let signupRecord:MatchDefine.tUserSignupRecord = {
				matchID:matchData.matchID,
				userID:userID,
				signupItemID:signupItem ? signupItem.itemID : null,
				signupItemCount:signupItem ? signupItem.count : null,

				robot:true,
				timestamp:kdutils.getMillionSecond(),
				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			}
			ps.push(
				Module_MatchUserSignUp.updateOrInsert({matchID:matchData.matchID,userID},signupRecord)
			)
		}
		await Promise.all(ps)
	}

	sendToMaster(msgName:string,obj:any) {
		this.send({
			cmd:knIpcMsg.CMD.RpcProcess,
			data:<knIpcMsg.tCMDRpc>{
				msgName:msgName,
				obj:obj,
			}
		})
	}

	async rpcCallServer(serverName:string,method:string,...args) {
		let callID = md5(kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,100000) + "|method=" + method)
		let wait = new kdasync.wait()
		this.waitCallInfos_.push({
			callID,
			wait:wait,
			timestamp:kdutils.getMillionSecond()
		})
		this.sendToMaster(RobotEnvIpcMessage.ToMaster_CallRpcCenter,<RobotEnvIpcMessage.tToMaster_CallRpcCenterReq>{
			callID,
			serverName,
			robotInternal:false,
			method,
			args,
		})
		TraceLog.robotEnv(null,"rpcCallServer internal = " + false,callID,serverName,method,...args)
		Log.oth.info("send call rpc server = " + serverName + " internal = false " + " method = " + method + " callID = " + callID,args)
		return await wait.promise
	}

	async rpcCall(method:string,...args) {
		let callID = md5(kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,100000) + "|method=" + method)
		let wait = new kdasync.wait()
		this.waitCallInfos_.push({
			callID,
			wait:wait,
			timestamp:kdutils.getMillionSecond()
		})
		this.sendToMaster(RobotEnvIpcMessage.ToMaster_CallRpcCenter,<RobotEnvIpcMessage.tToMaster_CallRpcCenterReq>{
			callID,
			robotInternal:false,
			method,
			args,
		})
		TraceLog.robotEnv(null,"rpcCall internal = " + false,callID,null,method,...args)
		Log.oth.info("send call rpc internal = false " + " method = " + method + " callID = " + callID,args)
		return await wait.promise
	}
	async rpcCallRobotServer(serverName:string,method:string,...args) {
		let callID = md5(kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,100000) + "|method=" + method)
		let wait = new kdasync.wait()
		this.waitCallInfos_.push({
			callID,
			wait:wait,
			timestamp:kdutils.getMillionSecond()
		})
		this.sendToMaster(RobotEnvIpcMessage.ToMaster_CallRpcCenter,<RobotEnvIpcMessage.tToMaster_CallRpcCenterReq>{
			callID,
			serverName,
			robotInternal:true,
			method,
			args,
		})
		TraceLog.robotEnv(null,"rpcCallRobotServer internal = " + true,callID,serverName,method,...args)
		Log.oth.info("send call rpc server = " + serverName + " internal = true " + " method = " + method + " callID = " + callID,args)
		return await wait.promise
	}

	async rpcCallRobot(method:string,...args) {
		let callID = md5(kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,100000) + "|method=" + method)
		let wait = new kdasync.wait()
		this.waitCallInfos_.push({
			callID,
			wait:wait,
			timestamp:kdutils.getMillionSecond()
		})
		this.sendToMaster(RobotEnvIpcMessage.ToMaster_CallRpcCenter,<RobotEnvIpcMessage.tToMaster_CallRpcCenterReq>{
			callID,
			robotInternal:true,
			method,
			args,
		})
		TraceLog.robotEnv(null,"rpcCallRobot internal = " + true,callID,null,method,...args)
		Log.oth.info("send call rpc internal = true " + " method = " + method + " callID = " + callID,args)
		return await wait.promise
	}
}