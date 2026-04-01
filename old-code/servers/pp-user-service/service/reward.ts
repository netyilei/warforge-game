import { baseService } from "kdweb-core/lib/service/base";
import { LobbyRewardUtils } from "../entity/LobbyRewardUtils";
import { GlobalUtils } from "../../src/GlobalUtils";
import { DB } from "../../src/db";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine";
import { RedisLock } from "../../src/RedisLock";
import { TimeDate } from "../../src/TimeDate";
import { kdutils } from "kdweb-core/lib/utils";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ItemDefine } from "../../pp-base-define/ItemDefine";

let db = DB.get()
export namespace LobbyRewardService {
	export async function getLobbyRewards(userID:number,params:{
		
	}) {
		// 大转盘奖励和任务的完成情况
		let actions:LoginLobbyDefine.tUserActionRealtime[] = await db.get(DBDefine.tableUserActionRealtime,{userID}) || []
		return {
			lottery:await LobbyRewardUtils.getLottery(userID),
			checkin:await LobbyRewardUtils.getUserCheckin(userID),
			actions,
		}
	}	

	export async function doLottery(userID:number,params:{
		
	}) {
		let item = await LobbyRewardUtils.doLottery(userID)
		return item ? {
			item
		} : baseService.errJson(1,"转动失败")
	}

	export async function gainAction(userID:number,params:{
		actionNo:number
	}) {
		return await RedisLock.callInLock(RedisLock.UserAction(userID),10,async ()=>{
			let action:LoginLobbyDefine.tUserActionRealtime = await db.getSingle(DBDefine.tableUserActionRealtime,{userID,no:params.actionNo})
			if(!action || !action.complete || action.gain) {
				return baseService.errJson(1,"领取失败")
			}
			let retItems:ItemDefine.tItem[] = []
			switch(action.type) {
				case LoginLobbyDefine.UserActionRealtimeType.Lottery:{
					// tUserLotteryRewardCache
					let lotteryConfig = await GlobalUtils.getLotteryConfig()
					let reward = lotteryConfig.rewards.find(v=>v.action.no == action.no)
					if(reward) {
						await LobbyRewardUtils.getLottery(userID,async (lottery)=>{
							lottery.maxCount += reward.times
							let info = lottery.rewards.find(v=>v.actionNo == reward.action.no)
							if(!info) {
								info = {
									actionNo:reward.action.no,
									completeCount:1,
									totalAddCount:reward.times
								}
								lottery.rewards.push(info)
							} else {
								info.completeCount ++
								info.totalAddCount += reward.times
							}
							return true 
						})
					}
					let rt = {
						delAction:true 
					}
					await LobbyRewardUtils.getLotteryRewardCache(userID,async (cache)=>{
						let info = cache.completeActions.find(v=>v.no == action.no)
						if(!info) {
							info = {
								no:action.no,count:1
							}
						} else {
							info.count ++
						}
						if(reward.lifeTimeCount && reward.lifeTimeCount >= 0 && info.count >= reward.lifeTimeCount) {
							rt.delAction = false 
						} else if(reward.limitCount && reward.limitCount >= 0 && info.count >= reward.limitCount) {
							rt.delAction = false 
						}
						return true 
					})
					if(rt.delAction) {
						await db.del(DBDefine.tableUserActionRealtime,{no:action.no})
					}
				} break 
				case LoginLobbyDefine.UserActionRealtimeType.Task:{
					let task:LoginLobbyDefine.tTask = await db.getSingle(DBDefine.tableConfigTasks,{"action.no":action.no})
					if(!task) {
						return baseService.errJson(1,"领取失败【2】")
					}
					if(task.rewards && task.rewards.length > 0) {
						let items:ItemDefine.tItem[] = task.rewards.map(v=>{
							return {
								id:v.itemID,
								count:String(v.count),
							}
						})
						Rpc.center.call(kds.item.addItems,userID,items,ItemDefine.SerialType.Lobby_Task)

						retItems.push.apply(retItems,items)
					}
					if(action.daily) {
						action.gain = true 
						await db.update(DBDefine.tableUserActionRealtime,{no:action.no},action)
					} else {
						await db.del(DBDefine.tableUserActionRealtime,{no:action.no})
					}
				} break 
			}
			return {
				items:retItems
			}
		})
	}
	
	let aday = 24 * 3600000
	export async function checkin(userID:number,params:{
		
	}) {
		return await new Promise<any>(async (resolve,reject)=>{
			await LobbyRewardUtils.getUserCheckin(userID,async (checkin)=>{
				let time = kdutils.getMillionSecond()
				let today = TimeDate.getFmtMoment("YYYY-MM-DD",time)
				if(checkin.nextDate != today) {
					resolve(baseService.errJson(1,"签到失败"))
					return false 
				}
				checkin.nextDate = TimeDate.getFmtMoment("YYYY-MM-DD",time + aday)
				checkin.lastDate = today
				checkin.dayCount ++
				let dayCount = parseInt(TimeDate.getFmtMoment("DD",time))
				checkin.curMonthDays.push(dayCount)
				let config = await GlobalUtils.getCheckinConfig()
				let items:{
					itemID:string,
					count:number,
				}[] = []
				let item = config.items?.find(v=>v.dayCount == checkin.dayCount)
				if(item) {
					Rpc.center.call(kds.item.add,userID,item.itemID,item.count,ItemDefine.SerialType.Lobby_Checkin)
					items.push(item)
				}
				let monthItem = config.monthItems?.find(v=>v.dayCount == dayCount)
				if(monthItem) {
					Rpc.center.call(kds.item.add,userID,monthItem.itemID,monthItem.count,ItemDefine.SerialType.Lobby_Checkin)
					items.push(monthItem)
				}
				resolve({
					items,
				})
				return true 
			})
		})
	}
}