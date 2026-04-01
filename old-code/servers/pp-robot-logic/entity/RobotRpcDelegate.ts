import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { Rpc } from "../rpc";
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { Log } from "../log";
import { Config } from "../config";
import { RobotRpcMethods } from "../../pp-base-define/RobotRpcMethods";
import { ServerValues } from "../../pp-base-define/ServerConfig";
import { TraceLog } from "../../src/TraceLog";


export class RobotGSRpcDelegate extends knRpcManagerInterface.baseDelegate {
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo) {
		Log.oth.info("gss connected = " + serviceInfo.name)
		TraceLog.robot(null,"gss connected",serviceInfo.name)
		Rpc.robotGS.callServer(serviceInfo.name,GSRpcMethods.robotGetInfo)
		.then((ret)=>{
			Log.oth.info("gs info name = " + serviceInfo.name,ret)
			TraceLog.robot(null,"gs info",serviceInfo.name,ret.data)
			if(ret.data) {
				Rpc.master.setGameServerReady(serviceInfo.name,{gameID:ret.data.gameID})
			} else {
				setTimeout(()=>{
					Rpc.robotGS.stopClient(serviceInfo.name)
				},1)
			}
		})
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo) {
		Log.oth.info("gss disconnected = " + serviceInfo.name)
		TraceLog.robot(null,"gss disconnected",serviceInfo.name)
		Rpc.master.setGameServerReady(serviceInfo.name,{offline:false})
	}
}

export class RobotInternalRpcDelegate extends knRpcManagerInterface.baseDelegate {
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo) {
		if(serviceInfo.name == ServerValues.robotCenterName) {
			Rpc.robotInternal.callServer(serviceInfo.name,RobotRpcMethods.center_regLogic,Config.localConfig.games.map(v=>v.gameID))
		}
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo) {

	}
}