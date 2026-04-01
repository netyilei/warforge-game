import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { tRobotEnvLogicInfo } from "../delegate/RobotEnvRpcDelegate"


export namespace RobotEnvIpcMessage {
	export let ToMaster_CallRpcCenter = "ToMaster_CallRpcCenter"
	export type tToMaster_CallRpcCenterReq = {
		callID:string,
		robotInternal:boolean,
		serverName?:string,
		method:string,
		args:any[]
	}
	export type tToMaster_CallRpcCenterRes = {
		callID:string,
		type:knRpcDefine.ClientCallReturnType,
		data:any,
	}

	export let ToMaster_RefreshLogicClient = "ToMaster_RefreshLogicClient"

	export let ToMaster_ChildEnd = "ToMaster_ChildEnd"
	
	export let ToWorker_LogicClientChanged = "ToWorker_LogicClientChanged"
	export type tToWorker_LogicClientChanged = {
		clients:tRobotEnvLogicInfo[]
	}

	export let ToWorker_PlanChanged = "ToWorker_PlanChanged"
	export type tToWorker_PlanChanged = {
		planID:number
	}
}