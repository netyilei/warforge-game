import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RpcIdsGroup } from "./rpc/ids";
import { RpcMutex } from "./rpc/mutex";
import { RcpUserBindRedis } from "./rpc/user";
import { RpcKV, RpcChangedKV, RpcKV1, RpcMongoKV, RpcStepKV } from "./rpc/kv";
import { RpcMail } from "./rpc/mail";
import { RpcEmail } from "./rpc/email";
import { RpcCode, RpcRoomCode } from "./rpc/code";


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
		if(Config.localConfig && Config.localConfig.mutexOnly) {
			center.methodGroup.addGroup("kds.sys.mutex-" + Config.localConfig.mutexID,RpcMutex)
		} else {
			center.methodGroup.addGroup("kds.sys.id",RpcIdsGroup)
			center.methodGroup.addGroup("kds.sys.mutex",RpcMutex)
			center.methodGroup.addGroup("kds.mutex",RpcMutex)
			center.methodGroup.addGroup("kds.sys.user.bind",RcpUserBindRedis)
			
			center.methodGroup.addGroup("kds.dbp.kv",RpcKV)
			center.methodGroup.addGroup("kds.dbp.kv.c",RpcChangedKV)
			center.methodGroup.addGroup("kds.dbp.kv.r0",RpcKV)
			center.methodGroup.addGroup("kds.dbp.kv.r1",RpcKV1)
			center.methodGroup.addGroup("kds.dbp.kv.m",RpcMongoKV)
			center.methodGroup.addGroup("kds.dbp.kv.s",RpcStepKV)
		}

		
		center.methodGroup.addGroup("kds.mail",RpcMail)
		center.methodGroup.addGroup("kds.sys.email",RpcEmail)

		center.methodGroup.addGroup("kds.sys.code",RpcCode)
		center.methodGroup.addGroup("kds.sys.code.room",RpcRoomCode)

	}
}