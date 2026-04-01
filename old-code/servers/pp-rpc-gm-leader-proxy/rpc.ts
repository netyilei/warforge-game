
import { knRpcCenter } from "kdweb-core/lib/rpc-kn/knRpcCenter"
import { kdutils } from "kdweb-core/lib/utils"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { Log } from "./log"
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager"
// import { CollectionTask } from "./entity/CollectionTask"
export namespace Rpc {
	export let center:knRpcManager.base
	// export let task = new CollectionTask()
	export async function init() {
		knRpcTools.setupEnv()

		center = await knRpcTools.initRpc()
		if(!center) {
			return false 
		}
		// center.addGroup("kds.center.status",RpcStatusGroup)
		return true 
	}
}