
export namespace GSMatchUserMsg {
	export let WaitForCombine = "GSC_Match_WaitForCombine"
	export type tWaitForCombineNT = {
		roomID:number,
	}

	export let CombineFinished = "GSC_Match_CombineFinished"
	export type tCombineFinishedNT = {
		roomID:number,
	}

	export let MatchStartEnterRoom = "GSC_Match_MatchStartEnterRoom"
	export type tMatchStartEnterRoomReq = {
		matchID:number,
		roomID:number,
	}
}