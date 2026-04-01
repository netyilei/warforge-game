import { baseService } from "kdweb-core/lib/service/base";
import { RobotExtDefine } from "../../pp-base-define/RobotExtDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { RobotUtils } from "../../src/RobotUtils";
import { UserUtils } from "../../src/UserUtils";
import { Module_RobotExtChargeStore, Module_RobotExtChargeStoreRecord, Module_RobotExtGroupPlan, Module_RobotExtMatchPlan, Module_RobotExtRobotChargeRecord, Module_RobotPersonalityConfig } from "../../pp-base-define/DM_RobotExtension";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import Decimal from "decimal.js";
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { RobotEnvTools } from "../../src/RobotEnvTools";


export namespace GMRobotExtension {

	export async function setGlobalControl(userID:number,params:{
		control:RobotExtDefine.tGlobalControl
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		await RobotUtils.setGlobalControl(params.control)
		return {}
	}

	export async function getGlobalControl(userID:number,params:{
		
	}) {
		return {
			control:await RobotUtils.getGlobalControl()
		}
	}

	export async function getChargeStore(userID:number,params:{
		storeID?:number,
		itemID?:string,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.storeID != null) {
			index.storeID = params.storeID
		}
		if(params.itemID != null) {
			index.itemID = params.itemID
		}
		let count = await Module_RobotExtChargeStore.getCount(index)
		let datas = await Module_RobotExtChargeStore.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
		})
		return {
			datas,count
		}
	}

	export async function getChargeStoreRecord(userID:number,params:{
		storeID?:number,
		itemID?:string,
		gmUserID?:string,
		reason?:string,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.storeID != null) {
			index.storeID = params.storeID
		}
		if(params.itemID != null) {
			index.itemID = params.itemID
		}
		if(params.gmUserID != null) {
			index.gmUserID = params.gmUserID
		}
		if(params.reason != null) {
			index.reason = {$regex:params.reason}
		}
		let count = await Module_RobotExtChargeStore.getCount(index)
		let datas = await Module_RobotExtChargeStore.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		})
		return {
			datas,count
		}
	}	

	export async function createStore(userID:number,params:{
		enabled:boolean,
		name:string,
		desc:string,
		itemID:string,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let store:RobotExtDefine.tChargeStore = {
			storeID:await IDUtils.getRobotExtStoreID(),
			enabled:params.enabled,
			name:params.name,
			desc:params.desc,
			itemID:params.itemID,
			count:"0",
			gmUserID:userID,
			timestamp: kdutils.getMillionSecond(),
			date: TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		}
		await Module_RobotExtChargeStore.insert(store)
		return {
			store,
		}
	}

	export async function setStoreEnabled(userID:number,params:{
		storeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RobotExtChargeStore.searchLockedSingleData(params.storeID)
		if(!module) {
			return baseService.errJson(1,"库存不存在")
		}
		module.data.enabled = !!params.enabled
		await module.saveAndRelease()
		return {
			store:module.data,
		}
	}

	export async function addChargeStore(userID:number,params:{
		storeID:number,
		count:string,
		reason:string,
		data?:any,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let num = new Decimal(params.count)
		if(num.lte(0)) {
			return baseService.errJson(1,"添加数量必须大于0")
		}
		let module = await Module_RobotExtChargeStore.searchLockedSingleData(params.storeID)
		if(!module) {
			return baseService.errJson(1,"库存不存在")
		}
		module.data.count = Decimal.add(module.data.count,params.count).toString()
		await module.saveAndRelease()
		// 记录
		let record:RobotExtDefine.tChargeStoreRecord = {
			no:await IDUtils.getRobotExtChargeRecordNo(),
			storeID:params.storeID,
			gmUserID:userID,
			itemID:module.data.itemID,
			count:params.count,
			reason:params.reason,
			data:params.data,
			timestamp: kdutils.getMillionSecond(),
			date: TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		}
		await Module_RobotExtChargeStoreRecord.insert(record)
		return {
			store:module.data,
		}
	}

	export async function getRobotChargeRecord(userID:number,params:{
		robotUserID?:number,
		storeID?:number,
		groupID?:string,
		matchID?:string,
		itemID?:string,
		reason?:string,
		page:number,limit:number,
	}) {
		
		let index:any = {}
		if(params.robotUserID != null) {
			index.robotUserID = params.robotUserID
		}
		if(params.storeID != null) {
			index.storeID = params.storeID
		}
		if(params.groupID != null) {
			index.groupID = params.groupID
		}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		if(params.itemID != null) {
			index.itemID = params.itemID
		}
		if(params.reason != null) {
			index.reason = {$regex:params.reason}
		}
		let count = await Module_RobotExtRobotChargeRecord.getCount(index)
		let datas = await Module_RobotExtRobotChargeRecord.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		})
		return {
			datas,count
		}
	}

	
	/**
	 * 获取个性配置，没有分页
	 */
	export async function getPersonalityConfigs(userID:number,params:{
		gameID?:number,
		personality?:RobotDefine.Personality,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(params.gameID != null) {
			index.gameID = params.gameID
		}
		if(params.personality != null) {
			index.personality = params.personality
		}
		return {
			datas:await Module_RobotPersonalityConfig.get(index) || []
		}
	}

	/**
	 * 添加/修改配置
	 */
	export async function setPersonalityConfig(userID:number,params:{
		config:RobotDefine.tPersonalityGameConfig_Base
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		await Module_RobotPersonalityConfig.updateOrInsert({gameID:params.config.gameID,personality:params.config.personality},params.config)
		return {}
	}

	export async function deletePersonalityConfig(userID:number,params:{
		gameID:number,
		personality:RobotDefine.Personality,
	}){
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let count = await Module_RobotPersonalityConfig.del({
			gameID:params.gameID,
			personality:params.personality
		})
		return count > 0 ? {} : baseService.errJson(1,"配置不存在")
	}


	export async function getGroupPlan(userID:number,params:{
		planID?:number,
		groupID?:number,
		withDisabled?:boolean,
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(params.planID != null) {
			index.planID = params.planID
		}
		if(params.groupID != null) {
			index.groupID = params.groupID
		}
		if(!params.withDisabled) {
			index.enabled = true
		} else {
			// 什么都不做
		}
		let count = await Module_RobotExtGroupPlan.getCount(index)
		let datas = await Module_RobotExtGroupPlan.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		})
		return {
			datas,count
		}
	}
	export async function createGroupPlan(userID:number,params:{
		plan:RobotExtDefine.tGroupPlan
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let plan = await Module_RobotExtGroupPlan.getMain(params.plan.planID)
		if(plan) {
			return baseService.errJson(1,"计划ID已存在")
		}
		params.plan.itemNeeded.itemID = String(params.plan.itemNeeded.itemID)
		params.plan.planID = await IDUtils.getRobotExtPlanID()
		params.plan.timestamp = kdutils.getMillionSecond()
		params.plan.date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		params.plan.enabled = true 
		await Module_RobotExtGroupPlan.insert(params.plan)
		return {
			plan:params.plan,
		}
	}

	export async function updateGroupPlanEnabled(userID:number,params:{
		planID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RobotExtGroupPlan.searchLockedSingleData(params.planID)
		if(!module) {
			return baseService.errJson(1,"计划不存在")
		}
		module.data.enabled = !!params.enabled
		await module.saveAndRelease()
		return {
			plan:module.data,
		}
	}

	export async function changeGroupPlanStoreID(userID:number,params:{
		planID:number,
		storeID:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RobotExtGroupPlan.searchLockedSingleData(params.planID)
		if(!module) {
			return baseService.errJson(1,"计划不存在")
		}
		let store = await Module_RobotExtChargeStore.getMain(params.storeID)
		if(!store) {
			module.release()
			return baseService.errJson(1,"充值库存不存在")
		}
		module.data.storeID = params.storeID
		await module.saveAndRelease()
		return {
			plan:module.data,
			store,
		}		
	}

	export async function changeGroupPlanPower(userID:number,params:{
		planID:number,
		monopoly?:boolean,
		power?:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RobotExtGroupPlan.searchLockedSingleData(params.planID)
		if(!module) {
			return baseService.errJson(1,"计划不存在")
		}
		if(params.monopoly != null) module.data.monopoly = params.monopoly
		if(params.power != null) module.data.power = params.power
		await module.saveAndRelease()
		return {
			plan:module.data,
		}
	}

	export async function getMatchPlan(userID:number,params:{
		planID?:number,
		matchID?:number,
		withDisabled?:boolean,
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(params.planID != null) {
			index.planID = params.planID
		}
		if(params.matchID != null) {
			index.matchID = params.matchID
		}
		if(!params.withDisabled) {
			index.enabled = true
		}
		let count = await Module_RobotExtMatchPlan.getCount(index)
		let datas = await Module_RobotExtMatchPlan.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				createTimestamp:-1
			}
		})
		return {
			datas,count
		}
	}

	export async function createMatchPlan(userID:number,params:{
		plan:RobotExtDefine.tMatchPlan
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let plan = await Module_RobotExtMatchPlan.getSingle({matchID:params.plan.matchID})
		if(plan) {
			return baseService.errJson(1,"该比赛已有机器人计划")
		}
		params.plan.itemNeeded.itemID = String(params.plan.itemNeeded.itemID)
		params.plan.planID = await IDUtils.getRobotExtPlanID()
		params.plan.createTimestamp = kdutils.getMillionSecond()
		params.plan.createDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		params.plan.enabled = true
		await Module_RobotExtMatchPlan.insert(params.plan)
		return {
			plan:params.plan,
		}
	}

	export async function updateMatchPlanEnabled(userID:number,params:{
		planID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RobotExtMatchPlan.searchLockedSingleData(params.planID)
		if(!module) {
			return baseService.errJson(1,"计划不存在")
		}
		module.data.enabled = !!params.enabled
		await module.saveAndRelease()
		return {
			plan:module.data,
		}
	}

	export async function changeMatchPlanStoreID(userID:number,params:{
		planID:number,
		storeID:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Robot)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RobotExtMatchPlan.searchLockedSingleData(params.planID)
		if(!module) {
			return baseService.errJson(1,"计划不存在")
		}
		let store = await Module_RobotExtChargeStore.getMain(params.storeID)
		if(!store) {
			module.release()
			return baseService.errJson(1,"充值库存不存在")
		}
		module.data.storeID = params.storeID
		await module.saveAndRelease()
		return {
			plan:module.data,
			store,
		}
	}

	export async function createRobot(userID:number,params:{
		groupID?:number,
		matchID?:number,
		count?:number,
	}) {
		params.count = params.count || 1
		for(let i = 0 ; i < params.count ; i ++) {
			await RobotEnvTools.createRobot("Robot_" + kdutils.intRandom(200000,2000000),null,{
				groupID:params.groupID,
				matchID:params.matchID,
			})
		}
		return {}
	}
}