import { baseService, lambdaAsyncService } from "kdweb-core/lib/service/base";
import wcore = require("kdweb-core")
import { serviceEntity } from "kdweb-core/lib/service/entity"
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { Config } from "../config";
import { Rpc } from "../rpc";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { kdutils } from "kdweb-core/lib/utils";
import { Log } from "../log";

export namespace LayerService {
	let app:serviceEntity
	export function init() {
		let other:SrsDefine.LayerOtherConfig = Config.otherConfig
		if(!other.httpPort) {
			return 
		}
		app = new serviceEntity(other.httpPort)
		app.setAllowOrigin()
		app.addInstance(SrsDefine.Http.Layer.pathSendToUser,new lambdaAsyncService(sendToUser))
		app.addInstance(SrsDefine.Http.Layer.pathSendToDevice,new lambdaAsyncService(sendToDevice))
		app.addInstance(SrsDefine.Http.Layer.pathSelectSrsNode,new lambdaAsyncService(selectSrsNode))
		app.addInstance(SrsDefine.Http.Layer.pathDCNChange,new lambdaAsyncService(dcnChanged))
		app.addInstance(SrsDefine.Http.Layer.pathCallGS,new lambdaAsyncService(callGS))
		app.listen()
	}

	export async function sendToUser(params:SrsDefine.Http.Layer.tSendToUserReq) {
		let nodeName = Rpc.layerMgr.getUserNodeName(params.userID)
		if(!nodeName) {
			return <SrsDefine.Http.Layer.tSendToUserRes> {
				code:"not exist"
			}
		}
		await Rpc.layer.callServerException(nodeName,SrsRpcMethods.User.send,params.userID,params.msg.name,params.msg.data)
		return <SrsDefine.Http.Layer.tSendToUserRes> {
			code:"success"
		}
	}

	export async function sendToDevice(params:SrsDefine.Http.Layer.tSendToDeviceReq) {

		let nodeName = Rpc.layerMgr.getDeviceNodeName(params.deviceID)
		if(!nodeName) {
			return <SrsDefine.Http.Layer.tSendToDeviceRes> {
				code:"not exist"
			}
		}
		await Rpc.layer.callServerException(nodeName,SrsRpcMethods.Device.send,params.deviceID,params.msg.name,params.msg.data)
		return <SrsDefine.Http.Layer.tSendToUserRes> {
			code:"success"
		}
	}

	export async function selectSrsNode(params:SrsDefine.Http.Layer.tSelectSrsNodeReq) {
		if(Rpc.layerMgr.nodes.length == 0) {
			return {}
		}
		if(params.type == null) {
			let other:SrsDefine.NodeOtherConfig = Rpc.layerMgr.nodes[kdutils.intRandom(0,Rpc.layerMgr.nodes.length)].other
			return {
				host:other.deviceWSHost
			}
		}
		let infos = Rpc.layerMgr.nodes.filter(v=>v.type == params.type)
		if(infos.length == 0) {
			return {}
		}
		let other:SrsDefine.NodeOtherConfig = infos[kdutils.intRandom(0,infos.length)].other
		return {
			host:params.type == SrsDefine.NodeType.User ? other.userWSHost : other.deviceWSHost
		}
	}

	export async function dcnChanged(params:SrsDefine.Http.Layer.tDCNChangedReq) {
		if(Rpc.layerMgr.nodes.length == 0) {
			return {}
		}
		if(params.filterUserIDs) {
			for(let node of Rpc.layerMgr.nodes) {
				Rpc.layer.callServer(node.name,SrsRpcMethods.Node.dcnFilterChanged,params.filterUserIDs,params.dkey,params.data)
			}
		} else {
			for(let node of Rpc.layerMgr.nodes) {
				Rpc.layer.callServer(node.name,SrsRpcMethods.Node.dcnChanged,params.dkey,params.data)
			}
		}
		return {}
	}

	export async function callGS(params:SrsDefine.Http.Layer.tCallGSReq) {
		let gs = Rpc.layerMgr.gss.find(v=>v.name)
		if(!gs) {
			return <SrsDefine.Http.Layer.tCallGSRes>{
				code:"not exist",
			}
		}
		try {
			let data = await Rpc.layer.callServerException(gs.nodeName,SrsRpcMethods.Node.callGS,gs.name,params.method,...params.params)
			return <SrsDefine.Http.Layer.tCallGSRes>{
				code:"success",
				data,
			}
		} catch (error) {
			return <SrsDefine.Http.Layer.tCallGSRes>{
				code:"error",
				error,
			}
		}
	}
}