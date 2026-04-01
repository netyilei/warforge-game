import { GSRpcMethods } from "./GSRpcMethods"
import { RoomDefine } from "./RoomDefine"

export namespace GSMatchControl {
	// 游戏立即暂停
	export let GamePause = "GamePause"
	export type tGamePause = {
		timeoutSec?:number,
	}

	// 游戏恢复
	export let GameResume = "GameResume"
	export type tGameResume = {
		timeoutSec?:number,			// null | 0是立即开始
		resumeContainsWait?:boolean,

		nextWait?:tGameWaitOnEnd
	}

	export enum GameWaitType {
		System = 0,
		Combine,
	}

	// 游戏结束后等待
	export let GameWaitOnEnd = "GameWaitOnEnd"
	export type tGameWaitOnEnd = {
		timeoutSec?:number,		// null | 0是无限等待
		waitType:GameWaitType,
	}

	export let GameForceWaitCombine = "GameForceWaitCombine"
	export type tGameForceWaitCombine = {
		timeoutSec?:number,		// null | 0是无限等待
		b:boolean,
	}
	// 游戏结束
	export let GameRoundEnd = "GameRoundEnd"
	export type tGameRoundEnd = {
		removeUserMatchID?:boolean, // 是否移除用户的比赛数据
		waitEnd?:boolean,			// 是否等待结束
		roundEndRemoveType?:RoomDefine.RemoveType, // 结束后移除类型
	}

	// 用户强制退出比赛
	export let UserOut = "UserOut"
	export type tUserOut = {
		userID:number,
		reason?:string,
	}

	export let RoomCombine = "RoomCombine"
	export type tRoomCombine = {
		fromRoomID:number,
		toRoomID:number,
		userIDs:number[],
		enterReq?:GSRpcMethods.tUserEnterReq,
	}
}
