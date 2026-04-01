import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { Rpc } from "../rpc";

async function login(h:string,name:string,type:SrsDefine.NodeType,otherConfig:any) {
	await Rpc.layerMgr.nodeLogin(h,name,type,otherConfig)
}

async function getNodes(h:string,type?:SrsDefine.NodeType) {
	if(type == null) {
		return Rpc.layerMgr.nodes.map(v=>v.name)
	}
	return Rpc.layerMgr.nodes.filter(v=>v.type == type).map(v=>v.name)
}

async function getNodeConfigs(h:string,type?:SrsDefine.NodeType) {
	if(type == null) {
		return Rpc.layerMgr.nodes.map((v)=>{
			return <SrsRpcMethods.Layer.tGetNodeConfigsRes>{
				name:v.name,
				serviceInfo:v.serviceInfo,
				other:v.other,
			}
		})
	}
	return Rpc.layerMgr.nodes.filter(v=>v.type == type).map((v)=>{
		return <SrsRpcMethods.Layer.tGetNodeConfigsRes>{
			name:v.name,
			serviceInfo:v.serviceInfo,
			other:v.other,
		}
	})
}

async function userOnline(h:string,userID:number,b:boolean) {
	Rpc.layerMgr.userOnline(h,userID,b)
}

async function deviceOnline(h:string,deviceID:string,deviceH:string,b:boolean) {
	Rpc.layerMgr.deviceOnline(h,deviceID,deviceH,b)
}

async function gsOnline(h:string,name:string,gameID:number,b:boolean) {
	Rpc.layerMgr.gsOnline(h,name,gameID,b)
}

async function gsOnlines(h:string,infos:SrsRpcMethods.Layer.tGSOnlines,force?:boolean) {
	Rpc.layerMgr.gsOnlines(h,infos,force)
}

async function callCenter(h:string,method:string,...params) {
	return await Rpc.center.callException(method,...params)	
}

async function callCenterServer(h:string,serverName:string,method:string,...params) {
	return await Rpc.center.callServerException(serverName,method,...params)
}

async function sendToUser(h:string,userID:number,msgName:string,data:any) {
	let nodeName = Rpc.layerMgr.getUserNodeName(userID)
	if(!nodeName) {
		return await Rpc.center.callException("kds.srs.disp.sendToUser",userID,msgName,data)
	}
	Rpc.layer.callServer(nodeName,SrsRpcMethods.User.send,userID,msgName,data)
	return true 
}

async function sendToDevice(h:string,deviceID:string,msgName:string,data:any) {
	let nodeName = Rpc.layerMgr.getDeviceNodeName(deviceID)
	if(!nodeName) {
		return await Rpc.center.callException("kds.srs.disp.sendToDevice",deviceID,msgName,data)
	}
	Rpc.layer.callServer(nodeName,SrsRpcMethods.Device.send,deviceID,msgName,data)
	return true 
}

export let RpcSrsLayer = {
	login,
	getNodes,
	getNodeConfigs,
	userOnline,
	deviceOnline,
	gsOnline,
	gsOnlines,
	callCenter,
	callCenterServer,
	sendToUser,
	sendToDevice
}
