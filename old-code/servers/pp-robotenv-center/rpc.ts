import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RobotEnvRpcCenterDelegate } from "./delegate/RobotEnvRpcCenterDelegate";
import { RpcRobotInternal } from "./rpc/robotInternal";
import { Log } from "./log";
import { ServerValues } from "../pp-base-define/ServerConfig";
import { kdutils } from "kdweb-core/lib/utils";
import { RobotRpcMethods } from "../pp-base-define/RobotRpcMethods";
import { RpcEnvCenterRpc } from "./rpc/envCenterRpc";


export namespace Rpc {
	export let center:knRpcManager.base
	export let robot:knRpcManager.base
	export let delegate = new RobotEnvRpcCenterDelegate
	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		
		let kdsConfig = await knRpcTools.getKDSConfig(Config.myName)
		if(!kdsConfig) {
			Log.oth.error("cannot get config from rpc center name = " + Config.myName)
			return false 
		}
		Config.otherConfig = kdsConfig.other

		center = await knRpcTools.initRpc()
		initMethods()

		let serviceInfo = await knRpcTools.getConfig(process.env.sname)
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
		robot.delegate = delegate
		await robot.start()

		initRobotMethods()
		if(callback) {
			callback()
		}
	}

	async function initMethods() {
		center.methodGroup.addGroup("kds.robotenv",RpcEnvCenterRpc)
	}
	async function initRobotMethods() {
		robot.methodGroup.addGroup(RobotRpcMethods.centerPrefix,RpcRobotInternal)
	}
}