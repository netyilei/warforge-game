import { KDSServerConfigType, ServerValues } from "../pp-base-define/ServerConfig"
import { kdreq } from "kdweb-core/lib/service/req"
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager"
import { knRpc } from "kdweb-core/lib/rpc-kn/knRpc"
import { knApis } from "kdweb-core/lib/rpc-kn/knApis"
import { kdasync } from "kdweb-core/lib/tools/async"
import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess"
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { DB } from "./db"


export namespace knRpcTools {
	export function setupEnv() {
		DB.initKDGlobal()
		knRpc.setConfig({
			projectTag:ServerValues.projectTag,

			engineLog:!!ServerValues.logEngine,
			othLog:!!ServerValues.logInstance,
			centerHost:ServerValues.rpcServiceHost,
			httpLogHost:ServerValues.rpcLoggerHost,
		})
	}
	
	export async function initRpc(params?:{
		name?:string,
		token?:string,
		ipcCount?:number,
		
		centerServiceName?:string,
		centerServiceHost?:string,
	}) {
		params = params || {}
		let name = params.name || process.env.sname || "mine-sys"
		if(!name) {
			console.error("[rpc-tools] rpc name is null")
			return null 
		}
		let ipcCount:number = params.ipcCount
		if(ipcCount == null) {
			let str = process.env.process_count
			if(str) {
				ipcCount = Number.parseInt(str)
				if(!ipcCount) {
					ipcCount = null 
				}
			}
		} else if(!ipcCount) {
			ipcCount = null 
		}
		let rpc = new knRpcManager.center({
			authToken: params.token || ServerValues.rpcToken,
			serviceName: name,
			ipc:ipcCount ? {
				count:ipcCount
			} : null,
			centerServiceName:params.centerServiceName || "s-rpc-center",
			centerServiceHost:params.centerServiceHost ||  ServerValues.rpcCenterHost,
		})
		let b = await rpc.start()
		if(!b) {
			console.error("start rpc failed ")
			return null 
		}
		return rpc 
	}

	export async function initSubProcess() {
		let rpc = new knProcess.handler()
		return rpc
	}

	export async function getConfig(name:string) {
		return await knApis.getServiceInfoFromCenter(name)
	}

	export async function getKDSConfig(name:string,tryCount?:number) {
		tryCount = tryCount || 3
		if(knRpc.config && knRpc.config.centerHost) {
			for(let i = 0 ; i < tryCount ; i ++) {
				let res = await kdreq.postJson(knRpc.config.centerHost + "/config/getkds",{
					tag:knRpc.config.projectTag,
					name:name,
				})
				if(res && res.body) {
					return <KDSServerConfigType>res.body.config
				}
				await kdasync.timeout(1500)
			}
		}
		return null 
	}

	export async function getConfigBlur(params:{
		prefix?:string,
		suffix?:string,
		pattern?:string
	},tryCount?:number) {
		tryCount = tryCount || 3
		if(knRpc.config && knRpc.config.centerHost) {
			for(let i = 0 ; i < tryCount ; i ++) {
				let res = await kdreq.postJson(knRpc.config.centerHost + "/config/getblur",params)
				if(res && res.body) {
					return <knRpcDefine.ServiceInfo[]>res.body.configs
				}
				await kdasync.timeout(1500)
			}
		}
		return []
	}
	
	export async function getKDSConfigBlur(params:{
		prefix?:string,
		suffix?:string,
		pattern?:string
	},tryCount?:number) {
		tryCount = tryCount || 3
		if(knRpc.config && knRpc.config.centerHost) {
			for(let i = 0 ; i < tryCount ; i ++) {
				let res = await kdreq.postJson(knRpc.config.centerHost + "/config/getkdsblur",params)
				if(res && res.body) {
					return <KDSServerConfigType[]>res.body.configs
				}
				await kdasync.timeout(1500)
			}
		}
		return []
	}
}