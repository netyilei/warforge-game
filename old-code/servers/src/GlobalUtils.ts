import Decimal from "decimal.js";
import { DB } from "./db";
import { DBDefine } from "../pp-base-define/DBDefine";
import { RewardDefine } from "../pp-base-define/RewardDefine";
import { LoginLobbyDefine } from "../pp-base-define/LoginLobbyDefine";
import { GlobalConfig } from "../pp-base-define/GlobalConfig";
import { Module_MatchWater } from "../pp-base-define/DM_MatchDefine";
import { ItemID } from "../pp-base-define/ItemDefine";
import { MatchDefine } from "../pp-base-define/MatchDefine";
import { RoomDefine } from "../pp-base-define/RoomDefine";
import { Module_UserBalance, Module_UserPot, Module_UserProxyCharge } from "../pp-base-define/DM_LeaderDefine";
import _ from "underscore";
import { kdutils } from "kdweb-core/lib/utils";
import { Log } from "../pp-rpc-center/log";


let redis = DB.getRedis()
let db = DB.get()
let rTablename = "t_global_config"
let rTableGroupWater = "t_water_group"
let rTableMatchWater = "t_water_match"
let rTableFriendWater = "t_water_friend"
export namespace GlobalUtils {
	export async function getMain() {
		return <GlobalConfig.tMain>await redis.hget(rTablename,"global-main",true)
	}
	export async function setMain(config:GlobalConfig.tMain) {
		await redis.hset(rTablename,"global-main",config,true)
	}

	export async function getLoginConfig() {
		return <GlobalConfig.tLogin>await redis.hget(rTablename,"login",true)
	}
	export async function setLoginConfig(config:GlobalConfig.tLogin) {
		await redis.hset(rTablename,"login",config,true)
	}


	export function roundDown(value:number | Decimal) {
		return new Decimal(value).toDecimalPlaces(2,Decimal.ROUND_DOWN)
	}
	export function roundUp(value:number | Decimal) {
		return new Decimal(value).toDecimalPlaces(2,Decimal.ROUND_UP)
	}

	export function newDecimal(value:any) {
		try {
			return new Decimal(value)
		} catch (error) {
			
		}
		return null 
	}

	export async function getGlobalChargeReward() {
		let ret = <RewardDefine.tCharge>await redis.hget(rTablename,"global-charge-reward",true)
		if(!ret) {
			ret = {
				loginRegisters:[],
				charges:[{
					itemID:ItemID.Gold,
					minChargeValue:"0",
					maxChargeValue:"0",
					chargeLeaderPercent:10,
				}],
			}
		} else {
			ret.loginRegisters = ret.loginRegisters || []
			ret.charges = ret.charges || []
		}
		return ret
	}

	export async function setGlobalChargeReward(reward:RewardDefine.tCharge) {
		await redis.hset(rTablename,"global-charge-reward",reward,true)
	}

	export async function getProxyChargeReward(userID:number) {
		let ret = <RewardDefine.tProxyCharge>await Module_UserProxyCharge.getMain(userID)
		return ret 
	}

	export async function setGroupWater(water:RewardDefine.tGroupWater) {
		await redis.hset(rTableGroupWater,"" + water.groupID,water,true)
	}

	export async function getGroupWater(groupID:number) {
		let ret = <RewardDefine.tGroupWater>await redis.hget(rTableGroupWater,"" + groupID,true)
		if(!ret) {
			ret = await getDefaultGroupWater()
		}
		return ret 
	}

	export async function setDefaultGroupWater(water:RewardDefine.tGroupWater) {
		water.groupID = 0
		return redis.hset(rTableGroupWater,"default",water,true)
	}
	export async function getDefaultGroupWater() {
		let ret = <RewardDefine.tGroupWater>await redis.hget(rTableGroupWater,"default",true)
		if(!ret) {
			ret = {
				groupID:null,
				type:RewardDefine.GameWaterType.None,
				target:RewardDefine.GameWaterTarget.Everyone,
				percent:0,
				minValue:"0",
				maxValue:"0",
			}
		}
		return ret 
	}

	export async function delGroupWater(groupID:number) {
		return redis.hdel(rTableGroupWater,"" + groupID)
	}

	export async function setFriendWater(water:RewardDefine.tFriendWater) {
		return redis.hset(rTableFriendWater,"global",water,true)
	}
	export async function getFriendWater() {
		return <RewardDefine.tFriendWater>await redis.hget(rTableFriendWater,"global",true)
	}

	export async function setMatchDefaultWater(water:RewardDefine.tMatchWater) {
		await redis.hset(rTableMatchWater,"default",water,true)
	}
	export async function getMatchDefaultWater() {
		let ret = <RewardDefine.tMatchWater>await redis.hget(rTableMatchWater,"default",true)
		if(!ret) {
			ret = {
				type:RewardDefine.GameWaterType.None,
				target:RewardDefine.GameWaterTarget.Everyone,
				percent:0,
				minValue:"0",
				maxValue:"0",
			}
		}
		return ret 
	}

	export async function setMatchWater(water:RewardDefine.tMatchWater) {
		return Module_MatchWater.updateOrInsert(water)
	}
	export async function delMatchWater(matchID:number) {
		return Module_MatchWater.del({matchID})
	}
	export async function getMatchWater(matchID:number):Promise<MatchDefine.tWater> {
		let ret = await Module_MatchWater.getSingle({matchID})
		if(!ret) {
			ret = <MatchDefine.tWater>await getMatchDefaultWater()
			ret.matchID = matchID
		}
		return ret
	}

	export type tPotSearchIndex = {
		userIDs?:number[],
		groupID?:number,
		matchID?:number,
		roomData?:RoomDefine.RoomData,
		roomRealtime?:RoomDefine.RoomRealtime,
		roomID?:number,
		observeEnabled?:boolean,
	}
	export async function findPots(opt:tPotSearchIndex) {
		let index:any = {
			enabled:true,
		}

		if(opt.userIDs != null) {
			index.userID = {
				$in: opt.userIDs
			}
		}
		if(opt.groupID != null) {
			index.groupID = opt.groupID
		}
		if(opt.matchID != null) {
			index.matchID = opt.matchID
		}
		if(opt.roomID != null) {
			index.roomID = opt.roomID
		}
		if(opt.roomData) {
			opt.roomData.groupID && (index.groupID = opt.roomData.groupID)
			opt.roomData.matchID && (index.matchID = opt.roomData.matchID)
			// opt.roomData.roomID && (index.roomID = opt.roomData.roomID)
			if(opt.roomData.roomType == RoomDefine.RoomType.Custom) {
				index.sceneType = RewardDefine.PotSceneType.Custom
			}
		}
		if(opt.roomRealtime) {
			opt.roomRealtime.groupID && (index.groupID = opt.roomRealtime.groupID)
			opt.roomRealtime.matchID && (index.matchID = opt.roomRealtime.matchID)
			opt.roomRealtime.roomID && (index.roomID = opt.roomRealtime.roomID)
		}
	
		let mainIndex = {
			enabled:true,
			$or:[
				{
					sceneType:RewardDefine.PotSceneType.Global,
					enabled:true,
					observeEnabled:!!opt.observeEnabled,
				},
				index,
			]
		}
		index.observeEnabled = !!opt.observeEnabled
		if(index.userID) {
			index.targetType = RewardDefine.PotTargetType.User
			mainIndex.$or[0].targetType = RewardDefine.PotTargetType.User
		}
		if(index.targetType == null) {
			index.targetType = RewardDefine.PotTargetType.All
			mainIndex.$or[0].targetType = RewardDefine.PotTargetType.All
		}
		if(index.sceneType == null) {
			if(index.groupID) {
				index.sceneType = RewardDefine.PotSceneType.Group
			} else if(index.matchID) {
				index.sceneType = RewardDefine.PotSceneType.Match
			} else if(index.roomID) {
				index.sceneType = RewardDefine.PotSceneType.Room
			}
		}
		Log.oth.info("find pots with index",JSON.stringify(index,null,4))
		let pots = await Module_UserPot.get(mainIndex)
		Log.oth.info("find pots result",pots)
		return pots
	}
	
	export function sortPort(pots:RewardDefine.tPot[]) {
		pots.sort((a,b)=>{
			return b.sceneType != a.sceneType ? b.sceneType - a.sceneType : b.pri - a.pri
		})
		return pots
	}
	export function filterPots(pots:RewardDefine.tPot[]) {
		if(!pots || pots.length == 0) {
			return null 
		}
		pots = sortPort(pots)
		return pots[0]
	}
	
	export async function getPot(opt?:tPotSearchIndex) {
		let pots = await findPots(opt)
		return filterPots(pots)
	}


	export type tSelectPot = {
		userID:number,
		pot:RewardDefine.tPot,
		active:boolean,	// 本次操作是否激活了奖池
		randPercent:number,
	}
	export async function getPotsByBalance(balanceUserIDs:number[],opt?:tPotSearchIndex):Promise<tSelectPot[]> {
		opt = opt || {}
		opt.observeEnabled = true
		opt.userIDs = balanceUserIDs
		let potss:RewardDefine.tPot[][] = []
		{
			let pots = await findPots(opt) || []
			potss.push(pots)
		}
		{
			opt.userIDs = null 
			let pots = await findPots(opt) || []
			potss.push(pots)
		}
		let pots = _.uniq(potss.flat(), (pot) => pot.potID)
		pots = sortPort(pots)
		let balances = await Module_UserBalance.get({
			userID:{
				$in:balanceUserIDs
			}
		})
		let ret:tSelectPot[] = []
		for(let balance of balances) {
			for(let pot of pots) {
				let percent = 0
				switch(pot.observeType) {
					case RewardDefine.OBPercentType.ExceptionCharge:
						percent = new Decimal(balance.totalCharge).equals(0) ? 0 : new Decimal(balance.exceptionValue).dividedBy(balance.totalCharge).times(100).toNumber()
						break;
					case RewardDefine.OBPercentType.ExceptionWithdraw:
						percent = new Decimal(balance.totalWithdraw).equals(0) ? 0 : new Decimal(balance.exceptionValue).dividedBy(balance.totalWithdraw).times(100).toNumber()
						break;
					case RewardDefine.OBPercentType.ExceptionWin:
						percent = new Decimal(balance.win).equals(0) ? 0 : new Decimal(balance.exceptionValue).dividedBy(balance.win).times(100).toNumber()
						break;
					case RewardDefine.OBPercentType.ExceptionLose:
						percent = new Decimal(balance.lose).equals(0) ? 0 : new Decimal(balance.exceptionValue).dividedBy(balance.lose).times(100).toNumber()
						break;
				}
				if(percent >= pot.observePercent) {
					let randPercent = kdutils.intRandom(0,100)
					ret.push({
						userID:balance.userID,
						pot,
						active:randPercent < pot.rates.percent,
						randPercent: randPercent,
					})
				}
			}
		}
		return ret 
	}

	export async function getPotsByDefault(userIDs:number[],opt?:tPotSearchIndex):Promise<tSelectPot[]> {
		opt = opt || {}
		opt.userIDs = userIDs
		let potss:RewardDefine.tPot[][] = []
		{
			let pots = await findPots(opt) || []
			potss.push(pots)
		}
		{
			opt.userIDs = null 
			let pots = await findPots(opt) || []
			potss.push(pots)
		}
		let pots = _.uniq(potss.flat(), (pot) => pot.potID)
		pots = sortPort(pots)
		let ret:tSelectPot[] = []
		for(let userID of userIDs) {
			for(let pot of pots) {
				if(pot.userID && pot.userID != userID) {
					continue 
				}
				let randPercent = kdutils.intRandom(0,100)
				ret.push({
					userID:userID,
					pot,
					active:randPercent < pot.rates.percent,
					randPercent,
				})
			}
		}
		return ret 
	}

	export async function addPotValue(potID:number,value:Decimal | number | string,checkEnabled?:boolean) {
		let pot = await Module_UserPot.searchLockedSingleData(potID)
		if(!pot) {
			return null 
		}
		if(checkEnabled && !pot.data.enabled) {
			await pot.release()
			return null
		}
		let currentCount = GlobalUtils.roundDown(Decimal.add(pot.data.currentCount, new Decimal(value).abs()))
		pot.data.currentCount = currentCount.toString()
		if(currentCount.greaterThan(pot.data.totalCount)) {
			pot.data.enabled = false 
		}
		await pot.saveAndRelease()
		return pot.data 
	}






























	////////////////////////////////////////////////////////////////////////////////////
	// 以下都不用了
	export async function getGlobalRewardPlan() {
		let planID = (await redis.hget(DBDefine.rTableGlobalReward,"global",true))?.planID
		return planID ? <RewardDefine.tPlan>await db.getSingle(DBDefine.tableRewardPlan,{planID}) : null
	}

	export async function setGlobalRewardPlan(planID:number) {
		await redis.hset(DBDefine.rTableGlobalReward,"global",{planID},true)
	}

	export async function getClubRewardPlan(clubID:number,ignoreGlobal?:boolean) {
		let planID = (await redis.hset(DBDefine.rTableGlobalReward,"CLUB:" + clubID,true))?.planID
		let plan:RewardDefine.tPlan = planID ? await db.getSingle(DBDefine.tableRewardPlan,{planID}) : null
		if(!plan) {
			if(ignoreGlobal) {
				return null 
			}
		}
		return plan || await getGlobalRewardPlan()
	}
	export async function setClubRewardPlan(clubID:number,planID?:Number) {
		if(planID == null) {
			await redis.hdel(DBDefine.rTableGlobalReward,"CLUB:" + clubID)
		} else {
			await redis.hset(DBDefine.rTableGlobalReward,"CLUB:" + clubID,{planID},true)
		}
	}
	export async function getGroupRewardPlan(groupID:number,ignoreGlobal?:boolean) {
		let planID = (await redis.hset(DBDefine.rTableGlobalReward,"group:" + groupID,true))?.planID
		let plan:RewardDefine.tPlan = planID ? await db.getSingle(DBDefine.tableRewardPlan,{planID}) : null
		if(!plan) {
			if(ignoreGlobal) {
				return null 
			}
		}
		return plan || await getGlobalRewardPlan()
	}
	export async function setGroupRewardPlan(groupID:number,planID?:Number) {
		if(planID == null) {
			await redis.hdel(DBDefine.rTableGlobalReward,"group:" + groupID)
		} else {
			await redis.hset(DBDefine.rTableGlobalReward,"group:" + groupID,{planID},true)
		}
	}

	
	
	export async function getLotteryConfig() {
		return <LoginLobbyDefine.tLotteryConfig>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLottery,true)
	}

	export async function getLotteryControl() {
		return <LoginLobbyDefine.tLotteryControl>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLotteryControl,true)
	}

	export async function getTasks() {
		return <LoginLobbyDefine.tTask[]>await db.get(DBDefine.tableConfigTasks,{
			enabled:{
				$ne:false,
			}
		})
	}
	export async function getCheckinConfig() {
		return <LoginLobbyDefine.tCheckin>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigCheckin,true)
	}

}