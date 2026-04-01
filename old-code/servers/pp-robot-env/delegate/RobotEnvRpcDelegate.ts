import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { Rpc } from "../rpc";
import { Log } from "../log";
import { ServerValues } from "../../pp-base-define/ServerConfig";
import { RobotRpcMethods } from "../../pp-base-define/RobotRpcMethods";

export type tRobotEnvLogicInfo = {
	gameIDs:number[],
	serviceInfo:knRpcDefine.ServiceInfo,
	online:boolean,
}

export class RobotEnvRpcDelegate extends knRpcManagerInterface.baseDelegate {
	private logicClients_:tRobotEnvLogicInfo[] = []

	get logicClients() {
		return this.logicClients_
	}

	getLogicClients(gameID:number) {
		return this.logicClients_.filter(v=>v.online && v.gameIDs.includes(gameID))
	}

	onLogicOnline(serviceInfo:knRpcDefine.ServiceInfo,gameIDs:number[]) {
		Log.oth.info("logic client reg gameIDs = ",gameIDs," name = " + serviceInfo.name)
		let client = this.logicClients_.find(v=>v.serviceInfo.name == serviceInfo.name)
		if(client) {
			Log.oth.error("client reg twice name = " + serviceInfo.name)
			client.gameIDs = gameIDs
			return 
		}
		this.logicClients_.push({
			gameIDs,serviceInfo:serviceInfo,online:true
		})
		Rpc.robot.startClient(serviceInfo,{keep:true})
	}

	onLogicOffline(name:string) {
		Log.oth.info("logic offline name = " + name)
		let idx = this.logicClients_.findIndex(v=>v.serviceInfo.name == name)
		if(idx >= 0) {
			this.logicClients_.splice(idx,1)
		}
		// Rpc.robot.stopClient(name)
	}

	onRegToService(serviceInfo: knRpcDefine.ServiceInfo): void {
		Log.oth.info("onRegToService",serviceInfo)
		if(serviceInfo.name == ServerValues.robotCenterName) {
			Rpc.robot.callServer(serviceInfo.name,RobotRpcMethods.center_regEnv)
			return 
		}
		let client = this.logicClients_.find(v=>v.serviceInfo.name == serviceInfo.name)
		if(client) {
			Log.oth.info("logic client connected name = " + client.serviceInfo.name)
			client.online = true 
			Rpc.master.sendLogicToWorker()
		}
	}

	onClientClose(h: string, serviceInfo: knRpcDefine.ServiceInfo): void {
		let idx = this.logicClients_.findIndex(v=>v.serviceInfo.name == serviceInfo.name)
		if(idx >= 0) {
			let client = this.logicClients_[idx]
			client.online = false 
			Log.oth.info("logic client closed name = " + client.serviceInfo.name + " gameIDs = ",client.gameIDs)
			Rpc.master.sendLogicToWorker()
			return 
		}
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo): void {
		let idx = this.logicClients_.findIndex(v=>v.serviceInfo.name == serviceInfo.name)
		if(idx >= 0) {
			let client = this.logicClients_[idx]
			client.online = false 
			Log.oth.info("logic client closed name = " + client.serviceInfo.name + " gameIDs = ",client.gameIDs)
			Rpc.master.sendLogicToWorker()
			return 
		}
	}
}