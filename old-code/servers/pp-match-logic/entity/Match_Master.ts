import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { Rpc } from "../rpc";
import { knIpcMsg, knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { MatchIpcMessage } from "./MatchIpcMessage";
import { Log } from "../log";
import { kdutils } from "kdweb-core/lib/utils";
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { knRpcTools } from "../../src/knRpcTools";
import { DB } from "../../src/db";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { TimeDate } from "../../src/TimeDate";
import { Config } from "../config";
import { kdasync } from "kdweb-core/lib/tools/async";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { TraceLog } from "../../src/TraceLog";
import { Module_MatchData, Module_MatchExecuter, Module_MatchRuntime, Module_MatchUserSignUp } from "../../pp-base-define/DM_MatchDefine";
import { Module_RoomGSSrsNode } from "../../pp-base-define/DM_RoomDefine";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { kdreq } from "kdweb-core/lib/service/req";
import { MatchDefine } from "../../pp-base-define/MatchDefine";
import { RedisLock } from "../../src/RedisLock";


let db = DB.get()
let redis = DB.getRedis()
export class Match_Master {
	constructor() {
		this.master_ = new knProcess.master({
			count:-1,
			serviceInfo:Rpc.serviceInfo,
			keep:false,
			childClazz:knProcess.child,
			filename:"sub",
			funcGetArgs:(idx)=>{
				let info = this.childs_.find(v=>v.idx == idx)
				return [info.matchID,"exec-" + idx]
			},
			funcGetName:(idx)=>{
				return Rpc.serviceInfo.name + "-ipc-" + idx
			},
			funcCallMethod:async (req)=>{
				return null 
			},
			funcSendCallMethod:async (serverName,req)=>{
				Log.oth.info("funcSendCallMethod name = " + serverName,req)
				let serviceInfo = Rpc.center.getClientInfoByName(serverName)
				if(!serviceInfo) {
					Log.oth.error("send call failed serviceInfo not found name = " + serverName,req,req.sdata)
					this.master_.onProcessCallRes(<any>{name:serverName},{
						success:false,
						callID:req.callID,
						result:null,
						sdata:req.sdata,
					})
				}
				let p = Rpc.center.callServer(serverName,req.name,...req.args)
				if(req.wait) {
					let ret = await p
					this.master_.onProcessCallRes(serviceInfo,{
						success: ret.type == knRpcDefine.ClientCallReturnType.Success,
						callID: req.callID,
						result: ret.data,
						sdata: req.sdata,
					})
				} else {
					this.master_.onProcessCallRes(serviceInfo,{
						success: true,
						callID: req.callID,
						result: null,
						sdata: req.sdata,
					})
				}
			},
		})
		this.init()
	}
	private async init() {
		setInterval(() => {
			this.update()
		},3000);
	}
	private subLimitRobotCount_:number = 50

	private master_:knProcess.master
	get knMaster() {
		return this.master_
	}
	private childs_:{
		idx:number,
		matchID:number,
		child:knProcess.child,

		status:MatchDefine.MatchStatus,
		waitReady:kdasync.wait,
		loadedLimited:boolean	// 满负荷
	}[] = []
	private lastMatchID_:number

	getChild(matchID:number) {
		return this.childs_.find(v=>v.matchID == matchID)
	}
	startChild(matchID:number) {
		let workerIdx = this.master_.nextIndex
		let info = {
			idx: workerIdx,
			matchID,
			child:null,
			status:null,
			waitReady:new kdasync.wait,
			loadedLimited:false,
		}
		this.childs_.push(info)
		this.master_.startChild()
		let childInfo = this.master_.childs.find(v=>v.idx == workerIdx)
		info.child = childInfo.child

		Log.oth.info("start child logic matchID = " + matchID + " idx = " + workerIdx)
		TraceLog.match(null,"start child logic matchID = " + matchID + " idx = " + workerIdx)

		let prev = childInfo.child.funcMessage
		childInfo.child.funcMessage = (child,obj:knIpcMsg.Base)=>{
			if(prev) {
				prev(child,obj)
			}
			switch(obj.cmd) {
				case knIpcMsg.CMD.RpcProcess:{
					let msg:knIpcMsg.tCMDRpc = obj.data
					Log.oth.info("recv worker msg idx = " + info.idx,obj)
					TraceLog.match(null,"recv worker message",info.idx,msg.msgName,msg.obj)
					switch(msg.msgName) {
						case MatchIpcMessage.ToMaster_WorkerReady:{
							Log.oth.info("worker is ready idx = " + info.idx)
							TraceLog.match(null,"worker ready " + info.idx,info.idx)
							if(info.waitReady) {
								try {
									info.waitReady.resolve()
								} catch (error) {
									Log.oth.error("wait ready resolved error",error)
								}
								info.waitReady = null 
							}
						} break 
						case MatchIpcMessage.ToMaster_StatusChanged:{
							let statusInfo = <MatchIpcMessage.tToMaster_StatusChanged>msg.obj
							Log.oth.info("worker status changed idx = " + info.idx + " status = " + MatchDefine.MatchStatus[statusInfo.status])
							TraceLog.match(null,"worker status changed " + info.idx + " status = " + MatchDefine.MatchStatus[statusInfo.status],info.idx)
							info.status = statusInfo.status
						} break 
						case MatchIpcMessage.ToMaster_WorkerFullyEnded:{
							Log.oth.info("worker fully ended idx = " + info.idx + " matchID = " + info.matchID)
							TraceLog.match(null,"worker fully ended " + info.idx + " matchID = " + info.matchID,info.idx)
							this.master_.closeChild(info.idx)
						} break 
					}
				} break 
			}
		}
		for(let client of Rpc.center.clients) {
			this.master_.sendMethodChangedToChild(childInfo.idx,client.serviceInfo,client.client.methods,client.client.wildcards)
		}
		return {
			wait:info.waitReady,
			workerIdx:info.idx
		}
	}


	onRoomRealtimeChanged(matchID:number,roomID:number) {
		let child = this.childs_.find(v=>v.matchID == matchID)
		if(child) {
			this.sendToChildInfo(child,MatchIpcMessage.ToWorker_RoomRealtimeChanged,<MatchIpcMessage.tToWorker_RoomRealtimeChanged>{
				matchID,
				roomID,
				removed:false,
			})
		}
	}

	onRoomRealtimeRemoved(matchID:number,roomID:number) {
		let child = this.childs_.find(v=>v.matchID == matchID)
		if(child) {
			this.sendToChildInfo(child,MatchIpcMessage.ToWorker_RoomRealtimeChanged,<MatchIpcMessage.tToWorker_RoomRealtimeChanged>{
				matchID,
				roomID,
				removed:true,
			})
		}
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
		TraceLog.match(null,"send to worker idx = " + childInfo.idx,msgName,data)
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
		for(let i = this.childs_.length - 1; i >= 0; i--) {
			let childInfo = this.childs_[i]
			if(!childInfo.child.valid) {
				this.childs_.splice(i,1)
				Log.oth.info("child invalid removed idx = " + childInfo.idx + " matchID = " + childInfo.matchID)
				TraceLog.match(null,"child invalid removed idx = " + childInfo.idx + " matchID = " + childInfo.matchID)
				await Module_MatchRuntime.updateOrigin({
					matchID:childInfo.matchID,
				},{
					$set:{
						executerOnline:false,
					}
				})
			}
		}
		try {
			let time = kdutils.getMillionSecond()
			let step = 50
			if(this.lastMatchID_ == null) {
				this.lastMatchID_ = 0
			}
			let newMatchDatas = await Module_MatchData.getOption({
				matchID:{$gte:this.lastMatchID_},
				status:{$lt:MatchDefine.MatchStatus.Ended},
				startTime:{$lte:time + 60000},	// 提前一分钟开始的
			},{
				sort:{matchID:1},
				limit:step,
			})
			for(let matchData of newMatchDatas) {
				this.lastMatchID_ = matchData.matchID + 1
				let child = this.getChild(matchData.matchID)
				if(!child) {
					let runtime:MatchDefine.tRuntime = {
						matchID:matchData.matchID,
						
						masterName:Config.myName,
						masterHost:null,

						executerIdx:-1,
						executerOnline:false,

						startTimestamp:kdutils.getMillionSecond(),
						startDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					}
					await Module_MatchRuntime.updateOrInsert(runtime)
					let ret = this.startChild(matchData.matchID)
					runtime.executerIdx = ret.workerIdx
					runtime.executerOnline = true
					await Module_MatchRuntime.updateOrInsert(runtime)
				}
				Log.oth.info("load match logic matchID = " + matchData.matchID + " lastMatchID = " + this.lastMatchID_)
			}
		} catch (error) {
			Log.oth.error("update error",error)
		} finally {
			this.updateing_ = false 
		}
	}

}