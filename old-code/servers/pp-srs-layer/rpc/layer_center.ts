import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { Rpc } from "../rpc";
import { LayerService } from "../service/LayerService";
import { Log } from "../log";

async function selectSrsHost(h:string,nodeType?:SrsDefine.NodeType) {
	let res = await LayerService.selectSrsNode({
		type:nodeType
	})
	if(res && res.host) {
		return res.host
	}
	return null 
}

async function callGS(h:string,gsName:string,method:string,...params) {
	let ret:SrsRpcMethods.LayerCenter.tCallGSRes = {
		b:false,
		data:null,
	}
	let gsInfo = Rpc.layerMgr.gss.find(v=>v.name == gsName)
	if(!gsInfo) {
		return ret 
	}
	try {
		let rpcRet = await Rpc.layer.callServer(gsInfo.nodeName,SrsRpcMethods.Node.callGS,gsName,method,...params)
		if(rpcRet.type == knRpcDefine.ClientCallReturnType.Success) {
			ret.b = true 
			ret.data = rpcRet.data
		} else {
			Log.oth.error("call gs failed: rpc error gsName = " + gsName + " method = " + method + " params = ",params,rpcRet)
		}
	} catch (error) {
		Log.oth.error("call gs failed gsName = " + gsName + " method = " + method + " params = ",params,error)
	}
	return ret 
}


async function sendToUser(h:string,userID:number,msgName:string,data:any) {
	let nodeName = Rpc.layerMgr.getUserNodeName(userID)
	if(!nodeName) {
		return false 
	}
	Rpc.layer.callServer(nodeName,SrsRpcMethods.User.send,userID,msgName,data)
	return true 
}

async function sendToDevice(h:string,deviceID:string,msgName:string,data:any) {
	let nodeName = Rpc.layerMgr.getDeviceNodeName(deviceID)
	if(!nodeName) {
		return false 
	}
	Rpc.layer.callServer(nodeName,SrsRpcMethods.Device.send,deviceID,msgName,data)
	return true 
}

async function sendDCN(h:string,dkey:string,data:any) {
	for(let node of Rpc.layerMgr.nodes) {
		Rpc.layer.callServer(node.name,SrsRpcMethods.Node.dcnChanged,dkey,data)
	}
}
async function sendDCNFilter(h:string,userIDs:number[],dkey:string,data:any) {
	for(let node of Rpc.layerMgr.nodes) {
		Rpc.layer.callServer(node.name,SrsRpcMethods.Node.dcnFilterChanged,userIDs,dkey,data)
	}
}

export let RpcLayerCenter = {
	selectSrsHost,
	callGS,

	sendToUser,
	sendToDevice,

	sendDCN,
	sendDCNFilter,
}