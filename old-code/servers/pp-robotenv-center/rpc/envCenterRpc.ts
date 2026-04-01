import { Module_MatchData } from "../../pp-base-define/DM_MatchDefine"
import { RobotRpcMethods } from "../../pp-base-define/RobotRpcMethods"
import { Rpc } from "../rpc"


async function stopRobotLogicByMatchID(h:string,matchID:number) {
	let matchData = await Module_MatchData.getMain(matchID)
	if(!matchData) {
		return false 
	}
	let clients = Rpc.delegate.getLogicClients(matchData.gameData.gameID)
	let ps = []
	for(let logic of clients) {
		ps.push(
		Rpc.robot.callServer(logic.serviceInfo.name,RobotRpcMethods.logic_internalStopRobotLogicByMatchID,matchID)
		)
	}
	await Promise.all(ps)
}

export let RpcEnvCenterRpc = {
	stopRobotLogicByMatchID
}