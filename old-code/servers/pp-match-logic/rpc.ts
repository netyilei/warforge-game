import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { Log } from "./log";
import { ServerValues } from "../pp-base-define/ServerConfig";
import { kdutils } from "kdweb-core/lib/utils";
import { RobotRpcMethods } from "../pp-base-define/RobotRpcMethods";
import { Match_Master } from "./entity/Match_Master";
import { Match_SubExecuter } from "./entity/Match_SubExecuter";
import { RpcMatchHook } from "./rpc/match_hook";
import { RpcMatchOper } from "./rpc/match_oper";


export namespace Rpc {
	export let center:knRpcManager.base
	export let serviceInfo:knRpcDefine.ServiceInfo

	export let master:Match_Master
	export let subProcess:knProcess.handler
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initRpc()
		initMethods()
		
		serviceInfo = await knRpcTools.getConfig(process.env.sname)
		if(!serviceInfo) {
			return false 
		}

		master = new Match_Master()
		center.ipcMaster = Rpc.master.knMaster
		if(callback) {
			callback()
		}
		return true 
	}

	export async function initSub(callback?:Function) {
		knRpcTools.setupEnv()
		subProcess = new Match_SubExecuter()
		await kdasync.timeout(3000)
		if(callback) {
			callback()
		}
	}

	async function initMethods() {
		center.methodGroup.addGroup("kds.match.oper",RpcMatchOper)
		center.methodGroup.addGroup("kds.match.hook",RpcMatchHook)
	}
}