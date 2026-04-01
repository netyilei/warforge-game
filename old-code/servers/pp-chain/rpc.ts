import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RpcChain } from "./rpc/chain";
import { Log } from "./log";
import { RpcPaypal } from "./rpc/paypal";
// import { ChainReqLooper } from "./loopers/ChainReq";

export namespace Rpc {
	export let center:knRpcManagerInterface.rpc
	// export let chainReqLooper = new ChainReqLooper
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		
		let kdsConfig = await knRpcTools.getKDSConfig(Config.myName)
		if(!kdsConfig) {
			Log.oth.error("cannot get config from rpc center name = " + Config.myName)
			return false 
		}
		Config.kdsConfig = kdsConfig
		Config.otherConfig = kdsConfig.other
		
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
		center.methodGroup.addGroup("kds.chain",RpcChain)
		center.methodGroup.addGroup("kds.paypal",RpcPaypal)
	}
}