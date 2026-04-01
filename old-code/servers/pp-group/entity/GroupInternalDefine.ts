import { GroupDefine } from "../../pp-base-define/GroupDefine"
import { RoomDefine } from "../../pp-base-define/RoomDefine"


export namespace GroupInternalDefine {
	export namespace toWorker {
		export let Enter = "GroupInternalDefine_ToWorker_Enter"
		export type tEnter = {
			userID:number,
			groupID:number,
			ignoreRoomIDs?:number[],
		}

		export let RoomChanged = "GroupInternalDefine_ToWorker_RoomChanged" 
		export type tRoomChanged = {
			roomID:number,
			realtime?:RoomDefine.RoomRealtime, // 如果为空表示房间已消失
		}

		export let Restart = "GroupInternalDefine_ToWorker_Restart"
		export type tRestart = {
			groupData:GroupDefine.tData
		}
	}
	export namespace toMaster {
		export let InitFailed = "GroupInternalDefine_ToMaster_InitFailed"
		export let EnterFailed = "GroupInternalDefine_ToMaster_EnterFailed"
		export type tEnterFailed = {
			userID:number,
			groupID:number
		}

		export let EnterSuccess = "GroupInternalDefine_ToMaster_EnterSuccess"
		export type tEnterSuccess = {
			userID:number,
			groupID:number,
			roomID:number,
			gameData:RoomDefine.GameData,
		}

		export let SendToUser = "GroupInternalDefine_ToMaster_SendToUser"
		export type tSendToUser = {
			userID:number,
			msgName:string,
			data:any,
		}
	}
}