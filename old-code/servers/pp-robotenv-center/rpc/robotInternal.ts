import { Rpc } from "../rpc"

async function regLogic(h:string,gameIDs:number[]) {
	Rpc.delegate.regLogic(h,gameIDs)
}
async function regEnv(h:string,gameID:number) {
	Rpc.delegate.regEnv(h,gameID)
}


export let RpcRobotInternal = {
	regLogic,
	regEnv
}