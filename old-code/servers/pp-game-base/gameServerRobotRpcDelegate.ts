import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { GameServerBase } from "./gameServerBase";



export class GameServerRobotRpcDelegate extends knRpcManagerInterface.baseDelegate {
	constructor(gameServer:GameServerBase) {
		super()
		this.gameServer_ = gameServer
	}
	private gameServer_:GameServerBase
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo){
		this.gameServer_.onRobotRpcReg(serviceInfo)
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo){
		this.gameServer_.onRobotRpcClosed(serviceInfo)
	}
}