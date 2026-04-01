import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RpcAccountItem } from "./rpc/account";
import { RpcItemConfig } from "./rpc/itemConfig";


export namespace Rpc {
	export let center:knRpcManagerInterface.rpc
	
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initRpc()
		initMethods()
		if(callback) {
			callback()
		}

		RpcItemConfig.refresh()
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
		center.methodGroup.addGroup("kds.item",RpcAccountItem)
		center.methodGroup.addGroup("kds.item.config",RpcItemConfig)
	}
}