import { kdutils } from "kdweb-core/lib/utils"
import { Module_MatchData, Module_MatchDisplay, Module_MatchReward, Module_MatchUserRank, Module_MatchUserRuntime, Module_MatchUserSignUp } from "../../pp-base-define/DM_MatchDefine"
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine"
import { Module_UserRoomID } from "../../pp-base-define/DM_UserDefine"
import { MatchDefine } from "../../pp-base-define/MatchDefine"
import { RedisLock } from "../../src/RedisLock"
import { baseService } from "kdweb-core/lib/service/base"
import { Rpc } from "../rpc"
import { kds } from "../../pp-base-define/GlobalMethods"
import { TimeDate } from "../../src/TimeDate"
import { ItemDefine } from "../../pp-base-define/ItemDefine"

export namespace MatchService {

	// 报名/重新报名
	export async function signup(userID:number,params:{
		matchID:number,	
	}) {
		let matchData = await Module_MatchData.getMain(params.matchID)
		if(!matchData) {
			return baseService.errJson(1,"比赛不存在")
		}
		let checkValid = async ()=>{
			let time = kdutils.getMillionSecond()
			if(matchData.status != MatchDefine.MatchStatus.Signup) {
				if(matchData.status == MatchDefine.MatchStatus.Running) {
					let runtime = await Module_MatchUserRuntime.getSingle({
						userID,
						matchID:params.matchID,
					})
					if(!runtime) {
						return baseService.errJson(2,"比赛已经开始，无法报名")
					}
					if(runtime.status != MatchDefine.UserMatchStatus.Out) {
						return baseService.errJson(3,"您已经在比赛中，无法重新报名")
					}
					if(runtime.status == MatchDefine.UserMatchStatus.Out) {
						if(runtime.enterCount >= matchData.maxEnterCount) {
							return baseService.errJson(4,"您已经达到最大进入次数，无法重新报名")
						}
					}
				} else {
					return baseService.errJson(5,"无法报名")
				}
			} else {
				if(time < matchData.signupStartTime || time > matchData.signupEndTime) {
					return baseService.errJson(1,"当前时间无法报名")
				}
			}
			return true 
		}
		let ret = await checkValid()
		if(ret !== true) {
			return ret
		}
		return await RedisLock.callInLock(RedisLock.MatchSignup(params.matchID),10,async ()=>{
			let checkRet = await checkValid()
			if(checkRet !== true) {
				return checkRet
			}
			let module = await Module_MatchUserRuntime.getLockedSingleData({
				userID,
				matchID:params.matchID,
			})
			let item = matchData.signup[0]
			if(!module) {
				let b = await Rpc.center.callException(kds.item.use,userID,item.itemID,item.count,false,ItemDefine.SerialType.MatchSignup,{matchID:params.matchID})
				if(!b) {
					return baseService.errJson(6,"报名道具不足")
				}
				let userSignup:MatchDefine.tUserSignupRecord = {
					matchID:params.matchID,
					userID,
					signupItemID:item.itemID,
					signupItemCount:item.count,

					timestamp:kdutils.getMillionSecond(),
					date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
				}
				await Module_MatchUserSignUp.insert(userSignup)
				return {}
			}
			let b = await Rpc.center.callException(kds.item.use,userID,item.itemID,item.count,false,ItemDefine.SerialType.MatchSignup,{matchID:params.matchID})
			if(!b) {
				return baseService.errJson(6,"报名道具不足")
			}
			module.data.status = MatchDefine.UserMatchStatus.Ready
			module.data.enterCount += 1
			await module.saveAndRelease()
			return {}
		})
	}

	/**
	 * 获取当前比赛房间 
	 */
	export async function getRoom(userID:number,params:{
		matchID:number,
	}) {
		let roomInfo = await Module_UserRoomID.getSingle({
			userID,
			matchID:params.matchID,
		})
		if(!roomInfo) {
			return {}
		}
		let roomData = await Module_RoomData.getMain(roomInfo.roomID)
		let roomRealtime = await Module_RoomRealtime.getMain(roomInfo.roomID)
		return {
			roomData,
			roomRealtime,
		}
	}


	export async function getMatchList(userID:number,params:{
		matchID?:number,
		status?:MatchDefine.MatchStatus,
		statuss?:MatchDefine.MatchStatus[],
		self?:boolean,
		
		page:number,
		limit:number,
	}) {
		let focusMatchIDs:number[]
		if(params.self) {
			let records = await Module_MatchUserSignUp.aggregate([
				{$match:{userID}},
				{$group:{_id:"$matchID"}},
			])
			focusMatchIDs = records.map(r=>r._id)
		}
		let index:any = {}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		if(params.status != null) {
			index.status = params.status
		}
		if(params.statuss != null) {
			index.status = {$in:params.statuss}
		}
		if(focusMatchIDs) {
			index.matchID = {$in:focusMatchIDs}
		}
		let count = await Module_MatchData.getCount(index)
		let matchDatas = await Module_MatchData.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				status:1,
				startTime:-1,
			},
		})
		let matchIDs = matchDatas.map(m=>m.matchID)
		let displays = await Module_MatchDisplay.getOption({matchID:{$in:matchIDs}},{
			projection:{
				rules:0,
			}
		})
		let userRuntimes = await Module_MatchUserRuntime.getOption({userID:userID,matchID:{$in:matchIDs}},{})
		let rewards = await Module_MatchReward.getOption({matchID:{$in:matchIDs}},{})

		let userCounts:{[matchID:number]:number} = {}
		for(let data of matchDatas) {
			let count = await Module_MatchUserSignUp.getCount({matchID:data.matchID})// + kdutils.intRandom(0,1000)
			userCounts[data.matchID] = count
		}
		let userSignups = await Module_MatchUserSignUp.get({userID,matchID:{$in:matchIDs}})
		return {
			count,
			matchDatas,
			displays,
			userRuntimes,
			rewards,
			userCounts,
			userSignups,
		}
	}

	export async function getMatchFullDisplay(userID:number,params:{
		matchID:number,
	}) {
		let matchData = await Module_MatchData.getMain(params.matchID)
		let reward = await Module_MatchReward.getMain(params.matchID)
		let runtime = await Module_MatchUserRuntime.getSingle({
			userID,
			matchID:params.matchID,
		})
		let display = await Module_MatchDisplay.getMain(params.matchID)
		let userSignup = await Module_MatchUserSignUp.getSingle({
			userID,
			matchID:params.matchID,
		})
		return {
			display,
			matchData,
			reward,
			runtime,
			userSignup,
		}
	}

	export async function getMatchUserRuntime(userID:number,params:{
		matchID:number,
	}) {
		let userRuntime = await Module_MatchUserRuntime.getSingle({
			userID,
			matchID:params.matchID,
		})
		return {
			userRuntime,
		}
	}

	export async function getMatchRank(userID:number,params:{
		matchID:number,
		page:number,
		limit:number,
	}) {
		let count = await Module_MatchUserRank.getCount({matchID:params.matchID})
		let datas = await Module_MatchUserRank.getOption({matchID:params.matchID},{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				rank:1,
			}
		})
		return {
			count,
			datas,
		}
	}

	export async function getMatchRuntimeRank(userID:number,params:{
		matchID:number,
		page:number,
		limit:number,
	}) {
		let count = await Module_MatchUserRuntime.getCount({matchID:params.matchID})
		let datas = await Module_MatchUserRuntime.getOption({matchID:params.matchID},{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				scoreNum:-1,
			},
			projection:{
				robot:0,
			}
		})
		return {
			count,
			datas,
		}
	}
}