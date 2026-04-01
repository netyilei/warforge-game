import { kdutils } from "kdweb-core/lib/utils"
import { Log } from "../log"
import { DB } from "../../src/db"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { RobotDefine } from "../../pp-base-define/RobotDefine"
import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess"
import { Rpc } from "../rpc"
import { knIpcMsg, knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { RobotEnvIpcMessage } from "./RobotEnvIpcMessage"
import { kdasync } from "kdweb-core/lib/tools/async"
import { TraceLog } from "../../src/TraceLog"
import { ItemID } from "../../pp-base-define/ItemDefine"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import _ from "underscore"
import Decimal from "decimal.js"
import { RobotEnvTools } from "../../src/RobotEnvTools"
import { RobotUtils } from "../../src/RobotUtils"
import { RobotExtDefine } from "../../pp-base-define/RobotExtDefine"
import { Module_RobotExtGroupPlan, Module_RobotExtMatchPlan, Module_RobotRuntime } from "../../pp-base-define/DM_RobotExtension"
import { Module_MatchData } from "../../pp-base-define/DM_MatchDefine"
import { MatchDefine } from "../../pp-base-define/MatchDefine"

let db = DB.get()
let redis = DB.getRedis()
export class RobotEnvMaster {
	constructor() {
		setInterval(()=>{
			this.onUpdate()
		},10000)
		this.master_ = new knProcess.master({
			count:-1,
			serviceInfo:Rpc.serviceInfo,
			keep:true,
			childClazz:knProcess.child,
			filename:"sub",
			funcGetArgs:(idx)=>{
				let info = this.childInfos_.find(v=>v.idx == idx)
				if(info.groupID) {
					return [1,info.groupID,info.planID]
				} else if(info.clubID) {
					return [0,info.clubID,info.planID]
				} else if(info.matchID) {
					return [2,info.matchID,info.planID]
				}
				return []
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
	}

	private master_:knProcess.master
	private childInfos_:{
		idx:number,
		child:knProcess.child,
		groupID?:number,
		matchID?:number,
		clubID?:number,
		planID?:number,
	}[] = []
	private updating_ = false 
	async onUpdate() {
		if(this.updating_) {
			return 
		}
		this.updating_ = true 
		try {
			let control = await RobotUtils.getGlobalControl()
			if(!control || !control.enabled) {
				return 
			}
			if(this.childInfos_.length == 0) {
				this.startChild()
				await kdasync.timeout(100)
			}
			
			if(control.groupEnabled) {
				let groupPlans = await this.peekGroupPlans()
				for(let plan of groupPlans) {
					let info = control.groups?.find(v=>v.groupID == plan.groupID)
					if(!info || info.enabled) {
						let child = this.childInfos_.find(v=>v.groupID == plan.groupID)
						if(!child) {
							this.startChild(plan.groupID,null,null,plan.planID)
						} else if(child.planID != plan.planID) {
							this.sendToChildInfo(child,RobotEnvIpcMessage.ToWorker_PlanChanged,{
								planID:plan.planID
							})
							child.planID = plan.planID
						}
					}
				}
			}
			if(control.matchEnabled) {
				let matchPlans = await this.peekMatchPlans()
				if(matchPlans.length > 0) {
					// await TraceLog.robotEnv(null,"current match plans",matchPlans)
				} else {
					// await TraceLog.robotEnv(null,"no match plans found")
				}
				let sets = new Set<number>()
				for(let plan of matchPlans) {
					let child = this.childInfos_.find(v=>v.matchID == plan.matchID)
					// await TraceLog.robotEnv(null,"check match plan",plan,child,this.childInfos_.map(v=>({idx:v.idx,matchID:v.matchID,planID:v.planID})))

					if(!child) {
						// await TraceLog.robotEnv(null,"start match plan child is null",plan)
						let idx = this.master_.nextIndex
						this.startChild(null,null,plan.matchID,plan.planID)
						sets.add(idx)
						// await TraceLog.robotEnv(null,"start match plan",{idx,matchID:plan.matchID})
					} else if(child.planID != plan.planID) {
						this.sendToChildInfo(child,RobotEnvIpcMessage.ToWorker_PlanChanged,{
							planID:plan.planID
						})
						child.planID = plan.planID
						sets.add(child.idx)
						// await TraceLog.robotEnv(null,"match plan changed",child)
					} else {
						sets.add(child.idx)
						// await TraceLog.robotEnv(null,"match plan exists, keep running",child)
					}
				}
				if(sets.size > 0) {
					// await TraceLog.robotEnv(null,"current match plan workers",Array.from(sets))
				}
				for(let i = this.childInfos_.length - 1 ; i >= 0 ; i --) {
					let childInfo = this.childInfos_[i]
					if(childInfo.matchID) {
						if(sets.has(childInfo.idx)) {
							continue
						}
						Log.oth.info("child plan not exists, closed",childInfo)
						await TraceLog.robotEnv(null,"child plan not exists, closed",childInfo)
						this.childInfos_.splice(i,1)
						this.master_.closeChild(childInfo.idx)
					}
				}
			}

			for(let i = this.childInfos_.length - 1 ; i >= 0 ; i --) {
				let childInfo = this.childInfos_[i]
				// if(childInfo.groupID == null && childInfo.clubID == null) {
				// 	continue
				// }
				let close = false 
				if(childInfo.groupID != null) {
					let config = control.groups.find(v=>v.groupID == childInfo.groupID)
					if(config && !config.enabled) {
						close = true
					}
				} else if(childInfo.matchID != null) {
					if(control && !control.matchEnabled) {
						close = true
					}
				}
				if(close) {
					Log.oth.info("child invalid, closed",childInfo)
					TraceLog.robotEnv(null,"child invalid, closed",childInfo)
					this.childInfos_.splice(i,1)
					this.master_.closeChild(childInfo.idx)
				}
			}
			// await this.checkNeedRestoreRobot();
			await this.resetRobotStatus();
		} catch (error) {
			Log.oth.error("RobotEnvLooper",error)
		} finally {
			this.updating_ = false 
		}
	}

	async peekGroupPlans() : Promise<RobotExtDefine.tGroupPlan[]> {
		let groupIDs = (await db.getOption(DBDefine.tableGroupData,{},{
			projection:{groupID:1}
		}) || []).map(v=>v.groupID)
		for(let i = groupIDs.length - 1; i >= 0; i--) {
			let child = this.childInfos_.find(v=>v.groupID == groupIDs[i])
			if(child) {
				groupIDs.splice(i,1)
			}
		}
		if(groupIDs.length == 0) {
			return []
		}
		let plans:RobotExtDefine.tGroupPlan[] = await Module_RobotExtGroupPlan.getOption({
			groupID:{$in:groupIDs},
			enabled:true,
		},{
			sort:{planID:-1}
		})
		let rets: RobotExtDefine.tGroupPlan[] = []
		for(let groupID of groupIDs) {
			let filterPlans = plans.filter(v=>v.groupID == groupID)
			if(filterPlans.length == 0) {
				continue
			}
			let monopolyPlan = filterPlans.find(v=>v.monopoly)
			if(monopolyPlan) {
				rets.push(monopolyPlan)
				continue 
			}
			let powers = filterPlans.reduce((pre,cur)=>(pre + (cur.power || 0)),0)
			let p = kdutils.intRandom(0,powers)
			let total = 0
			for(let plan of filterPlans) {
				total += (plan.power || 0)
				if(p <= total) {
					rets.push(plan)
					break 
				}
			}
		}
		return rets
	}

	async peekMatchPlans() : Promise<RobotExtDefine.tMatchPlan[]> {
		let timestamp = kdutils.getMillionSecond()
		let matchIDs = (await Module_MatchData.getOption({status:{$lte:MatchDefine.MatchStatus.Running}},{
			projection:{matchID:1}
		})).map(v=>v.matchID)
		// for(let i = matchIDs.length - 1; i >= 0; i--) {
		// 	let child = this.childInfos_.find(v=>v.matchID == matchIDs[i])
		// 	if(child) {
		// 		matchIDs.splice(i,1)
		// 	}
		// }
		if(matchIDs.length == 0) {
			return []
		}
		let plans:RobotExtDefine.tMatchPlan[] = await Module_RobotExtMatchPlan.getOption({
			matchID:{$in:matchIDs},
			enabled:true,
			startTimestamp:{$lte:timestamp},
		},{
			sort:{
				planID:-1
			}
		})
		let rets:RobotExtDefine.tMatchPlan[] = []
		for(let matchID of matchIDs) {
			let plan = plans.find(v=>v.matchID == matchID)
			if(!plan) {
				continue 
			}
			rets.push(plan)
		}
		return rets
	}
	startChild(groupID?:number,clubID?:number,matchID?:number,planID?:number) {
		let info = this.childInfos_.find(v=>v.groupID == groupID && v.clubID == clubID && v.matchID == matchID)
		if(info) {
			return true 
		}
		info = {
			idx:this.master_.nextIndex,
			child:null,
			groupID,clubID,matchID,planID
		}
		Log.oth.info("start child groupID = " + groupID + " clubID = " + clubID + " matchID = " + matchID + " planID = " + planID)

		TraceLog.robotEnv(null,"start child groupID = " + groupID + " clubID = " + clubID + " matchID = " + matchID + " planID = " + planID)
		
		this.childInfos_.push(info)
		this.master_.startChild()
		info.child = this.master_.childs.find(v=>v.idx == info.idx).child
		info.child.funcMessage = (child,obj:knIpcMsg.Base)=>{
			switch(obj.cmd) {
				case knIpcMsg.CMD.RpcProcess:{
					let msg:knIpcMsg.tCMDRpc = obj.data
					Log.oth.info("recv worker msg idx = " + info.idx,obj)
					switch(msg.msgName) {
						case RobotEnvIpcMessage.ToMaster_CallRpcCenter:{
							let t:RobotEnvIpcMessage.tToMaster_CallRpcCenterReq = msg.obj
							let promise:Promise<knRpcDefine.ClientCallReturn>
							if(t.serverName) {
								promise = (t.robotInternal ? Rpc.robot : Rpc.center).callServer(t.serverName,t.method,...t.args)
							} else {
								promise = (t.robotInternal ? Rpc.robot : Rpc.center).call(t.method,...t.args)
							}
							promise.then((ret)=>{
								this.sendToChildInfo(info,RobotEnvIpcMessage.ToMaster_CallRpcCenter,<RobotEnvIpcMessage.tToMaster_CallRpcCenterRes>{
									callID:t.callID,
									type:ret.type,
									data:ret.data,
								})
							})
						} break 
						case RobotEnvIpcMessage.ToMaster_RefreshLogicClient:{
							this.sendLogicToWorker(info.idx)
						} break 
						case RobotEnvIpcMessage.ToMaster_ChildEnd:{
							let idx = this.childInfos_.findIndex(v=>v.idx == info.idx)
							if(idx >= 0) {
								Log.oth.info("child end closed idx = " + info.idx)
								TraceLog.robotEnv(null,"child end closed idx = " + info.idx)
								this.childInfos_.splice(idx,1)
								this.master_.closeChild(info.idx)
							}
						} break 
					} break 
				}
			}
		}
		return true 
	}
	sendToAllChild(msgName:string,data:any) {
		for(let childInfo of this.childInfos_) {
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

	sendToChildInfo(childInfo:typeof this.childInfos_[0],msgName:string,data:any) {
		Log.oth.info("send to worker " + childInfo.idx + " msg = " + msgName,data)
		return childInfo.child.send({
			cmd:knIpcMsg.CMD.RpcProcess,
			data:<knIpcMsg.tCMDRpc>{
				msgName,
				obj:data,
			}
		})
	}

	sendLogicToWorker(specialWorkerIdx?:number) {
		if(specialWorkerIdx != null) {
			this.sendToChildIdx(specialWorkerIdx,RobotEnvIpcMessage.ToWorker_LogicClientChanged,<RobotEnvIpcMessage.tToWorker_LogicClientChanged>{
				clients:Rpc.robotDelegate.logicClients,
			})
		} else {
			for(let info of this.childInfos_) {
				this.sendToChildInfo(info,RobotEnvIpcMessage.ToWorker_LogicClientChanged,<RobotEnvIpcMessage.tToWorker_LogicClientChanged>{
					clients:Rpc.robotDelegate.logicClients,
				})
			}
		}
	}

	randomDecimal(min, max) {
        const minDec = new Decimal(min);
        const maxDec = new Decimal(max);
    
        // 生成一个介于 0 和 1 之间的随机数
        const random = Math.random();
    
        // 将随机数映射到 [min, max) 范围内
        return minDec.plus(new Decimal(random).times(maxDec.minus(minDec)));
    }

	async resetRobotStatus(){
		let nowTime = kdutils.getMillionSecond()
		let runtimes = await Module_RobotRuntime.getOption({
			status:RobotDefine.Status.Rest,
			restTimestamp:{$lte:nowTime}
		},{
			projection:{robotUserID:1}
		}) || []

		let userIDs = runtimes.map(v=>v.robotUserID)

		await Module_RobotRuntime.updateManyOrigin({robotUserID:{$in:userIDs}},{
			$set:{
				restDate:null,
				restTimestamp:null,
				storeID:null,
				status:RobotDefine.Status.Ready,
			}
		})
	}
	// 以下弃用功能
	// async checkNeedRestoreRobot(){
	// 	//基础配置
	// 	let config:RobotDefine.tEnvConfig = await redis.get(DBDefine.rTableRobotEnvConfig,true)
	// 	let fullClubs:RobotDefine.tEnvConfig_Club[] = config.clubs || []
	// 	fullClubs.push(config.defaultClub)
	// 	let fullGroups:RobotDefine.tEnvConfig_Group[] = config.groups || []
	// 	fullGroups.push(config.defaultGroup)

	// 	//let itemID = ItemID.USDT;
	// 	//行为配置
	// 	let strategys:RobotDefine.tRobotStrategy[] = await db.get(DBDefine.tableRobotStrategyConfig,{})
	// 	for (const strategy of strategys) {
	// 		let clubIDs = strategy.clubIDs || []
	// 		let groupIDs = strategy.groupIDs || []
	// 		let robotUserIDs = strategy.robotUserIDs || []
	// 		let envClubIDs = fullClubs.map(v=>v.clubID)
	// 		let envGroupIDs = fullGroups.map(v=>v.groupID)
	// 		let iClubIDs = _.intersection(clubIDs,envClubIDs)
	// 		let iGroupIDs = _.intersection(groupIDs,envGroupIDs)


	// 		let charges:Record<string,{
	// 			itemID:string,
	// 			minChargeValue:string,			// 最小充值
	// 			maxChargeValue:string,			// 最大充值
		
	// 			needChargeLeastValue:string,	// 触发充值额度
	// 		}[]> ={};
	// 		for (const id of iClubIDs) {
	// 			let _find = fullClubs.find(v=>v.clubID == id)
	// 			if(_find.autoCharge) {

	// 				for (const charge of _find.charges) {
	// 					if(charges[charge.itemID] ){
	// 						charges[charge.itemID].push(charge)
	// 					}else{
	// 						charges[charge.itemID] = [charge]
	// 					}
	// 				}
	// 				// let _charge = _find.charges.find(v=>v.itemID == itemID)
	// 				// if(_charge){
	// 				// 	if(new Decimal(_charge.minChargeValue).greaterThan(minChargeValue)){
	// 				// 		minChargeValue = _charge.minChargeValue
	// 				// 	}
	// 				// 	if(new Decimal(_charge.maxChargeValue).lessThan(maxChargeValue)){
	// 				// 		maxChargeValue = _charge.maxChargeValue
	// 				// 	}else if(maxChargeValue == "0"){
	// 				// 		maxChargeValue = _charge.maxChargeValue
	// 				// 	}
	// 				// 	if(new Decimal(_charge.needChargeLeastValue).lessThan(needChargeLeastValue)){
	// 				// 		needChargeLeastValue = _charge.needChargeLeastValue
	// 				// 	}else if(needChargeLeastValue == "0"){
	// 				// 		needChargeLeastValue = _charge.needChargeLeastValue
	// 				// 	}
	// 				// }
	// 			}
	// 		}
	// 		for (const id of iGroupIDs) {
	// 			let _find = fullGroups.find(v=>v.groupID == id)
	// 			if(_find.autoCharge) {
	// 				for (const charge of _find.charges) {
	// 					if(charges[charge.itemID] ){
	// 						charges[charge.itemID].push(charge)
	// 					}else{
	// 						charges[charge.itemID] = [charge]
	// 					}
	// 				}
	// 				//let _charge = _find.charges.find(v=>v.itemID == itemID)
	// 				// if(_charge){
	// 				// 	if(new Decimal(_charge.minChargeValue).greaterThan(minChargeValue)){
	// 				// 		minChargeValue = _charge.minChargeValue
	// 				// 	}
	// 				// 	if(new Decimal(_charge.maxChargeValue).lessThan(maxChargeValue)){
	// 				// 		maxChargeValue = _charge.maxChargeValue
	// 				// 	}else if(maxChargeValue == "0"){
	// 				// 		maxChargeValue = _charge.maxChargeValue
	// 				// 	}
	// 				// 	if(new Decimal(_charge.needChargeLeastValue).lessThan(needChargeLeastValue)){
	// 				// 		needChargeLeastValue = _charge.needChargeLeastValue
	// 				// 	}else if(needChargeLeastValue == "0"){
	// 				// 		needChargeLeastValue = _charge.needChargeLeastValue
	// 				// 	}
	// 				//}
	// 			}
	// 		}

	// 		//多币种
	// 		for (const key in charges) {
	// 			let minChargeValue = "0";
	// 			let maxChargeValue =  "0";
	// 			let needChargeLeastValue =  "0";
	// 			for (const _charge of charges[key]) {
	// 				if(new Decimal(_charge.minChargeValue).greaterThan(minChargeValue)){
	// 					minChargeValue = _charge.minChargeValue
	// 				}
	// 				if(new Decimal(_charge.maxChargeValue).lessThan(maxChargeValue)){
	// 					maxChargeValue = _charge.maxChargeValue
	// 				}else if(maxChargeValue == "0"){
	// 					maxChargeValue = _charge.maxChargeValue
	// 				}
	// 				if(new Decimal(_charge.needChargeLeastValue).lessThan(needChargeLeastValue)){
	// 					needChargeLeastValue = _charge.needChargeLeastValue
	// 				}else if(needChargeLeastValue == "0"){
	// 					needChargeLeastValue = _charge.needChargeLeastValue
	// 				}
	// 			}
	// 			if(minChargeValue == "0" || maxChargeValue == "0" || needChargeLeastValue == "0"){
	// 				continue;
	// 			}
	// 			let runtimes:RobotDefine.tRuntime[] = await db.getOption(DBDefine.tableRobotRuntime,{
	// 				status:RobotDefine.Status.Ready,
	// 				robotUserID:{$in:robotUserIDs}
	// 			},{
	// 				projection:{robotUserID:1}
	// 			}) || []
	
	// 			let userIDs = runtimes.map(v=>v.robotUserID)
	
	// 			let pipes = [
	// 				{$match:{userID:{$in:userIDs}}},
	// 				{$unwind:"$items"},
	// 				{$match:{"items.id":key}},
	// 				{$project:{
	// 					userID:1,
	// 					itemID:"$item.id",
	// 					count:{$toDouble:"$items.count"},
	// 				}},
	// 				{$match:{count:{$lte:parseInt(needChargeLeastValue)}}},
	// 			]
	// 			//Log.oth.info("pipelines = ",JSON.stringify(pipes))
	// 			let bags:{
	// 				userID:number,itemID:string,count:number,
	// 			}[] = await db.aggregate("t_bag",pipes)
	// 			for (const bag of bags) {
	// 				let cost = this.randomDecimal(minChargeValue,maxChargeValue).toDecimalPlaces(0);
	// 				Log.oth.info("robot need charge userID",bag.userID," cost = ",cost," itemID = ",key," needChargeLeastValue = ",needChargeLeastValue," minChargeValue = ",minChargeValue," maxChargeValue = ",maxChargeValue)
	// 				await RobotEnvTools.reqStore(Rpc.center,bag.userID,key,cost,"robot charge")
	// 			}
	// 		}
	// 	}
	// }
	
}