import { CoreFunctionals } from "../core/CoreFunctionals"
import { GroupDefine } from "../ServerDefines/GroupDefine"
import { ItemDefine } from "../ServerDefines/ItemDefine"
import { MatchDefine } from "../ServerDefines/MatchDefine"
import { NewsDefine } from "../ServerDefines/NewsDefine"
import { RoomDefine } from "../ServerDefines/RoomDefine"
import { UserDefine } from "../ServerDefines/UserDefine"


export namespace ReqLobby {
	export let getBag = CoreFunctionals.reqAK<tGetBagReq, tGetBagRes>("lobby/getbag")
	export type tGetBagReq = {
	}
	export type tGetBagRes = {
		errCode?: number,
		errMsg?: string,

		bag: ItemDefine.tBag,
	}

	export let getGroups = CoreFunctionals.reqAK<tGetGroupsReq, tGetGroupsRes>("lobby/getgroups")
	export type tGetGroupsReq = {
		gameID?: number
	}
	export type tGetGroupsRes = {
		errCode?: number,
		errMsg?: string,

		groups: GroupDefine.tData[]
	}

	export let lobbyEnter = CoreFunctionals.reqAK<tLobbyEnterReq, tLobbyEnterRes>("lobby/enter")
	export type tLobbyEnterReq = {
	}
	export type tLobbyEnterRes = {
		errCode?: number,
		errMsg?: string,
		data: {
			reddot: UserDefine.UserRedBot
		}
		items: string;
		banners:NewsDefine.tBanner[],
		// lottery: LoginLobbyDefine.tLotteryConfig
		// checkin: LoginLobbyDefine.tCheckin
		// tasks: LoginLobbyDefine.tTask[]
		userCounts:{
			gameID:number,
			count:number,
		}[],

		matchEvents:MatchDefine.tUserMatchEvent[],
	}

	export const getItemConfigs = CoreFunctionals.reqAK<tGetItemConfigsReq, tGetItemConfigsRes>("lobby/getitemconfigs")
	export type tGetItemConfigsReq = {

	}
	export type tGetItemConfigsRes = {
		errCode?: number,
		errMsg?: string,
		items: string;
	}

	export let getNews = CoreFunctionals.reqAK<tGetNewsReq,tGetNewsRes>("lobby/getnews")
	export type tGetNewsReq = {
		type?:NewsDefine.NewsType,
		page?:number,
		limit?:number,
	}
	export type tGetNewsRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:NewsDefine.tData[],
	}

	export let getNewsDetail = CoreFunctionals.reqAK<tGetNewsDetailReq,tGetNewsDetailRes>("lobby/getnewsdetail")
	export type tGetNewsDetailReq = {
		newsID:number,
	}
	export type tGetNewsDetailRes = {
		errCode?:number,
		errMsg?:string,

		data:NewsDefine.tData,
	}

	export let getBanners = CoreFunctionals.reqAK<tGetBannersReq,tGetBannersRes>("lobby/getbanners")
	export type tGetBannersReq = {
	}
	export type tGetBannersRes = {
		errCode?:number,
		errMsg?:string,

		banners:NewsDefine.tBanner[],
	}

	export let getMatchList = CoreFunctionals.reqAK<tGetMatchListReq,tGetMatchListRes>("match/getmatchlist")
	export type tGetMatchListReq = {
		matchID?:number,
		status?:MatchDefine.MatchStatus,
		statuss?:MatchDefine.MatchStatus[],
		self?:boolean,
		page:number,
		limit:number,
	}
	export type tGetMatchListRes = {
		errCode?:number,
		errMsg?:string,
		
		count:number,
		matchDatas:MatchDefine.tData[],
		displays:MatchDefine.tDisplay[],
		userRuntimes:MatchDefine.tUserRuntime[],
		rewards:MatchDefine.tReward[],
		userCounts:{[matchID:number]:number},
		userSignups:MatchDefine.tUserSignupRecord[],
	}

	export let getMatchFullDisplay = CoreFunctionals.reqAK<tGetMatchFullDisplayReq,tGetMatchFullDisplayRes>("match/getmatchfulldisplay")
	export type tGetMatchFullDisplayReq = {
		matchID:number,
	}
	export type tGetMatchFullDisplayRes = {
		errCode?:number,
		errMsg?:string,

		matchData:MatchDefine.tData,
		display:MatchDefine.tDisplay,
		reward:MatchDefine.tReward,
		runtime:MatchDefine.tUserRuntime,
		userSignup:MatchDefine.tUserSignupRecord,
	}

	export let getMatchRank = CoreFunctionals.reqAK<tGetMatchRankReq,tGetMatchRankRes>("match/getmatchrank")
	export type tGetMatchRankReq = {
		matchID:number,
		page:number,
		limit:number,
	}
	export type tGetMatchRankRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:MatchDefine.tUserRank[],
	}

	export let getMatchRuntimeRank = CoreFunctionals.reqAK<tGetMatchRuntimeRankReq,tGetMatchRuntimeRankRes>("match/getmatchruntimerank")
	export type tGetMatchRuntimeRankReq = {
		matchID:number,
		page:number,
		limit:number,
	}
	export type tGetMatchRuntimeRankRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:MatchDefine.tUserRuntime[],
	}

	export let getMatchRoom = CoreFunctionals.reqAK<tGetMatchRoomReq,tGetMatchRoomRes>("match/getroom")
	export type tGetMatchRoomReq = {
		matchID:number,
	}
	export type tGetMatchRoomRes = {
		errCode?:number,
		errMsg?:string,

		roomData:RoomDefine.RoomData,
		roomRealtime:RoomDefine.RoomRealtime,
	}

	export let matchSignup = CoreFunctionals.reqAK<tMatchSignupReq,tMatchSignupRes>("match/signup")
	export type tMatchSignupReq = {
		matchID:number,
	}
	export type tMatchSignupRes = {
		errCode?:number,
		errMsg?:string,
	}

	export let createRoom = CoreFunctionals.reqAK<tCreateRoomReq,tCreateRoomRes>("lobby/createroom")
	export type tCreateRoomReq = {
		gameData:RoomDefine.GameData
	}
	export type tCreateRoomRes = {
		errCode?:number,
		errMsg?:string,

		roomData:RoomDefine.RoomData,
	}

	export let joinRoom = CoreFunctionals.reqAK<tJoinRoomReq,tJoinRoomRes>("lobby/joinroom")
	export type tJoinRoomReq = {
		boxCode:string
	}
	export type tJoinRoomRes = {
		errCode?:number,
		errMsg?:string,

		roomData:RoomDefine.RoomData
	}


	export let uploadStart = CoreFunctionals.reqAK<tUploadStartReq,tUploadStartRes>("upload/start")
	export type tUploadStartReq = {
		path?:string,		// 强制使用中间路径
		filename?:string,	// 强制使用文件名，不带扩展名
		ext:string,			// 扩展名，带点 如 .png
		totalSize:number,
	}
	export type tUploadStartRes = {
		errCode?:number,
		errMsg?:string,
		filename:string,
	}

	export let uploadUpload = CoreFunctionals.reqAK<tUploadUploadReq,tUploadUploadRes>("upload/upload")
	export type tUploadUploadReq = {
		filename:string,
		base64Data:string,
	}
	export type tUploadUploadRes = {
		errCode?:number,
		errMsg?:string,
	}

	export let uploadEnd = CoreFunctionals.reqAK<tUploadEndReq,tUploadEndRes>("upload/end")
	export type tUploadEndReq = {
		filename:string,
	}
	export type tUploadEndRes = {
		errCode?:number,
		errMsg?:string,
	}
}

export namespace ReqUploadUtils {

	export async function uploadBase64Data(base64Data:string,ext:string,funcProgress?:(progress:number)=>void) {
 		// 3. 按10k分割并上传
		const chunkSize = 100 * 1024 // 100k字符
		const totalChunks = Math.ceil(base64Data.length / chunkSize)
		let startRes = await ReqLobby.uploadStart({
			ext: ext[0] != "." ? "." + ext : ext, // 扩展名，带点 如 .png
			totalSize: base64Data.length,
		})
		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize
			const end = Math.min(start + chunkSize, base64Data.length)
			const chunk = base64Data.substring(start, end)

			const uploadRes = await ReqLobby.uploadUpload({
				filename: startRes.filename,
				base64Data: chunk,
			})

			if (uploadRes.errCode) {
				alert(uploadRes.errMsg || '上传失败')
				return null
			}

			if (funcProgress) {
				funcProgress(Math.round(((i + 1) / totalChunks) * 100))
			}
		}

		// 4. 结束上传
		const endRes = await ReqLobby.uploadEnd({ filename: startRes.filename })
		if (endRes.errCode) {
			return endRes
		}
		if (funcProgress) {
			funcProgress(100)
		}
		return endRes 
	}

}