import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { Config } from "../config";
import { Rpc } from "../rpc";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { Log } from "../log";

export class SrsNodeRpcDelegate extends knRpcManagerInterface.baseDelegate {

	onClientReg(h: string, serviceInfo: knRpcDefine.ServiceInfo) {

	}
	onClientClose(h: string, serviceInfo: knRpcDefine.ServiceInfo) {

	}
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo) {
		Log.oth.info("onRegToService " + serviceInfo.name)
		if(serviceInfo.name == Config.localConfig.layerName) {
			// 向layer登录
			Log.oth.info("call reg service " + serviceInfo.name)
			Rpc.node.callServer(serviceInfo.name,SrsRpcMethods.Layer.login,Config.myName,Config.localConfig.type,Config.otherConfig)

			Rpc.gsMgr.onLayerLogin(serviceInfo.name)
		}
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo) {
		if(Rpc.gsMgr) {
			let info = Rpc.gsMgr.gsNodes.find(v=>v.name == serviceInfo.name)
			if(info) {
				Rpc.gsMgr.gsClosed(serviceInfo.name)
			}
		}
	}
	onMethodChanged(serviceInfo: knRpcDefine.ServiceInfo) {

	}
}