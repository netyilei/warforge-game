import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods"
import { MatchDefine } from "../../pp-base-define/MatchDefine"
import { RoomDefine } from "../../pp-base-define/RoomDefine"


export namespace MatchIpcMessage {

	export let ToWorker_RoomRealtimeChanged = "ToWorker_RoomRealtimeChanged"
	export type tToWorker_RoomRealtimeChanged = {
		matchID:number,
		roomID:number,
		removed:boolean,
	}

	export let ToWorker_RoomJuEnd = "ToWorker_RoomJuEnd"
	export type tToWorker_RoomJuEnd = {
		roomID:number,
		bill:RoomDefine.BillData,
	}
	//------------------------------------------------------------

	export let ToMaster_WorkerReady = "ToMaster_WorkerReady"
	export type tToMaster_WorkerReady = {
		success:boolean,
	}

	export let ToMaster_StatusChanged = "ToMaster_StatusChanged"
	export type tToMaster_StatusChanged = {
		status:MatchDefine.MatchStatus,
	}

	export let ToMaster_WorkerFullyEnded = "ToMaster_WorkerFullyEnded"
	export type tToMaster_WorkerFullyEnded = {

	}

}