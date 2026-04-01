import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { SrsDefine } from "./SrsDefine"


export namespace GSRpcMethods {
	export const prefix = "kds.gs-in"

	// configs:tNodeChangedItem[]
	export const nodeChanged = prefix + ".nodeChanged"
	export type tNodeChangedItem = {
		name:string,
		serviceInfo:knRpcDefine.ServiceInfo,
		other:SrsDefine.NodeOtherConfig
	}

	// roomData:RoomDefine.RoomData
	export const createRoom = prefix + ".createRoom"
	// only for match
	export type tCreateRoomExtensionParams = {
		lastForever?:boolean,		// 房间是否永久保留
		pauseBeforePlaying?:boolean,// 开始游戏前暂停
		matchID?:number,			// 比赛ID
		lockID?:string,				// 比赛锁定ID
	}

	// roomID:number,removeType:RoomDefine.RemoveType
	export const jiesanRoom = prefix + ".jiesanRoom"

	// roomID:number,userID:number
	export const tryUserExit = prefix + ".tryUserExit"

	// roomID:number,deviceID:string
	export const tryDeviceExit = prefix + ".tryUserExit"

	// roomID:number,userID:number
	export const forceUserExit = prefix + '.forceUserExit'

	// gameData:RoomDefine.GameData
	export const verifyGameData = prefix + ".verifyGameData"

	// roomID:number,deviceID:string,params:tDeviceEnterReq
	// return boolean
	export const deviceEnter = prefix + ".deviceEnter"
	export type tDeviceEnterReq = {
		chairNo:number,
	}

	// roomID:number,deviceID:string
	// return boolean
	export const deviceOnline = prefix + ".deviceOnline"
	
	// deviceID:string
	// return boolean
	export const deviceOffline = prefix + ".deviceOffline"

	
	// roomID:number,userID:number,params:tDeviceEnterReq
	// return boolean
	export const userEnter = prefix + ".userEnter"
	export type tUserEnterReq = {
		chairNo:number,

		system?:{
			groupID?:number,
			matchID?:number,
			matchScore?:string,
		}
	}

	// userID:number roomID:number
	// return boolean
	export const userOnline = prefix + ".userOnline"
	
	// userID:number
	// return boolean
	export const userOffline = prefix + ".userOffline"

	// userID:number,msgName:string,jsonObj:any
	export const userMessage = prefix + ".userMessage"

	// roomID:number,msgName:string,jsonObj:any
	export const roomMessage = prefix + ".roomMessage"
	// return {roomID:number,users:{userID:number,chairNo:number}[]}[]
	export const getRoomInfos = prefix + ".getRoomInfos"
	// roomID:number,msgName:string,params:any,
	export const matchControl = prefix + ".matchControl"

	// userID:number,msgName:string,jsonObj
	export const robotGetInfo = prefix + ".getInfo"
	
	// userID:number,msgName:string,jsonObj
	export const robotUserMessage = prefix + ".userMessage"

	// userID:number
	export const robotUserOnline = prefix + ".userOnline"

	// roomID:Number,userID:number,params:GSRpcMethods.tUserEnterReq
	export const robotUserEnter = prefix + ".userEnter"

	// roomID:number
	// return boolean 
	export const robotIsRoomExist = prefix + ".isRoomExist"
	// roomIDs:number[]
	// return {roomID:number,b:boolean}[]
	export const robotIsRoomsExist = prefix + ".isRoomsExist"
}