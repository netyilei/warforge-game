import { Rpc } from "../rpc"


async function roomRealtimeChanged(h:string,groupID:number,roomID:number) {
	Rpc.master.addRoomChanged(groupID,roomID)
}

async function roomRealtimeRemoved(h:string,groupID:number,roomID:number) {
	Rpc.master.addRoomRemoved(groupID,roomID)
}

export let RpcGroupHook = {
	roomRealtimeChanged,
	roomRealtimeRemoved
}