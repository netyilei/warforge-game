import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods"
import { RobotDefine } from "../../pp-base-define/RobotDefine"
import { RoomDefine } from "../../pp-base-define/RoomDefine"


export namespace RobotIpcMessage {

	export let ToWorker_UserEnter = "ToWorker_UserEnter"
	export type tToWorker_UserEnterReq = {
		robotUserID:number,
		roomID:number,
		strategy?:RobotDefine.RuntimeStrategy,
		strategyData?:RobotDefine.tStrategyData_Base,
		personality?:RobotDefine.tPersonalityGameConfig_Base,
		taskID?:number
		groupPlanID?:number,
		matchPlanID?:number,

		opt?:GSRpcMethods.tUserEnterReq,
		buyinValue?:string,
	}

	export type tToWorker_UserEnterRes = {
		robotUserID:number,
		roomID:number,
		b:boolean,
	}

	export let ToWorker_FromGameServer = "ToWorker_FromGameServer"
	export type tToWorker_FromGameServer = {
		robotUserID:number,
		gameID:number,
		gsName:string,
		msgName:string,
		jsonObj:any,
	}

	export let ToWorker_ExitFromGameServer = "ToWorker_ExitFromGameServer"
	export type tToWorker_ExitFromGameServer = {
		robotUserID:number,
		gsName:string,
		roomID:number,
	}

	export let ToWorker_GameServerReady = "ToWorker_GameServerReady"
	export type tToWorker_GameServerReady = {
		gameID:number,
		gsName:string,
		b:boolean,
	}

	export let ToWorker_StopRobotLogicByMatchID = "ToWorker_StopRobotLogicByMatchID"
	export type tToWorker_StopRobotLogicByMatchID = {
		matchID:number,
	}
	//------------------------------------------------------------

	export let ToMaster_WorkerReady = "ToMaster_WorkerReady"

	export let ToMaster_LoadedLimited = "ToMaster_LoadedLimited"
	export type tToMaster_LoadedLimited = {
		limited:boolean,
	}

	export let ToMaster_SendToGameServer = "ToMaster_SendToGameServer"
	export type tToMaster_SendToGameServerReq = {
		sendID:string,
		robotUserID:number,
		gsName:string,
		msgName:string,
		jsonObj:any,
	}
	export type tToMaster_SendToGameServerRes = {
		sendID:string,
		status:0|1|2,	// 0 成功 1 未连接 2 请重试
	}

	export let ToMaster_ConnectToGameServer = "ToMaster_ConnectToGameServer"
	export type tToMaster_ConnectToGameServerReq = {
		gsName:string,
		robotUserID?:number,
		needEnter?:boolean,
	}
	// needEnter == true时有res回应
	export type tToMaster_ConnectToGameServerRes = {
		robotUserID:number,
		enterSuccess:boolean,
	}
	export let ToMaster_CloseToGameServer = "ToMaster_CloseToGameServer"
	export type tToMaster_CloseToGameServer = {
		gsName:string,
	}

	export let ToMaster_RegToGameServer = "ToMaster_RegToGameServer"
	export type tToMaster_RegToGameServer = {
		robotUserID:number,
		gsName?:string,
	}

	export let ToMaster_RobotReady = "ToMaster_RobotReady"
	export type tToMaster_RobotReady = {
		robotUserID:number,
		roomID:number,
		strategy:RobotDefine.RuntimeStrategy,
		strategyData:RobotDefine.tStrategyData_Base,
		personality:RobotDefine.tPersonalityGameConfig_Base,
		taskID:number,
		matchID:number,
	}
	export let ToMaster_RobotRelease = "ToMaster_RobotRelease"
	export type tToMaster_RobotRelease = {
		robotUserID:number,
	}

	export let ToMaster_CheckGSRooms = "ToMaster_CheckGSRooms"
	export type tToMaster_CheckGSRoomsReq = {
		gsName:string,
		roomIDs:number[],
	}
	export type tToMaster_CheckGSRoomsRes = {
		gsName:string,
		rooms:{
			roomID:number,b:boolean,
		}[],
	}
}