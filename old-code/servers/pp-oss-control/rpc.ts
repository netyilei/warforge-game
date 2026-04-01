
import { kdRpcCenterClient } from "kdweb-core/lib/rpc/center/centerClient"
import { Config } from "./config"
import { RpcIcon } from "./rpc/icon"
import { RpcOSS } from "./rpc/oss"
import { RpcOSSSeq } from "./rpc/oss_seq"
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager"
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface"
import { knRpcTools } from "../src/knRpcTools"
export namespace Rpc {
	export let center:knRpcManagerInterface.rpc
	
	export async function init() {
		knRpcTools.setupEnv()

		center = await knRpcTools.initRpc()
		center.methodGroup.addGroup("kds.oss",RpcOSS)
		center.methodGroup.addGroup("kds.oss.icon",RpcIcon)
		
		center.methodGroup.addGroup("kds.oss.seq",RpcOSSSeq)
	}
}