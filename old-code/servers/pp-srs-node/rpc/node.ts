import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { Rpc } from "../rpc";


async function layerNodesChanged(h:string) {
	if(Rpc.gsMgr) {
		// let nodes:SrsRpcMethods.Layer.tGetNodeConfigsRes[] = await Rpc.node.callException(SrsRpcMethods.Layer.getNodeConfigs,SrsDefine.NodeType.GameServer) || []
		let nodes:SrsRpcMethods.Layer.tGetNodeConfigsRes[] = await Rpc.node.callException(SrsRpcMethods.Layer.getNodeConfigs) || []
		let items:GSRpcMethods.tNodeChangedItem[] = []
		for(let node of nodes) {
			items.push({
				name:node.name,
				serviceInfo:node.serviceInfo,
				other:node.other,
			})
		}
		// Rpc.gsMgr.callAllMainGameServers(GSRpcMethods.nodeChanged,nodes)
		Rpc.gsMgr.callAllGameServers(GSRpcMethods.nodeChanged,nodes)
	}
}

async function callGS(h:string,gsName:string,method:string,...params) {
	return await Rpc.gsMgr.callGameServer(gsName,method,...params)
}

async function dcn(h:string,dkey:string,data:any) {
	if(Rpc.user) {
		Rpc.user.onDCNChanged(dkey,data)
		return true 
	}
	return false 
}
async function dcnFilter(h:string,userIDs:number[],dkey:string,data:any) {
	if(Rpc.user) {
		Rpc.user.onDCNFilterChanged(userIDs,dkey,data)
		return true 
	}
	return false 
}

async function getAllGSInfos(h:string) {
	return Rpc.gsMgr.gsNodes.map(v=>{
		return {
			gameID:v.gameID,
			gsName:v.name,
			status:v.status,
		}
	})
}

async function setGSStatus(h:string,gsName:string,status:number) {
	if(Rpc.gsMgr) {
		return await Rpc.gsMgr.setGSStatus(gsName,status)
	}
	return 0
}

async function getUsers(h:string) {
	if(Rpc.user) {
		return Rpc.user.getUserIDs()
	}
	return []
}

export let RpcSrsNodeCommon = {
	layerNodesChanged,
	callGS,
	getAllGSInfos,
	setGSStatus,
	
	getUsers,

	dcn,
	dcnFilter,
}