import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { Rpc } from "../rpc"

async function onLogicOnline(h:string,serviceInfo:knRpcDefine.ServiceInfo,gameIDs:number[]) {
	Rpc.robotDelegate.onLogicOnline(serviceInfo,gameIDs)
}
async function onLogicOffline(h:string,name:string) {
	Rpc.robotDelegate.onLogicOffline(name)
}


export let RpcRobotEnv = {
	onLogicOnline,
	onLogicOffline,
}