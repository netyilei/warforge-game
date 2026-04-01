import { Rpc } from "../rpc"


async function restartGroup(h:string,groupID:number) {
	Rpc.master.restartGroup(groupID)
}

export let RpcGroup = {
	restartGroup
}