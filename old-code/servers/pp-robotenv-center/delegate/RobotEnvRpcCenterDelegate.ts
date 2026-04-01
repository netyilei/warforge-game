import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { Rpc } from "../rpc";
import { Log } from "../log";
import { RobotRpcMethods } from "../../pp-base-define/RobotRpcMethods";
import { DB } from "../../src/db";
import { TraceLog } from "../../src/TraceLog";


let redis = DB.getRedis()
export class RobotEnvRpcCenterDelegate extends knRpcManagerInterface.baseDelegate {
	
	private reClients:{
		h:string,
		gameID:number,
		serviceInfo:knRpcDefine.ServiceInfo
	}[] = []

	private logicClients:{
		h:string,
		gameIDs:number[],
		serviceInfo:knRpcDefine.ServiceInfo,
	}[] = []

	getEnvClients(gameID:number) {
		return this.reClients.filter(v=>v.gameID == gameID)
	}
	getLogicClients(gameID:number) {
		return this.logicClients.filter(v=>v.gameIDs.includes(gameID))
	}

	async saveEnvCache() {
		await redis.set("t_robot_center_env_register",this.reClients,true)
	}
	async saveLogicCache() {
		await redis.set("t_robot_center_logic_register",this.logicClients,true)
	}
	regEnv(h:string,gameID:number) {
		let client = Rpc.robot.getClientInfoByH(h)
		if(client) {
			Log.oth.info("env client reg gameID = " + gameID + " name = " + client.name)
			TraceLog.robot(null,"env client reg gameID = " + gameID + " name = " + client.name)
			let idx = this.reClients.findIndex(v=>v.serviceInfo.name == client.name)
			if(idx >= 0) {
				this.reClients.splice(idx,1)
				Log.oth.error("client reg twice name = " + client.name)
			}
			this.reClients.push({
				h,
				gameID,serviceInfo:client,
			})
			for(let logicClient of this.logicClients) {
				Rpc.robot.callServer(client.name,RobotRpcMethods.env_onLogicOnline,logicClient.serviceInfo,logicClient.gameIDs)
			}
			this.saveEnvCache()
		}
	}
	regLogic(h:string,gameIDs:number[]) {
		let client = Rpc.robot.getClientInfoByH(h)
		if(client) {
			Log.oth.info("logic client reg gameIDs = ",gameIDs," name = " + client.name)
			TraceLog.robot(null,"logic client reg gameIDs = ",gameIDs," name = " + client.name)
			let idx = this.logicClients.findIndex(v=>v.serviceInfo.name == client.name)
			if(idx >= 0) {
				this.logicClients.splice(idx,1)
				Log.oth.error("client reg twice name = " + client.name)
			}
			this.logicClients.push({
				h,
				gameIDs,serviceInfo:client,
			})
			for(let envClient of this.reClients) {
				Rpc.robot.callServer(envClient.serviceInfo.name,RobotRpcMethods.env_onLogicOnline,client,gameIDs)
			}
			this.saveLogicCache()
		}
	}
	onClientClose(h:string,serviceInfo: knRpcDefine.ServiceInfo): void {
		Log.oth.info("onClientClose name = " + serviceInfo.name)
		let idx = this.reClients.findIndex(v=>v.h == h)
		if(idx >= 0) {
			let client = this.reClients[idx]
			Log.oth.info("env client closed name = " + client.serviceInfo.name + " gameID = " + client.gameID)
			TraceLog.robot(null,"env client closed name = " + client.serviceInfo.name + " gameID = " + client.gameID)
			this.reClients.splice(idx,1)
			this.saveEnvCache()
			return 
		}
		idx = this.logicClients.findIndex(v=>v.h == h)
		if(idx >= 0) {
			let client = this.logicClients[idx]
			Log.oth.info("logic client closed name = " + client.serviceInfo.name + " gameIDs = ",client.gameIDs)
			TraceLog.robot(null,"logic client closed name = " + client.serviceInfo.name + " gameIDs = ",client.gameIDs)
			this.logicClients.splice(idx,1)
			
			for(let envClient of this.reClients) {
				Rpc.robot.callServer(envClient.serviceInfo.name,RobotRpcMethods.env_onLogicOffline,serviceInfo.name)
			}
			this.saveLogicCache()
			return 
		}
		
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo): void {
		Log.oth.info("onCloseToService name = " + serviceInfo.name)
		let idx = this.reClients.findIndex(v=>v.serviceInfo.name == serviceInfo.name)
		if(idx >= 0) {
			let client = this.reClients[idx]
			Log.oth.info("env client closed name = " + client.serviceInfo.name + " gameID = " + client.gameID)
			this.reClients.splice(idx,1)
			this.saveEnvCache()
			return 
		}
		idx = this.logicClients.findIndex(v=>v.serviceInfo.name == serviceInfo.name)
		if(idx >= 0) {
			let client = this.logicClients[idx]
			Log.oth.info("logic client closed name = " + client.serviceInfo.name + " gameIDs = ",client.gameIDs)
			this.logicClients.splice(idx,1)
			
			for(let envClient of this.reClients) {
				Rpc.robot.callServer(envClient.serviceInfo.name,RobotRpcMethods.env_onLogicOffline,serviceInfo.name)
			}
			this.saveLogicCache()
			return 
		}
		
	}
}