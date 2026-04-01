import { baseService } from "kdweb-core/lib/service/base"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { DB } from "../../src/db"
import { Rpc } from "../rpc"
import { kds } from "../../pp-base-define/GlobalMethods"
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine"
import { IDUtils } from "../../src/IDUtils"
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods"
import { SrsDCN } from "../../pp-base-define/SrsUserMsg"
import { LobbyRewardUtils } from "../../pp-user-service/entity/LobbyRewardUtils"
import { GlobalConfig } from "../../pp-base-define/GlobalConfig"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { GlobalUtils } from "../../src/GlobalUtils"
import { UserUtils } from "../../src/UserUtils"
import { RewardDefine } from "../../pp-base-define/RewardDefine"
import { Module_UserProxyCharge } from "../../pp-base-define/DM_LeaderDefine"


let db = DB.get()
let redis = DB.getRedis()
export namespace GMConfigService {
	
	export async function getGlobalConfig(userID:number,params:{
		
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Config)) {
			return baseService.errJson(1,"权限不足")
		}
		return {
			config: await GlobalUtils.getMain()
		}
	}

	export async function setGlobalConfig(userID:number,params:{
		config:GlobalConfig.tMain
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Config)) {
			return baseService.errJson(1,"权限不足")
		}
		await GlobalUtils.setMain(params.config)
		return {}
	}

	export async function getLoginConfig(userID:number,params:{
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Config)) {
			return baseService.errJson(1,"权限不足")
		}
		return {
			config:await GlobalUtils.getLoginConfig()
		}
	}

	export async function setLoginConfig(userID:number,params:{
		config:GlobalConfig.tLogin
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Config)) {
			return baseService.errJson(1,"权限不足")
		}
		await GlobalUtils.setLoginConfig(params.config)
		return {}
	}
	
	export async function getItems(userID:number,params:{
		itemIDs?:string[]
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.itemIDs) {
			index.id = {$in:params.itemIDs}
		}
		let count = await db.getCount(DBDefine.tableConfigItems,index)
		let datas:ItemDefine.tConfig[] = await db.getOption(DBDefine.tableConfigItems,index,{
			skip:params.page * params.limit,
			limit:params.limit,
		}) || []
		return {
			datas,count,
			needRefresh:await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,false) == "1",
		}
	}

	async function saveItemToCSV() {
		let items:ItemDefine.tConfig[] = await db.get(DBDefine.tableConfigItems,{}) || []
		let keys = [
			"id","name","desc","type","overlapped","expireTime","expireOverlapped"
		]
		let lines = items.map(v=>
			keys.map(k=>v[k]).join(",")
		)
		let content = keys.join(",") + "\n" + lines.join("\n")
		await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemCsv,content,false)

		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnChanged,SrsDCN.itemConfigChanged(),{})
	}		
	

	export async function delItem(userID:number,params:{
		itemID:string
		refreshServer?:boolean,	// 是否强制刷新服务器数据
	}) {
		let count = await db.del(DBDefine.tableConfigItems,{id:params.itemID})
		if(count > 0) {
			Rpc.center.call(kds.item.delItem,params.itemID)
		}
		if(params.refreshServer) {
			Rpc.center.callAll(kds.item.config.refresh)
			saveItemToCSV()
			await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"0",false)
		} else {
			await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"1",false)
		}
		return {}
	}

	export async function createItem(userID:number,params:{
		item:ItemDefine.tConfig
		refreshServer?:boolean,	// 是否强制刷新服务器数据
	}) {
		let prev = await db.getSingle(DBDefine.tableConfigItems,{id:params.item.id})
		if(prev) {
			return baseService.errJson(1,"itemID重复")
		}
		await db.updateOrInsert(DBDefine.tableConfigItems,params.item,{id:params.item.id})
		if(params.refreshServer) {
			Rpc.center.callAll(kds.item.config.refresh)
			saveItemToCSV()
			await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"0",false)
		} else {
			await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"1",false)
		}
		return {}
	}

	export async function updateItem(userID:number,params:{
		item:ItemDefine.tConfig,
		refreshServer?:boolean,	// 是否强制刷新服务器数据
	}) {
		await db.update(DBDefine.tableConfigItems,{id:params.item.id},params.item)
		if(params.refreshServer) {
			Rpc.center.callAll(kds.item.config.refresh)
			saveItemToCSV()
			await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"0",false)
		} else {
			await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"1",false)
		}
		return {}
	}

	export async function refreshItemCache(userID:number,params:{
		
	}) {
		Rpc.center.callAll(kds.item.config.refresh)
		saveItemToCSV()
		await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigItemNeedRefresh,"0",false)
		return {}
	}

	export async function getLottery(userID:number,params:{
		
	}) {
		return {
			lottery:<LoginLobbyDefine.tLotteryConfig>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLottery,true),
			control:<LoginLobbyDefine.tLotteryControl>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLotteryControl,true),
		}
	}
	
	/**
	 * 新增加的rewards.action不需要传递action.no
	 * lottery.rewards.action.no
	 */
	export async function setLottery(userID:number,params:{
		lottery:LoginLobbyDefine.tLotteryConfig
	}) {
		let old:LoginLobbyDefine.tLotteryConfig = await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLottery,true)
		params.lottery.rewards = params.lottery.rewards || []
		for(let r of params.lottery.rewards) {
			if(r.action.no == null) {
				r.action.no = await IDUtils.getLobbyActionID()
			}
		}
		let ps = []
		if(old) {
			for(let r of old.rewards) {
				if(!params.lottery.rewards.find(v=>v.action.no == r.action.no)) {
					ps.push(
						db.del(DBDefine.tableUserActionRealtime,{no:r.action.no})
					)
				}
			}
		}
		if(ps.length > 0) {
			await Promise.all(ps)
		}
		await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigLottery,params.lottery,true)
		return {}
	}

	export async function setLotteryControl(userID:number,params:{
		control:LoginLobbyDefine.tLotteryControl
	}) {
		await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigLotteryControl,params.control,true)
		return {}
	}

	export async function getUserLotteryRealtimes(userID:number,params:{
		userIDs?:number[],
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		let count = await db.getCount(DBDefine.tableUserLotteryRealtime,index)
		let datas:LoginLobbyDefine.tUserLottery[] = await db.getOption(DBDefine.tableUserLotteryRealtime,index,{
			skip:params.page * params.limit,
			limit:params.limit,
		}) || []

		return {
			datas,count
		}
	}

	export async function delUserLotteryRealtime(userID:number,params:{
		userID:number
	}) {
		await db.delMany(DBDefine.tableUserLotteryRealtime,{userID:params.userID})
		return {}
	}
	
	export async function getCheckin(userID:number,params:{
		
	}) {
		return {
			checkin:<LoginLobbyDefine.tCheckin>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigCheckin,true)
		}		
	}

	export async function setCheckin(userID:number,params:{
		checkin:LoginLobbyDefine.tCheckin
	}) {
		await redis.hset(DBDefine.rTableConfigLobby,DBDefine.keyConfigCheckin,params.checkin,true)
		return {}
	}

	export async function getUserCheckins(userID:number,params:{
		userIDs?:number[],
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		let count = await db.getCount(DBDefine.tableUserCheckin,index)
		let datas:LoginLobbyDefine.tUserCheckin[] = await db.getOption(DBDefine.tableUserCheckin,index,{
			skip:params.page * params.limit,
			limit:params.limit,
		}) || []

		return {
			datas,count
		}
	}

	export async function getTasks(userID:number,params:{
		page:number,limit:number,
	}) {
		let index:any = {}
		let count = await db.getCount(DBDefine.tableConfigTasks,index)
		let datas:LoginLobbyDefine.tTask[] = await db.getOption(DBDefine.tableConfigTasks,index,{
			skip:params.page * params.limit,
			limit:params.limit,
		}) || []
		return {
			datas,count
		}
	}

	export async function updateTask(userID:number,params:{
		task:LoginLobbyDefine.tTask
	}) {
		await db.update(DBDefine.tableConfigTasks,{no:params.task.no},params.task)
		return {}
	}

	export async function delTask(userID:number,params:{
		no:number
	}) {
		let task:LoginLobbyDefine.tTask = await db.getSingle(DBDefine.tableConfigTasks,{no:params.no})
		if(!task) {
			return baseService.errJson(1,"任务不存在")
		}
		if(task.action) {
			await db.delMany(DBDefine.tableUserActionRealtime,{
				type:LoginLobbyDefine.UserActionRealtimeType.Task,
				no:task.action.no
			})
		}
		await db.del(DBDefine.tableConfigTasks,{no:params.no})
		return {}
	}

	export async function createTask(userID:number,params:{
		task:LoginLobbyDefine.tTask
	}) {
		params.task.no = await IDUtils.getTaskID()
		if(params.task.action) {
			params.task.action.no = await IDUtils.getLobbyActionID()
		}
		await db.insert(DBDefine.tableConfigTasks,params.task)
		return {}
	}
	export async function getUserActionRealtimes(userID:number,params:{
		userIDs?:number[],
		type:LoginLobbyDefine.UserActionRealtimeType,
		
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.type != null) {
			index.type = params.type
		}
		
		let count = await db.getCount(DBDefine.tableUserActionRealtime,index)
		let datas:LoginLobbyDefine.tUserActionRealtime[] = await db.getOption(DBDefine.tableUserActionRealtime,index,{
			skip:params.page * params.limit,
			limit:params.limit,
		}) || []
		return {
			datas,count
		}
	}

	export async function executeTaskStr(userID:number,params:{
		targetStr:string,
		userID?:number,	// 指定触发，可选
	}) {
		await LobbyRewardUtils.createProcessAction_TargetStr(params.targetStr,params.userID)
		return {}
	}

	export async function setFriendWater(userID:number,params:{
		water:RewardDefine.tFriendWater,
	}) {
		await GlobalUtils.setFriendWater(params.water)
		return {}
	}

	export async function getFriendWater(userID:number,params:{
		
	}) {
		return {
			water:await GlobalUtils.getFriendWater()
		}
	}

	export async function setDefaultGroupWater(userID:number,params:{
		water:RewardDefine.tGroupWater,
	}) {
		await GlobalUtils.setDefaultGroupWater(params.water)
		return {}
	}

	export async function getDefaultGroupWater(userID:number,params:{
		
	}) {
		return {
			water:await GlobalUtils.getDefaultGroupWater()
		}
	}

	export async function setDefaultMatchWater(userID:number,params:{
		water:RewardDefine.tMatchWater,
	}) {
		await GlobalUtils.setMatchDefaultWater(params.water)
		return {}
	}

	export async function getDefaultMatchWater(userID:number,params:{
		
	}) {
		return {
			water:await GlobalUtils.getMatchDefaultWater()
		}
	}

	export async function setGlobalChargeReward(userID:number,params:{
		charge:RewardDefine.tCharge,
	}) {
		await GlobalUtils.setGlobalChargeReward(params.charge)
		return {}
	}

	export async function getGlobalChargeReward(userID:number,params:{
		
	}) {
		return {
			charge:await GlobalUtils.getGlobalChargeReward()
		}
	}

	export async function getProxyCharge(userID:number,params:{
		userID?:number,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID) {
			index.userID = params.userID
		}
		let count = await Module_UserProxyCharge.getCount(index)
		let datas:RewardDefine.tProxyCharge[] = await Module_UserProxyCharge.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
		}) || []
		return {
			datas,count
		}
	}

	export async function setProxyCharge(userID:number,params:{
		charge:RewardDefine.tProxyCharge,
	}) {
		await Module_UserProxyCharge.updateOrInsert(params.charge)
		return {}
	}
}