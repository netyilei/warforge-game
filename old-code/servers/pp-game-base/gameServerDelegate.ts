import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { GameServerBase } from "./gameServerBase";


export class GameServerSrsDelegate extends knRpcManagerInterface.baseDelegate {
	private funcOnRegToService_:(serviceInfo: knRpcDefine.ServiceInfo)=>any = null 
	get funcOnRegToService() {
		return this.funcOnRegToService_
	}
	set funcOnRegToService(v) {
		this.funcOnRegToService_ = v
	}
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo){
		if(this.funcOnRegToService) {
			this.funcOnRegToService(serviceInfo)
		}
	}
	private funcOnCloseToService_:(serviceInfo:knRpcDefine.ServiceInfo)=>any = null
	get funcOnCloseToService() {
		return this.funcOnCloseToService_
	}
	set funcOnCloseToService(v) {
		this.funcOnCloseToService_ = v
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo){
		if(this.funcOnCloseToService) {
			this.funcOnCloseToService(serviceInfo)
		}
	}
}

export class GameServerCenterDelegate extends knRpcManagerInterface.baseDelegate {
	constructor(gameServer:GameServerBase) {
		super()
		this.gameServer_ = gameServer
	}
	private gameServer_:GameServerBase
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo){
		// if(this.gameServer_.robotCenter && this.gameServer_.robotCenter.valid) {
		// 	this.gameServer_.robotCenter.onRegToService(serviceInfo)
		// }
		this.gameServer_.onCenterRpc_RegToService(serviceInfo)
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo){
		// if(this.gameServer_.robotCenter && this.gameServer_.robotCenter.valid) {
		// 	this.gameServer_.robotCenter.onCloseToService(serviceInfo)
		// }
	}
}