import { GameSet } from "../../pp-base-define/GameSet"
import { GSUserMsg } from "../../pp-base-define/GSUserMsg"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { IRobotProcessWorker } from "../entity/IRobotProcessWorker"

export class BaseRobotRuntime {
    protected worker_:IRobotProcessWorker

	private selfUserID_:number = null 
	get selfUserID() {
		return this.selfUserID_
	}
	get roomID() {
		return this.roomData_?.roomID
	}

	private roomData_:RoomDefine.RoomData = null 
	get roomData() {
		return this.roomData_
	}

	private gameSet_:GameSet = null 
	get gameSet() {
		return this.gameSet_
	}


	private playingChairNos_:number[] = []
	get playingChairNos() {
		return this.playingChairNos_
	}

	private users_:GSUserMsg.tUserEnterData[] = []
	get users() {
		return this.users_
	}

	private selfChairNo_:number = -1
	get selfChairNo() {
		return this.selfChairNo_
	}
}