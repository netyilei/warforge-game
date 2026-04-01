import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { RobotLogicProcessControl_Worker } from "./entity/RobotLogicProcessControl_Worker";
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { RobotLogicProcessControl_Master } from "./entity/RobotLogicProcessControl_Master";
import { Log } from "./log";
import { ServerValues } from "../pp-base-define/ServerConfig";
import { kdutils } from "kdweb-core/lib/utils";
import { RobotInternalRpcDelegate, RobotGSRpcDelegate } from "./entity/RobotRpcDelegate";
import { RpcRobotGS } from "./rpc/robotGS";
import { RpcRobotInternal } from "./rpc/robotInternal";
import { RobotRpcMethods } from "../pp-base-define/RobotRpcMethods";


export namespace Rpc {
	export let robotInternal:knRpcManager.base
	export let internalDelegate = new RobotInternalRpcDelegate()
	export let robotGS:knRpcManager.base
	export let serviceInfo:knRpcDefine.ServiceInfo

	export let master:RobotLogicProcessControl_Master
	export let subProcess:knProcess.handler
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

		serviceInfo = await knRpcTools.getConfig(process.env.sname)
		if(!serviceInfo) {
			return false 
		}

		robotInternal = new knRpcManager.base({
			authToken: ServerValues.robotToken,
			serviceInfo:serviceInfo
		})
		robotInternal.delegate = internalDelegate
		await robotInternal.start()
		initInternalMethods()
		robotInternal.startClient({
			name:centerKDSConfig.name,
			serverHost:centerKDSConfig.other.robotHost,
			serverPort:centerKDSConfig.other.robotPort,
			startTime: kdutils.getMillionSecond(),
			startDate: null,
		},{
			keep:true
		})

		robotGS = new knRpcManager.base({
			authToken: ServerValues.robotToken,
			serviceInfo:{
				name: serviceInfo.name,
				serverHost: Config.otherConfig.gsHost,
				serverPort: Config.otherConfig.gsPort,
				startTime: kdutils.getMillionSecond(),
				startDate: null,
			}
		})
		robotGS.delegate = new RobotGSRpcDelegate
		await robotGS.start()
		initRobotMethods()


		master = new RobotLogicProcessControl_Master()
		if(callback) {
			callback()
		}
		return true 
	}

	export async function initSub(callback?:Function) {
		knRpcTools.setupEnv()
		subProcess = new RobotLogicProcessControl_Worker()
		await kdasync.timeout(3000)
		if(callback) {
			callback()
		}
	}

	async function initInternalMethods() {
		robotInternal.methodGroup.addGroup(RobotRpcMethods.logicPrefix + ".in",RpcRobotInternal)
	}
	async function initRobotMethods() {
		robotGS.methodGroup.addGroup(RobotRpcMethods.logicPrefix + ".gs",RpcRobotGS)
	}
}