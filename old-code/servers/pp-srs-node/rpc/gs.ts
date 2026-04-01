import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { Config } from "../config";
import { Rpc } from "../rpc";


async function login(h:string,name:string,gameID:number,main?:boolean) {
	Rpc.gsMgr.login(h,name,gameID,main)
	let nodes:SrsRpcMethods.Layer.tGetNodeConfigsRes[] = await Rpc.node.callException(SrsRpcMethods.Layer.getNodeConfigs) || []
	let res:SrsRpcMethods.GameServer.tLoginRes = {
		nodeName:Config.myName,
		layerName:Config.localConfig.layerName,
		nodes:[],
	}
	for(let node of nodes) {
		res.nodes.push({
			name:node.name,
			serviceInfo:node.serviceInfo,
			other:node.other,
		})
	}
	return res 
}

async function gsDeviceExit(h:string,deviceID:string,roomID:number) {
	let clientInfo = Rpc.node.getClientInfoByH(h)
	// Rpc.device.onGSDeviceExit(deviceID,clientInfo.name,roomID)
}

async function gsUserExit(h:string,userID:number,roomID:number) {
	Rpc.user.gsUserExitRoom(userID,roomID)
}

async function callCenter(h:string,method:string,...params) {
	return await Rpc.node.callException(SrsRpcMethods.Layer.callCenter,method,...params)	
}

async function callCenterServer(h:string,serverName:string,method:string,...params) {
	return await Rpc.node.callServerException(SrsRpcMethods.Layer.callCenterServer,serverName,method,...params)
}

async function sendToUser(h:string,userID:number,msgName:string,data:any) {
	Rpc.user.gsSendToUser(userID,msgName,data)
}

async function sendToUsers(h:string,userIDs:number[],msgName:string,data:any) {
	for(let userID of userIDs) {
		Rpc.user.gsSendToUser(userID,msgName,data)
	}
}

export let RpcSRSNodeGS = {
	login,
	gsDeviceExit,
	gsUserExit,
	callCenter,
	callCenterServer,
	sendToUser,
	sendToUsers,
}