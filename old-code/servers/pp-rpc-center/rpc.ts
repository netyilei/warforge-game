
import { knRpcCenter } from "kdweb-core/lib/rpc-kn/knRpcCenter"
import { kdutils } from "kdweb-core/lib/utils"
import { ServerConfig, ServerValues } from "../pp-base-define/ServerConfig"
import { Config } from "./config"
import { Log } from "./log"
export namespace Rpc {
	export let center:knRpcCenter.entity

	
	export function init() {
		if(ServerValues.localIp) {
			//kdRpcCenterClient.setupLocalHostReplacement(ServerValues.localIp)
		}
		center = new knRpcCenter.entity({
			serviceInfo:{
				name: Config.myConfig.name,
				serverHost: Config.myConfig.wsHost,
				serverPort: Config.myConfig.wsPort,
				startTime: kdutils.getMillionSecond(),
				startDate: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
			},
			authToken:ServerValues.rpcToken,
		})
		center.start()
		.then((b)=>{
			Log.oth.info("[rpc] start b = " + b)
		})
		Log.oth.info("[rpc] int rpc center port = " + Config.myConfig.wsPort)

		// center.addGroup("kds.center.status",RpcStatusGroup)
	}
}