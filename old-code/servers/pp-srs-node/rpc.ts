import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { Log } from "./log";
import { ServerValues } from "../pp-base-define/ServerConfig";
import { SrsDefine } from "../pp-base-define/SrsDefine";
import { SrsNodeRpcDelegate } from "./entity/RpcDelegate";
import { GSManager } from "./entity/GSManager";
import { SrsRpcMethods } from "../pp-base-define/SrsRpcMethods";
import { RpcSrsNodeCommon } from "./rpc/node";
import { RpcSRSNodeGS } from "./rpc/gs";
import { RpcSRSNodeDevice } from "./rpc/device";
import { RpcSRSNodeUser } from "./rpc/user";
import { WSUserServer } from "./entity/WSUserServer";
import { kdutils } from "kdweb-core/lib/utils";
import { SrsMessageLink } from "../src/SrsMessageLink";


export namespace Rpc {
	export let node:knRpcManager.base

	// export let device:WSDeviceServer
	export let user:WSUserServer
	export let gsMgr:GSManager
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		let kdsConfig = await knRpcTools.getKDSConfig(Config.myName)
		if(!kdsConfig) {
			Log.oth.error("cannot get config from rpc center name = " + Config.myName)
			return false 
		}
		Config.otherConfig = kdsConfig.other
		
		let ipcCount:number
		let str = process.env.process_count
		if(str) {
			ipcCount = Number.parseInt(str)
			if(!ipcCount) {
				ipcCount = null 
			}
		}

		let layerConfig = await knRpcTools.getKDSConfig(Config.localConfig.layerName)
		if(!layerConfig) {
			Log.oth.error("cannot get layer config name = " + Config.localConfig.layerName)
			return false 
		}
		Log.oth.info("layer config name = " + Config.localConfig.layerName,layerConfig)
		let rpc = new knRpcManager.base({
			authToken: ServerValues.srsToken,
			serviceName: Config.myName,
			ipc:ipcCount ? {
				count:ipcCount
			} : null,
		})
		let b = await rpc.start()
		if(!b) {
			Log.oth.error("start rpc failed ")
			return false 
		}
		rpc.delegate = new SrsNodeRpcDelegate
		
		node = rpc 
		initMethods()
		// switch(Config.localConfig.type) {
		// 	case SrsDefine.NodeType.Device: {
		// 		// device = new WSDeviceServer()
		// 	} break 
		// 	case SrsDefine.NodeType.User: {
		// 		user = new WSUserServer()
		// 	} break 
		// 	case SrsDefine.NodeType.GameServer: {
		// 		gsMgr = new GSManager()
		// 		// device = new WSDeviceServer()
		// 		user = new WSUserServer()
		// 	} break 
		// }
		gsMgr = new GSManager()
		user = new WSUserServer()

		let other:SrsDefine.LayerOtherConfig = layerConfig.other
		rpc.startClient({
			name:layerConfig.name,
			serverHost:other.nodeWSHost,
			serverPort:other.nodeWSPort,
			startTime:kdutils.getMillionSecond(),
			startDate:null,
		},{keep:true,center:false})

		SrsMessageLink.initLink()
		if(callback) {
			callback()
		}
		return true 
	}

	async function initMethods() {
		// switch(Config.localConfig.type) {
		// 	case SrsDefine.NodeType.Device: {
		// 		node.methodGroup.addGroup(SrsRpcMethods.Node.prefix,RpcSrsNodeCommon)
		// 		node.methodGroup.addGroup(SrsRpcMethods.Device.prefix,RpcSRSNodeDevice)
		// 	} break 
		// 	case SrsDefine.NodeType.User: {
		// 		node.methodGroup.addGroup(SrsRpcMethods.Node.prefix,RpcSrsNodeCommon)
		// 		node.methodGroup.addGroup(SrsRpcMethods.User.prefix,RpcSRSNodeUser)
		// 	} break 
		// 	case SrsDefine.NodeType.GameServer: {
		// 		node.methodGroup.addGroup(SrsRpcMethods.Node.prefix,RpcSrsNodeCommon)
		// 		node.methodGroup.addGroup(SrsRpcMethods.GameServer.prefix,RpcSRSNodeGS)
		// 		node.methodGroup.addGroup(SrsRpcMethods.Device.prefix,RpcSRSNodeDevice)
		// 		node.methodGroup.addGroup(SrsRpcMethods.User.prefix,RpcSRSNodeUser)
		// 	} break 
		// }
		node.methodGroup.addGroup(SrsRpcMethods.Node.prefix,RpcSrsNodeCommon)
		node.methodGroup.addGroup(SrsRpcMethods.GameServer.prefix,RpcSRSNodeGS)
		node.methodGroup.addGroup(SrsRpcMethods.User.prefix,RpcSRSNodeUser)
	}
}