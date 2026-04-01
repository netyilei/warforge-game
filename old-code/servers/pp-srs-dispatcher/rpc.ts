import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RpcSRSDispatcher } from "./rpc/dispatcher";


export namespace Rpc {
	export let center:knRpcManagerInterface.rpc
	
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initRpc()
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
		if(Config.localConfig?.internal) {
			center.methodGroup.addGroup("kds.srs.disp.internal",RpcSRSDispatcher)
		} else {
			center.methodGroup.addGroup("kds.srs.disp",RpcSRSDispatcher)
		}
	}
}