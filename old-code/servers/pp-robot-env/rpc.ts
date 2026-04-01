import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RpcRobotEnv } from "./rpc/robotEnv";
import { Log } from "./log";
import { ServerValues } from "../pp-base-define/ServerConfig";
import { kdutils } from "kdweb-core/lib/utils";
import { RobotRpcMethods } from "../pp-base-define/RobotRpcMethods";
import { RobotEnvRpcDelegate } from "./delegate/RobotEnvRpcDelegate";
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { RobotEnvWorker } from "./entity/RobotEnvWorker";
import { RobotEnvMaster } from "./entity/RobotEnvMaster";


export namespace Rpc {
	export let center:knRpcManager.base
	export let robot:knRpcManager.base
	export let robotDelegate = new RobotEnvRpcDelegate
	export let serviceInfo:knRpcDefine.ServiceInfo
	export let master:RobotEnvMaster
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		let centerKDSConfig = await knRpcTools.getKDSConfig(ServerValues.robotCenterName)
		if(!centerKDSConfig) {
			Log.oth.error("cannot get robot center name = " + ServerValues.robotCenterName)
			return false 
		}

		let kdsConfig = await knRpcTools.getKDSConfig(Config.myName)
		if(!kdsConfig) {
			Log.oth.error("cannot get config from rpc center name = " + Config.myName)
			return false 
		}
		Config.otherConfig = kdsConfig.other


		center = await knRpcTools.initRpc()
		initCenterMethods()

		serviceInfo = await knRpcTools.getConfig(process.env.sname)
		if(!serviceInfo) {
			return false 
		}

		robot = new knRpcManager.base({
			authToken: ServerValues.robotToken,
			serviceInfo:{
				name: serviceInfo.name,
				serverHost: Config.otherConfig.robotHost,
				serverPort: Config.otherConfig.robotPort,
				startTime: kdutils.getMillionSecond(),
				startDate: null,
			}
		})
		robot.delegate = robotDelegate
		await robot.start()
		initRobotMethods()
		Log.oth.info("start robot center",{
			name:centerKDSConfig.name,
			serverHost:centerKDSConfig.other.robotHost,
			serverPort:centerKDSConfig.other.robotPort,
			startTime: kdutils.getMillionSecond(),
			startDate: null,
		})
		robot.startClient({
			name:centerKDSConfig.name,
			serverHost:centerKDSConfig.other.robotHost,
			serverPort:centerKDSConfig.other.robotPort,
			startTime: kdutils.getMillionSecond(),
			startDate: null,
		},{
			keep:true
		})

		master = new RobotEnvMaster()
		if(callback) {
			callback()
		}
	}

	async function initCenterMethods() {
	}

	async function initRobotMethods() {
		robot.methodGroup.addGroup(RobotRpcMethods.envPrefix,RpcRobotEnv)
	}

	
	let subProcess:knProcess.handler
	export async function initSub(callback?:Function) {
		knRpcTools.setupEnv()
		subProcess = new RobotEnvWorker()
		await kdasync.timeout(3000)
		if(callback) {
			callback()
		}
	}
}