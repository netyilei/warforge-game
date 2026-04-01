import { baseService } from "kdweb-core/lib/service/base";
import { Module_UserPot } from "../../pp-base-define/DM_LeaderDefine";
import { RewardDefine } from "../../pp-base-define/RewardDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { UserUtils } from "../../src/UserUtils";
import { IDUtils } from "../../src/IDUtils";
import Decimal from "decimal.js";
import { GlobalUtils } from "../../src/GlobalUtils";

export namespace GMUserPotService {
	export async function getPotList(userID:number,params:{
		userIDs?:number[],
		groupID?:number,
		matchID?:number,

		sceneType?:RewardDefine.PotSceneType,
		targetType?:RewardDefine.PotTargetType,

		withDisabled?:boolean,

		page:number,
		limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let index:any = {}
		if(params.userIDs && params.userIDs.length > 0) {
			index.userID = {$in:params.userIDs}
		}
		if(params.groupID) {
			index.groupID = params.groupID
		}
		if(params.matchID) {
			index.matchID = params.matchID
		}
		if(params.sceneType !== undefined) {
			index.sceneType = params.sceneType
		}
		if(params.targetType !== undefined) {
			index.targetType = params.targetType
		}
		if(!params.withDisabled) {
			index.enabled = true
		}
		let count = await Module_UserPot.getCount(index)
		let datas = await Module_UserPot.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{potID:-1},
		})
		return {
			count:count,
			datas:datas,
		}
	}

	export async function createForUser(userID:number,params:{
		userID?:number, // 如果不传，则代表全部用户
		sceneType:RewardDefine.PotSceneType,
		globalMatch:boolean,	// 如果scene是global，是否会影响比赛
		config:RewardDefine.tPotExtConfig,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let index:any = {}
		if(params.userID !== undefined) {
			index.userID = params.userID
		}
		index.sceneType = params.sceneType
		index.targetType = params.userID ? RewardDefine.PotTargetType.User : RewardDefine.PotTargetType.All
		index.globalMatch = !!params.globalMatch
		let pot:RewardDefine.tPot = {
			potID:await IDUtils.getPotID(),
			enabled:true,
			...index,
			...params.config,
		}
		pot.currentCount = "0"
		await Module_UserPot.insert(pot)
		return {}
	}

	export async function createForGroup(userID:number,params:{
		userID?:number, // 如果不传，则代表全部用户
		groupID:number,
		config:RewardDefine.tPotExtConfig,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let index:any = {}
		if(params.userID !== undefined) {
			index.userID = params.userID
		}
		index.groupID = params.groupID
		index.sceneType = RewardDefine.PotSceneType.Group
		index.targetType = params.userID ? RewardDefine.PotTargetType.User : RewardDefine.PotTargetType.All
		let pot:RewardDefine.tPot = {
			potID:await IDUtils.getPotID(),
			enabled:true,
			...index,
			...params.config,
		}
		pot.currentCount = "0"
		await Module_UserPot.insert(pot)
		return {}
	}

	export async function createForMatch(userID:number,params:{
		userID?:number, // 如果不传，则代表全部用户
		matchID:number,
		config:RewardDefine.tPotExtConfig,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let index:any = {}
		if(params.userID !== undefined) {
			index.userID = params.userID
		}
		index.matchID = params.matchID
		index.sceneType = RewardDefine.PotSceneType.Match
		index.targetType = params.userID ? RewardDefine.PotTargetType.User : RewardDefine.PotTargetType.All
		let pot:RewardDefine.tPot = {
			potID:await IDUtils.getPotID(),
			enabled:true,
			...index,
			...params.config,
		}
		pot.currentCount = "0"
		await Module_UserPot.insert(pot)
		return {}
	}

	export async function updatePotConfig(userID:number,params:{
		potID:number,
		config:RewardDefine.tPotExtConfig,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_UserPot.searchLockedSingleData(params.potID)
		if(!module) {
			return baseService.errJson(2,"奖池配置不存在")
		}
		for(let key of Object.keys(params.config)) {
			module.data[key] = (params.config as any)[key]
		}
		await module.saveAndRelease()
		return {}
	}

	export async function setPotEnabled(userID:number,params:{
		potID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_UserPot.searchLockedSingleData(params.potID)
		if(!module) {
			return baseService.errJson(2,"奖池配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {}
	}

	export async function addTotalValue(userID:number,params:{
		potID:number,
		count:string,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Pot)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let count = new Decimal(params.count || 0)
		if(count.lte(0)) {
			return baseService.errJson(3,"增加数量必须大于0")
		}
		let module = await Module_UserPot.searchLockedSingleData(params.potID)
		if(!module) {
			return baseService.errJson(2,"奖池配置不存在")
		}
		module.data.totalCount = count.add(module.data.totalCount || 0).toString()
		await module.saveAndRelease()
		return {}
	}

	export async function testPot(userID:number,params:{
		index?:GlobalUtils.tPotSearchIndex
	}) {
		let pots = await GlobalUtils.findPots(params.index)
		let pot = GlobalUtils.filterPots(pots)
		return { 
			pots,	// 所有匹配的奖池
			pot,	// 最终生效的奖池
		}
	}
}