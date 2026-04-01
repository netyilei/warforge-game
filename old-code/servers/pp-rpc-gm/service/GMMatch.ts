import { baseService } from "kdweb-core/lib/service/base";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { kds } from "../../pp-base-define/GlobalMethods";
import { MatchDefine } from "../../pp-base-define/MatchDefine";
import { DB } from "../../src/db";
import { IDUtils } from "../../src/IDUtils";
import { Rpc } from "../rpc";
import { GlobalUtils } from "../../src/GlobalUtils";
import { Module_MatchData, Module_MatchDisplay, Module_MatchExecuterRoomInfo, Module_MatchReward, Module_MatchUserRank, Module_MatchUserRuntime, Module_MatchUserSignUp } from "../../pp-base-define/DM_MatchDefine";
import { Log } from "../log";

let db = DB.get()
export namespace GMMatchService {
	export async function getMatchList(userID:number,params:{
		matchIDs?:number[]
		name?:string,
		gameID?:number,
		status?:MatchDefine.MatchStatus,
		statuss?:MatchDefine.MatchStatus,

		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.matchIDs) {
			index.matchID = {$in:params.matchIDs}
		}
		if(params.name) {
			index.name = {$regex:params.name}
		}
		if(params.gameID) {
			index["gameData.gameID"] = params.gameID
		}
		if(params.status != null) {
			index.status = params.status
		}
		if(params.statuss) {
			index.status = {$in:params.statuss}
		}

		let count = await Module_MatchData.getCount(index)
		let datas = await Module_MatchData.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				matchID:-1,
			}
		})
		let matchIDs = datas.map((d)=>d.matchID)
		let displays = await Module_MatchDisplay.get({matchID:{$in:matchIDs}})
		let rewards = await Module_MatchReward.get({matchID:{$in:matchIDs}})
		let waters = await Promise.all(matchIDs.map(v=>GlobalUtils.getMatchWater(v)))
		let results = datas.map((d)=>{
			let display = displays.find(dd=>dd.matchID == d.matchID)
			let reward = rewards.find(rr=>rr.matchID == d.matchID)
			let water = waters.find(wr=>wr && wr.matchID == d.matchID)
			return {
				data:d,
				display:display,
				reward:reward,
				water:water,
			}
		})
		return {
			count:count,
			datas:results
		}
	}

	
	export async function createMatch(userID:number,params:{
		data:MatchDefine.tData,	// 基础数据
		display:MatchDefine.tDisplay, // 展示数据
		reward:MatchDefine.tReward, // 奖励数据
		water?:MatchDefine.tWater, // 抽水数据
	}) {
		let matchID = await IDUtils.getMatchID()
		params.data.matchID = matchID
		params.display.matchID = matchID
		params.reward.matchID = matchID
		if(params.water) {
			params.water.matchID = matchID
		}
		await Module_MatchData.insert(params.data)
		await Module_MatchDisplay.insert(params.display)
		await Module_MatchReward.insert(params.reward)
		if(params.water) {
			await GlobalUtils.setMatchWater(params.water)
		}
		return {
			matchID:matchID,
		}
	}

	export async function delMatch(userID:number,params:{
		matchID:number,
	}) {
		let matchData = await Module_MatchData.getSingle({matchID:params.matchID})
		if(!matchData) {
			return baseService.errJson(1,"比赛不存在")
		}
		if(matchData.status != MatchDefine.MatchStatus.Signup) {
			return baseService.errJson(2,"只能删除未开始的比赛")
		}
		Rpc.center.call(kds.match.oper.endMatch,params.matchID)
		return {}
	}

	export async function updateDisplay(userID:number,params:{
		display:MatchDefine.tDisplay,
	}) {
		await Module_MatchDisplay.update(params.display)
		return {}
	}

	export async function updateData(userID:number,params:{
		data:MatchDefine.tData,
	}) {
		let module = await Module_MatchData.searchLockedSingleData(params.data.matchID)
		if(!module) {
			return baseService.errJson(1,"比赛不存在")
		}
		for(let key of Object.keys(params.data)) {
			if(key == "matchID") continue
			module.data[key] = params.data[key]
		}
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function updateReward(userID:number,params:{
		reward:MatchDefine.tReward,
	}) {
		Log.oth.info("update",params.reward)
		await Module_MatchReward.update(params.reward)
		return {}
	}

	// 更新抽水设置 如果之前没有设置则新增
	export async function updateWater(userID:number,params:{
		water:MatchDefine.tWater,
	}) {
		await GlobalUtils.setMatchWater(params.water)
		return {}
	}

	// 获取用户比赛运行时数据
	export async function getUserRuntimes(userID:number,params:{
		matchID?:number,
		userID?:number,
		statuss?:MatchDefine.UserMatchStatus[],
		sortScore?:"asc"|"desc",
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		if(params.userID != null) {
			index.userID = params.userID
		}
		if(params.statuss) {
			index.status = {$in:params.statuss}
		}
		let sort:any = {}
		if(params.sortScore) {
			sort.scoreNum = params.sortScore == "asc" ? 1 : -1
		} else {
			sort.matchID = 1
			sort.scoreNum = -1
		}
		let count = await Module_MatchUserRuntime.getCount(index)
		let datas = await Module_MatchUserRuntime.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:sort,
		})
		return {
			count,
			datas,
		}
	}

	export async function getSignupRecord(userID:number,params:{
		matchID?:number,
		userID?:number,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		if(params.userID != null) {
			index.userID = params.userID
		}
		let count = await Module_MatchUserSignUp.getCount(index)
		let datas = await Module_MatchUserSignUp.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		})
		return {
			count,
			datas,
		}
	}

	export async function getRank(userID:number,params:{
		matchID:number,
		page:number,
		limit:number,
	}) {
		if(!params.matchID) {
			return baseService.errJson(1,"必须传入比赛ID")
		}
		let index:any = {}
		index.matchID = params.matchID
		let count = await Module_MatchUserRank.getCount(index)
		let datas = await Module_MatchUserRank.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				rank:1
			}
		})
		return {
			count,
			datas,
		}
	}

	export async function getExecuterRoomInfos(userID:number,params:{
		matchID?:number,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		let count = await Module_MatchExecuterRoomInfo.getCount(index)
		let datas = await Module_MatchExecuterRoomInfo.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
		})
		return {
			count,
			datas,
		}

	}
}