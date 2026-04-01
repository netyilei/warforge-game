import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { Log } from "./log";
import { KDSServerConfigType, ServerValues } from "../pp-base-define/ServerConfig";
import { LayerManager } from "./entity/LayerManager";
import { SrsDefine } from "../pp-base-define/SrsDefine";
import { SrsLayerRpcDelegate } from "./entity/RpcDelegate";
import { SrsRpcMethods } from "../pp-base-define/SrsRpcMethods";
import { RpcSrsLayer } from "./rpc/layer";
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { DB } from "../src/db";
import { RpcLayerCenter } from "./rpc/layer_center";
import { kdutils } from "kdweb-core/lib/utils";


export namespace Rpc {
	export let center:knRpcManager.base
	export let layer:knRpcManager.base

	export let layerMgr:LayerManager
	export let layerDelegate:knRpcManagerInterface.baseDelegate

	export let upperLayerConfig:KDSServerConfigType
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initRpc()

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
		let layerConfig:KDSServerConfigType
		if(Config.localConfig.layerName) {
			layerConfig = await knRpcTools.getKDSConfig(Config.localConfig.layerName)
			if(!layerConfig) {
				Log.oth.error("cannot get layer config name = " + Config.localConfig.layerName)
				return false 
			}
		}
		upperLayerConfig = layerConfig
		Log.oth.info("layer config name = " + Config.localConfig.layerName,layerConfig)
		layerMgr = new LayerManager
		await layerMgr.init()
		let rpc = new knRpcManager.base({
			authToken: ServerValues.srsToken,
			serviceName: Config.myName,
			serviceInfo:{ 
				name: Config.myName,
				serverHost: Config.otherConfig.nodeWSHost,
				serverPort: Config.otherConfig.nodeWSPort,
				startTime: kdutils.getMillionSecond(),
				startDate: null
			}
		})
		let b = await rpc.start()
		if(!b) {
			Log.oth.error("start rpc failed ")
			return false 
		}
		Log.oth.info("node rpc started ",{ 
			name: Config.myName,
			serverHost: Config.otherConfig.nodeWSHost,
			serverPort: Config.otherConfig.nodeWSPort,
			startTime: kdutils.getMillionSecond(),
			startDate: null
		})
		rpc.delegate = new SrsLayerRpcDelegate
		if(layerConfig) {
			let otherConfig:SrsDefine.LayerOtherConfig
			rpc.startClient({
				name: layerConfig.name,
				serverHost:otherConfig.nodeWSHost,
				serverPort:otherConfig.nodeWSPort,
				startTime:kdutils.getMillionSecond(),
				startDate:null,
			},{keep:true,center:false})
		}
		layer = rpc 
		
		let redis = DB.getRedis()
		redis.hset(SrsDefine.Redis.tableLayer,Config.myName,Config.otherConfig,true)
		
		initMethods()
		
		if(callback) {
			callback()
		}
		return true 
	}

	async function initMethods() {
		layer.methodGroup.addGroup(SrsRpcMethods.Layer.prefix,RpcSrsLayer)
		
		center.methodGroup.addGroup(SrsRpcMethods.LayerCenter.prefix,RpcLayerCenter)
	}
}