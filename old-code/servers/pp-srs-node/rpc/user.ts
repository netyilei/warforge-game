import { Rpc } from "../rpc"

async function send(h:string,userID:number,msgName:string,data:any) {
	if(!Rpc.user) {
		return false 
	}
	Rpc.user.sendToUser(userID,msgName,data)
	return true 
}

export let RpcSRSNodeUser = {
	send,
}