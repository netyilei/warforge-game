
import { knRpcCenter } from "kdweb-core/lib/rpc-kn/knRpcCenter"
import { kdutils } from "kdweb-core/lib/utils"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { Log } from "./log"
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager"
export namespace Rpc {
	export let center:knRpcManager.base
	export async function init() {
		knRpcTools.setupEnv()

		center = await knRpcTools.initRpc()
		if(!center) {
			return false 
		}
		return true 
	}
}