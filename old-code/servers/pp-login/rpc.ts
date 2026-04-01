
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface"
import { knRpcTools } from "../src/knRpcTools"
import { LoginRpcEntity } from "./rpc/loginRpcEntity"
export namespace Rpc {
	export let center:knRpcManagerInterface.rpc
	export let delegate:LoginRpcEntity
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initRpc()
		Rpc.delegate = new LoginRpcEntity()
		center.delegate = Rpc.delegate
		initMethods()
		if(callback) {
			callback()
		}
	}

	export async function initSub(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initSubProcess()
		initMethods()
		if(callback) {
			callback()
		}
	}

	async function initMethods() {
		// center.methodGroup.addGroup("kds.test2",RpcTest)
	}
}