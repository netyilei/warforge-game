import { Log } from "../log";
import { Rpc } from "../rpc";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { knRpcTools } from "../../src/knRpcTools";

export class LoginRpcEntity extends knRpcManagerInterface.baseDelegate {
	private userServices_:{
		name:string,
		host:string,
	}[] = []
	async onClientReg(h: string, serviceInfo: knRpcDefine.ServiceInfo) {
		if(!serviceInfo.name.startsWith("pp-user-service")) {
			return 
		}
		let info = this.userServices_.find(v=>v.name == serviceInfo.name)
		if(!info) {
			info = {
				name:serviceInfo.name,
				host:null
			}
			this.userServices_.push(info)
		}
		let config = await knRpcTools.getKDSConfig(info.name)
		if(!config || !config.other || !config.other.userHost) {
			Log.oth.error("cannot get valid service config name = " + info.name,config)
			let idx = this.userServices_.indexOf(info)
			if(idx >= 0) {
				this.userServices_.splice(idx,1)
			}
			return 
		}
		info.host = config.other.userHost
	}

	onClientClose(h: string, serviceInfo: knRpcDefine.ServiceInfo): void {
		let idx = this.userServices_.findIndex(v=>v.name == serviceInfo.name)
		if(idx >= 0) {
			this.userServices_.splice(idx,1)
		}
	}

	getLobbyInfos(areaID?:string) {
		return this.userServices_
	}
}