import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { Rpc } from "../rpc";


async function roomRealtimeChanged(h:string,matchID:number,roomID:number) {
	Rpc.master.onRoomRealtimeChanged(matchID,roomID)
}


async function roomRealtimeRemoved(h:string,matchID:number,roomID:number) {
	Rpc.master.onRoomRealtimeRemoved(matchID,roomID)
}

export let RpcMatchHook = {
	roomRealtimeChanged,
	roomRealtimeRemoved,
}