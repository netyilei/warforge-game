import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { Config } from "../config";
import { Rpc } from "../rpc";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { Log } from "../log";

export class SrsLayerRpcDelegate extends knRpcManagerInterface.baseDelegate {

	onClientReg(h: string, serviceInfo: knRpcDefine.ServiceInfo) {

	}
	onClientClose(h: string, serviceInfo: knRpcDefine.ServiceInfo) {

	}
	onRegToService(serviceInfo: knRpcDefine.ServiceInfo) {
		if(Rpc.upperLayerConfig && Rpc.upperLayerConfig.name == serviceInfo.name) {
			Log.oth.info("handle upper level ready name = " + serviceInfo.name,serviceInfo)
			// Rpc.layer.callServer(serviceInfo.name,SrsRpcMethods.Layer.login,serviceInfo.name,Config.otherConfig)
		}
	}
	onCloseToService(serviceInfo: knRpcDefine.ServiceInfo) {
		Rpc.layerMgr.onNodeClosed(serviceInfo.name)
	}
	onMethodChanged(serviceInfo: knRpcDefine.ServiceInfo) {

	}
}