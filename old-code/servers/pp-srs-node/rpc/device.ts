import { Rpc } from "../rpc"

async function send(h:string,deviceID:string,msgName:string,data:any) {
	// if(!Rpc.device) {
	// 	return false 
	// }
	// return Rpc.device.sendDevice(deviceID,msgName,data)
}

export let RpcSRSNodeDevice = {
	send,
}