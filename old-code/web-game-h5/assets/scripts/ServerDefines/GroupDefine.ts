import { RoomDefine } from "./RoomDefine"


export namespace GroupDefine {
	export type tData = {
		groupID:number,
		gameID:number,

		createUserID?:number,
		createGMID?:number,

		pri:number,				// 排序
		gameData:RoomDefine.GameData,

		// 自定义显示类型，用于前端显示
		display:{
			type:string,
			iconUrl:string,
			content:string,
		},

		itemID:string,
		minItemCount:number,	// [minItemCount,maxItemCount)
		maxItemCount:number,

		timestamp:number,
		date:string,
	}
}