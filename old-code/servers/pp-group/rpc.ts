import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { Group_Worker } from "./entity/Group_Worker";
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { Group_Master } from "./entity/Group_Master";
import { RpcGroupHook } from "./rpc/group_hook";
import { RpcGroupUserMessage } from "./rpc/group_user_message";
import { RpcGroup } from "./rpc/group";


export namespace Rpc {
	export let center:knRpcManager.base
	export let serviceInfo:knRpcDefine.ServiceInfo

	export let subProcess:knProcess.handler
	export let master:Group_Master
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		serviceInfo = await knRpcTools.getConfig(process.env.sname)
		if(!serviceInfo) {
			return false 
		}
		center = await knRpcTools.initRpc()
		initMethods()
		if(callback) {
			callback()
		}
		Rpc.master = new Group_Master
		center.ipcMaster = Rpc.master.knMaster
		return true 
	}

	export async function initSub(callback?:Function) {
		knRpcTools.setupEnv()
		subProcess = new Group_Worker()
		await kdasync.timeout(3000)
		if(callback) {
			callback()
		}
	}
	async function initMethods() {
		center.methodGroup.addGroup("kds.group",RpcGroup)
		center.methodGroup.addGroup("kds.group.hook",RpcGroupHook)
		center.methodGroup.addGroup("kds.group.nodelink",RpcGroupUserMessage)
	}
}