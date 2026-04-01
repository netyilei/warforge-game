import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { SrsDefine } from "./SrsDefine"
import { GSRpcMethods } from "./GSRpcMethods"

export namespace SrsRpcMethods {
	export namespace Layer {
		export const prefix = "kds.srs-node.layer"
		
		// name:string,type:SrsDefine.NodeType,otherConfig:any
		export const login = prefix + ".login"

		// type?:SrsDefine.NodeType
		// return names:string[]
		export const getNodes = prefix + ".getNodes"
		// type?:SrsDefine.NodeType
		// return tGetNodeConfigs[]
		export const getNodeConfigs = prefix + ".getNodeConfigs"
		export type tGetNodeConfigsRes = {
			name:string,
			other:SrsDefine.NodeOtherConfig
			serviceInfo:knRpcDefine.ServiceInfo,
		}

		// userID:number,b:boolean
		export const userOnline = prefix + ".userOnline"
		// infos:tUserOnlines,force?:boolean
		export const userOnlines = prefix + ".userOnlines"
		export type tUserOnlines = {
			userID:number,b:boolean
		}[]
		
		// deviceID:string,deviceH:string,b:boolean
		export const deviceOnline = prefix + ".deviceOnline"

		// name:string,gameID:number,b:boolean
		export const gsOnline = prefix + ".gsOnline"

		// infos:tGSOnlines,force?:boolean
		export const gsOnlines = prefix + ".gsOnlines"
		export type tGSOnlines = {
			name:string,gameID:number,b:boolean
		}[]

		// method:string,...params
		export const callCenter = prefix + ".callCenter"

		// serverName:string,method:string,...params
		export const callCenterServer = prefix + ".callCenterServer"

		// send methods called by node, if not exist then call srs dispatcher
		// userID:number,msgName:string,data
		export const sendToUser = prefix + ".sendToUser"

		// deviceID:string,msgName:string,data
		export const sendToDevice = prefix + ".sendToDevice"
	}

	export namespace LayerCenter {
		export const prefix = "kds.srs.layer"
		// nodeType?:SrSDefine.NodeType
		export const selectSrsHost = prefix + ".selectSrsHost"
		// gsName:string,method:string,...params
		export const callGS = prefix + ".callGS"

		// userID:number,msgName:string,data
		export const sendToUser = prefix + ".sendToUser"

		// deviceID:string,msgName:string,data
		export const sendToDevice = prefix + ".sendToDevice"

		// dkey:string,data:any
		export const dcnChanged = prefix + ".sendDCN"
		// userIDs:number[],dkey:string,data:any
		export const dcnFilterChanged = prefix + ".sendDCNFilter"

		export type tCallGSRes = {
			b:boolean
			data?:any,
		}
	}
	export namespace Node {
		export const prefix = "kds.srs-node.node"

		export const layerNodesChanged = prefix + ".layerNodesChanged"

		// gsName:string,method:string,...params
		export const callGS = prefix + ".callGS"

		// dkey:string,data:any
		export const dcnChanged = prefix + ".dcn"
		// userIDs:number[],dkey:string,data:any
		export const dcnFilterChanged = prefix + ".dcnFilter"

		export type tGSInfo = {
			gameID:number,gsName:string,status:number,
		}
		// return tGSInfo[]
		export const getAllGSInfos = prefix + ".getAllGSInfos"
		// 0 - open 1 - close
		export const setGSStatus = prefix + ".setGSStatus"
		// return userIDs:number[]
		export const getUsers = prefix + ".getUsers"
	}
	export namespace GameServer {
		export const prefix = "kds.srs-node.gs"
		
		// name:string,gameID:number,main?:boolean
		export const login = prefix + ".login"
		export type tLoginRes = {
			nodeName:string,
			layerName:string,

			nodes:GSRpcMethods.tNodeChangedItem[],
		}
		
		// deviceID:string,roomID:number
		export const gsDeviceExit = prefix + ".gsDeviceExit"

		// userID:number,roomID:number
		export const gsUserExit = prefix + ".gsUserExit"

		// userID:number,msgName:string,jsonObj
		export const sendToUser = prefix + ".sendToUser"

		// userIDs:number[],msgName:string,jsonObj
		export const sendToUsers = prefix + ".sendToUsers"

		// method:string,...params
		export const callCenter = prefix + ".callCenter"

		// serverName:string,method:string,...params
		export const callCenterServer = prefix + ".callCenterServer"
	}
	export namespace User {
		export const prefix = "kds.srs-node.user"

		// userID:number,msgName:string,data
		export const send = prefix + ".send"
	}

	export namespace Device {
		export const prefix = "kds.srs-node.device"

		// deviceID:string,msgName:string,data
		export const send = prefix + ".send"
	}
}