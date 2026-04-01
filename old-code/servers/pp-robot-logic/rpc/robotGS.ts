import { Rpc } from "../rpc"

async function sendMessage(h:string,userID:number,msgName:string,jsonObj) {
	let serviceInfo = Rpc.robotGS.getClientInfoByH(h)
	return Rpc.master.sendMessageFromGameServer(serviceInfo.name,userID,msgName,jsonObj)
}

async function userExit(h:string,userID:number,roomID:number) {
	let serviceInfo = Rpc.robotGS.getClientInfoByH(h)
	return Rpc.master.userExitFromGameServer(serviceInfo.name,userID,roomID)
}

export let RpcRobotGS = {
	sendMessage,
	userExit,
}