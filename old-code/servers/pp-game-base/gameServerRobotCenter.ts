// import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager"
// import { ServerValues } from "../pp-base-define/ServerConfig"
// import { knRpcTools } from "../src/knRpcTools"
// import { Log } from "./log"
// import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface"
// import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
// import { kds } from "../pp-base-define/GlobalMethods"
// import { GameServerBase } from "./gameServerBase"


// export class GameServerRobotCenter {
// 	constructor(rpc:knRpcManager.base,gameServer:GameServerBase) {
// 		this.rpc_ = rpc 
// 		this.gameServer_ = gameServer
// 		this.init()
// 	}
// 	private valid_:boolean = false 
// 	get valid() {
// 		return this.valid_
// 	}
// 	private gameServer_:GameServerBase

// 	private rpc_:knRpcManager.base
// 	protected async init() {
// 		this.valid_ = false 
// 		let name = ServerValues.robotCenterName
// 		if(!name) {
// 			this.logError("init robot center failed name is null")
// 			return false 
// 		}
// 		let config = await knRpcTools.getConfig(name)
// 		if(!config) {
// 			this.logError("init robot center failed config not found name = " + name)
// 			return false 
// 		}

// 		this.rpc_.startClient(config,{keep:true,center:false})
// 	}
// 	log(title:string,...params) {
// 		Log.oth.info("[GameServerRobotCenter] " + title,...params)
// 	}
// 	logError(title:string,...params) {
// 		Log.oth.error("[GameServerRobotCenter] " + title,...params)
// 	}

// 	private isRegToCenter_:boolean
// 	get isRegToCenter() {
// 		return this.isRegToCenter_
// 	}
// 	onRegToService(serviceInfo: knRpcDefine.ServiceInfo){
// 		if(serviceInfo.name == ServerValues.robotCenterName) {
// 			this.rpc_.callServer(serviceInfo.name,kds.robot.center.gs.reg,this.gameServer_.config.gameID)
// 			this.isRegToCenter_ = true 
// 		}
// 	}
// 	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo){
// 		if(serviceInfo.name == ServerValues.robotCenterName) {
// 			this.isRegToCenter_ = false 
// 		}
// 	}
// }