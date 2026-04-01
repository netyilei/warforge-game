import { baseService } from "kdweb-core/lib/service/base";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { DB } from "../../src/db";
import { IDUtils } from "../../src/IDUtils";
import { RedisLock } from "../../src/RedisLock";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { RobotStrategyTask } from "../../src/RobotStrategyTask";
import { Log } from "../log";


let db = DB.get()
let redis = DB.getRedis()
export namespace GMRobot {
	export async function getEnvConfig(userID:number,params:{
		
	}) {
		let config:RobotDefine.tEnvConfig = await redis.get(DBDefine.rTableRobotEnvConfig,true)
		return {
			config
		}
	}

	export async function setEnvConfig(userID:number,params:{
		config:RobotDefine.tEnvConfig
	}) {
		await redis.set(DBDefine.rTableRobotEnvConfig,params.config,true)
		return {}
	}

	/**
	 * 机器人策略
	 * @param userID 
	 * @param params 
	 * @returns 
	 */
	export async function getStrategyConfigs(userID:number,params:{
		planID?:number,
		robotUserIDs?:number[],
		strategy?:RobotDefine.RuntimeStrategy,
		clubID?:number,
		groupID?:number,
	}) {
		let index = <any>{}
		if(params.planID != null) {
			index.planID = params.planID
		}
		if(params.robotUserIDs) {
			index.robotUserIDs = {$in:params.robotUserIDs}
		}
		if(params.strategy != null) {
			index.strategy = params.strategy
		}
		if(params.clubID != null) {
			index.clubIDs = params.clubID
		}
		if(params.groupID != null) {
			index.groupIDs = params.groupID
		}
		return {
			datas:<RobotDefine.tRobotStrategy[]>await db.get(DBDefine.tableRobotStrategyConfig,index) || []
		}
	}

	/**
	 * 新增策略时不需要传planID
	 * @param userID 
	 * @param params 
	 * @returns 
	 */
	export async function updateStrategyConfig(userID:number,params:{
		config:RobotDefine.tRobotStrategy
	}) {
		if(params.config.planID == null) {
			params.config.planID = await IDUtils.getRobotPlanID()
		}
		await db.updateOrInsert(DBDefine.tableRobotStrategyConfig,params.config,{planID:params.config.planID})
		return {
			config:params.config
		}
	}

	/**
	 * 获取全部机器人
	 * @param userID 
	 * @param params 
	 * @returns 
	 */
	export async function getRobotLoginDatas(userID:number,params:{
		userIDs?:number[],
		baseOnly?:boolean	// 是否只要userID和nickName
		searchStr?:string,
		page:number,
		limit:number,
	}) {
		let index:any = {
			apiID:{$regex:"BINDR-"}
		}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.searchStr) {
			index.$or = [
				{strUserID:{$regex:params.searchStr}},
				{nickName:{$regex:params.searchStr}},
			]
		}
		let count = await db.getCount(DBDefine.tableUserLoginData,index)
		let datas = await db.getOption(DBDefine.tableUserLoginData,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			projection:params.baseOnly ? {
				userID:1,
				nickName:1,
			} : null
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
		let index:any = {}
		if(params.gameID != null) {
			index.gameID = params.gameID
		}
		if(params.personality != null) {
			index.personality = params.personality
		}
		return {
			datas:<RobotDefine.tPersonalityGameConfig_Base[]>await db.get(DBDefine.tableRobotPersonlityGameConfig,index) || []
		}
	}

	/**
	 * 添加/修改配置
	 */
	export async function setPersonalityConfig(userID:number,params:{
		config:RobotDefine.tPersonalityGameConfig_Base
	}) {
		await db.updateOrInsert(DBDefine.tableRobotPersonlityGameConfig,params.config,{
			gameID:params.config.gameID,
			personality:params.config.personality
		})
		return {}
	}

	export async function deletePersonalityConfig(userID:number,params:{
		gameID:number,
		personality:RobotDefine.Personality,
	}){
		await db.del(DBDefine.tableRobotPersonlityGameConfig,{
			gameID:params.gameID,
			personality:params.personality
		})
		return {}
	}

	/**
	 * 获取机器人充值库存
	 */
	export async function getRobotStoreValues(userID:number,params:{
		nos?:number[]
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.nos) {
			index.no = {$in:params.nos}
		}
		let count = await db.getCount(DBDefine.tableRobotStoreValue,index)
		let datas:RobotDefine.tStoreValue[] = await db.getOption(DBDefine.tableRobotStoreValue,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		}) || []
		return {
			datas,count
		}
	}
	/**
	 * 提前结束库存
	 */
	export async function endRobotStoreValue(userID:number,params:{
		no:number,
		data?:any,
	}) {
		return await RedisLock.callInLock(RedisLock.RobotStore(),10,async ()=>{
			let store:RobotDefine.tStoreValue = await db.getSingle(DBDefine.tableRobotStoreValue,{no:params.no})
			if(!store || store.ended) {
				return baseService.errJson(1,"状态不正确")
			}
			store.ended = true 
			store.endType = RobotDefine.StoreValueEndType.GM
			store.endData = {
				gmID:userID
			}
			store.endTimestamp = kdutils.getMillionSecond()
			store.endData = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
			await db.update(DBDefine.tableRobotStoreValue,{no:params.no},store)
			return {store}
		})
	}
	
	/**
	 * 创建库存
	 */
	export async function createRobotStoreValue(userID:number,params:{
		itemID:string,
		value:string,
	}) {
		let store:RobotDefine.tStoreValue = {
			no:await IDUtils.getRobotStoreID(),					// 流水号
			gmID:userID,				// 创建GMID
			itemID:params.itemID,				// 
			value:params.value,				// 总量
			usedValue:"0",			// 已使用
			ended:false,				// 是否已结束
			endType:null,	// 结束类型
			endData:null,				// 数据标记
			timestamp:kdutils.getMillionSecond(),			// 创建时间
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			endTimestamp:null,		// 结束时间
			endDate:null,
		}
		await db.insert(DBDefine.tableRobotStoreValue,store)
		return {}
	}


	/**
	 * 获取机器人库存使用记录
	 */
	export async function getRobotUseStoreValueRecords(userID:number,params:{
		robotUserIDs?:number[],
		storeNos?:number[],
		nos?:number[],
		itemID?:string,
		startTime?:number,
		endTime?:number,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.robotUserIDs) {
			index.robotUserID = {$in:params.robotUserIDs}
		}		
		if(params.storeNos) {
			index.useNo = {$in:params.storeNos}
		}
		if(params.nos) {
			index.no = {$in:params.nos}
		}
		if(params.itemID) {
			index.itemID = params.itemID
		}
		if(params.startTime) {
			if(params.endTime) {
				index.timestamp = {$gte:params.startTime,$lte:params.endTime}
			} else {
				index.timestamp = {$gte:params.startTime}
			}
		} else if(params.endTime) {
			index.timestamp = {$lte:params.endTime}
		}
		let count = await db.getCount(DBDefine.tableRobotUseStoreValueRecord,index)
		let datas:RobotDefine.tUseStoreRecord[] = await db.getOption(DBDefine.tableRobotUseStoreValueRecord,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		}) || []
		return {
			datas,count
		}
	}

	/**
	 * 获取策略任务列表
	 */
	export async function getStrategyTasks(userID:number,params:{
		planID?:number,
		taskID?:number,
		status?:RobotDefine.StrategyTaskStatus,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.planID) {
			index.planID = params.planID
		}
		if(params.taskID) {
			index.taskID = params.taskID
		}
		if(params.status != null) {
			index.status = params.status
		}
		let count = await db.getCount(DBDefine.tableRobotStrategyTask,index)
		let datas:RobotDefine.tStrategyTask[] = await db.getOption(DBDefine.tableRobotStrategyTask,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				createTimestamp:-1
			}
		}) || []
		return {
			datas,count
		}
	}

	/**
	 * 创建策略任务
	 */
	export async function createStrategyTask(userID:number,params:{
		planID:number,
		personality:RobotDefine.Personality
		strategy:RobotDefine.RuntimeStrategy,
		strategyData:any,
	}) {
		let task = await RobotStrategyTask.newTask(params.planID,params.personality,params.strategy,params.strategyData,userID)
		if(!task) {
			return baseService.errJson(1,"创建失败")
		}
		return {
			task
		}
	}

	/**
	 * 更改任务状态
	 * 刚创建的任务为Wait等待状态，任何状态都不能修改为这个状态
	 * Running执行，Pause暂停
	 * End已结束，Cancel已取消，一旦进入这两个状态就不能再修改为其他状态
	 */
	export async function changeStrategyTaskStatus(userID:number,params:{
		taskID:number,
		reason?:string,
		status:RobotDefine.StrategyTaskStatus,
	}) {
		let control = await RobotStrategyTask.createAndLock(params.taskID,params.reason)
		if(!control) {
			return baseService.errJson(1,"无法修改")
		}
		try {
			if([
				RobotDefine.StrategyTaskStatus.End,
				RobotDefine.StrategyTaskStatus.Cancel
			].includes(control.task.status)) {
				return baseService.errJson(1,"已结束，无法修改状态")
			}
			if([
				RobotDefine.StrategyTaskStatus.Wait,
				RobotDefine.StrategyTaskStatus.End
			].includes(params.status)) {
				return baseService.errJson(1,"无法修改到指定状态")
			}
			if(control.task.status == params.status) {
				return baseService.errJson(1,"无法修改到相同状态")
			}
			if(params.status == RobotDefine.StrategyTaskStatus.Running && control.task.status == RobotDefine.StrategyTaskStatus.Wait) {
				control.task.startTimestamp = kdutils.getMillionSecond()
				control.task.startDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
			}
			control.task.status = params.status
			await control.saveAndRelease()
			return {
				task:control.task
			}
		} catch (error) {
			Log.oth.error("",error)
		} finally {
			if(control) {
				control.release()
			}
		}
	}
}