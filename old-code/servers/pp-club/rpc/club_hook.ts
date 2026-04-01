import { Rpc } from "../rpc"

async function roomRealtimeChanged(h:string,clubID:number,roomID:number) {
	Rpc.looper.addChanged(clubID,roomID)
}
async function roomRealtimeRemoved(h:string,clubID:number,roomID:number) {
	Rpc.looper.addRemoved(clubID,roomID)
}
export let RpcClubHook = {
	roomRealtimeChanged,
	roomRealtimeRemoved
}