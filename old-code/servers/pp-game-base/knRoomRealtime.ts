import Decimal from "decimal.js"
import { GameSet } from "../pp-base-define/GameSet"
import { RoomDefine } from "../pp-base-define/RoomDefine"
import { UserDefine } from "../pp-base-define/UserDefine"

export class knRoomRealtime {
	constructor(roomID:number,gameSet:GameSet,lockID?:string) {
		this.roomID_ = roomID
		this.gameSet_ = gameSet 
		this.payMainType = RoomDefine.getPayType(this.gameSet_.getPayType())
		this.payIndex = RoomDefine.getPayIndex(this.gameSet_.getPayType())
		this.lockID = lockID || "ROOM:" + roomID + "GAMEID:" + gameSet.gameID
	}
	
	protected roomID_:number
	protected gameSet_:GameSet

	payMainType:number
	payIndex:number

	lockID:string

	waitReadyTimeout:number
}

export namespace knRoomRealtime {
	export enum Status {
		None		= 0x00,
		Wait		= 0x01,

		RoundStart	= 0x10,
		GameStart	= 0x20,
		Playing		= 0x30,
		Result		= 0x40,
		JuEnd		= 0x50,
		RoundEnd	= 0x60,
	}

	export type MsgType = {
		chairNo:number,
		msgName:string,
		jsonObj:any
	}

	export type UserData = {
		userID:number,
		chairNo:number,
		loginData:UserDefine.tLoginData,

		juCount:number,

		score:Decimal,
		scoreChange:Decimal,
		scoreCharge:Decimal,

		robot?:boolean,
		play:boolean,		// 参与本局
		ready:boolean,		// 准备

		online:boolean,		// 上线
		tuoguan:boolean,	// 托管
		enter:boolean,		// 客户端已经进入
		process:boolean,	// 正在进入，userEnter异步处理中
		
		extData:any,

		locks:Promise<any>[],

		readyToExit:boolean,
		readyToStandUp:boolean,
		waitReadyTime:number,
		
		prevChatTime?:number,
	}

	export type RobotEnvData = {
		rpcName:string,
		enabled:boolean,
	}
}