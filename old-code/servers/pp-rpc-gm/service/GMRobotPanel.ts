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
import { UserDefine } from "../../pp-base-define/UserDefine";


let db = DB.get()
let redis = DB.getRedis()
// 机器人面板
export namespace GMRobotPanel {
	/**
	 * 统计机器人游戏记录
	 * 参数和getRobotSerials保持一致
	 * 数据量大的时候这个接口会比较慢
	 */
	export async function aggRobotSerial(userID:number,params:{
		gameID?:number,				// 游戏ID
		robotUserIDs?:number[],

		group?:boolean,				// 和groupID互斥，true表示全部匹配，false表示不是匹配
		groupID?:number,

		// club?:boolean,				// 和clubID互斥，true表示全部俱乐部，false表示不是俱乐部
		// clubID?:number,
		// templateID?:number,

		match?:boolean,				// 和matchID互斥，true表示全部比赛，false表示不是匹配
		matchID?:number,			

		itemID?:string,	
		win?:boolean,				// 是否是赢的记录

		startTime?:number,
		endTime?:number,
	}) {
		let index:any = {}
		if(params.gameID) {
			index.gameID = params.gameID
		}
		if(params.robotUserIDs) {
			index.userID = {$in:params.robotUserIDs}
		}
		if(params.group != null) {
			if(params.group) {
				index.groupID = {$ne:null}
			} else {
				index.groupID = {$eq:null}
			}
		} else if(params.groupID) {
			index.groupID = params.groupID
		}
		// if(params.club != null) {
		// 	if(params.club) {
		// 		index.clubID = {$ne:null}
		// 	} else {
		// 		index.clubID = {$eq:null}
		// 	}
		// } else if(params.clubID) {
		// 	index.clubID = params.clubID
		// }
		if(params.match != null) {
			if(params.match) {
				index.matchID = {$ne:null}
			} else {
				index.matchID = {$eq:null}
			}
		} else if(params.matchID) {
			index.matchID = params.matchID
		}
		// if(params.templateID) {
		// 	index.templateID = params.templateID
		// }
		if(params.itemID) {
			index.itemID = params.itemID
		}
		if(params.win != null) {
			if(params.win) {
				index.numScoreChanged = {$gte:0}
			} else {
				index.numScoreChanged = {$lt:0}
			}
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
		let datas = await db.aggregate(DBDefine.tableRobotGameSerial,[
			{$match:index},
			{$group:{
				_id:null,total:{$sum:"$numScoreChanged"}
			}}
		]) || []
		let total = datas[0]?.total || 0
		return {
			total
		}
	}

	/**
	 * 获取机器人游戏记录
	 */
	export async function getRobotSerials(userID:number,params:{
		gameID?:number,
		robotUserIDs?:number[],

		group?:boolean,
		groupID?:number,

		// club?:boolean,
		// clubID?:number,
		// templateID?:number,

		match?:boolean,
		matchID?:number,

		itemID?:string,
		win?:boolean,

		startTime?:number,
		endTime?:number,

		page?:number,
		limit?:number,
	}) {
		let index:any = {}
		if(params.gameID) {
			index.gameID = params.gameID
		}
		if(params.robotUserIDs) {
			index.userID = {$in:params.robotUserIDs}
		}
		if(params.group != null) {
			if(params.group) {
				index.groupID = {$ne:null}
			} else {
				index.groupID = {$eq:null}
			}
		} else if(params.groupID) {
			index.groupID = params.groupID
		}
		// if(params.club != null) {
		// 	if(params.club) {
		// 		index.clubID = {$ne:null}
		// 	} else {
		// 		index.clubID = {$eq:null}
		// 	}
		// } else if(params.clubID) {
		// 	index.clubID = params.clubID
		// }
		// if(params.templateID) {
		// 	index.templateID = params.templateID
		// }
		if(params.match != null) {
			if(params.match) {
				index.matchID = {$ne:null}
			} else {
				index.matchID = {$eq:null}
			}
		} else if(params.matchID) {
			index.matchID = params.matchID
		}
		if(params.itemID) {
			index.itemID = params.itemID
		}
		if(params.win != null) {
			if(params.win) {
				index.numScoreChanged = {$gte:0}
			} else {
				index.numScoreChanged = {$lt:0}
			}
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
		let count = await db.getCount(DBDefine.tableRobotGameSerial,index)
		let datas:RobotDefine.tRobotGameSerial[] = await db.getOption(DBDefine.tableRobotGameSerial,index,{
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
	 * 获取机器人列表
	 * 只有projection里定义的字段才会返回
	 */
	export async function getRobots(userID:number,params:{
		robotUserIDs?:number[],
		status?:RobotDefine.Status,
		taskID?:number

		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.robotUserIDs) {
			index.robotUserID = {$in:params.robotUserIDs}
		}
		if(params.status != null) {
			index.status = params.status
		}
		if(params.taskID) {
			index.strategyTaskID = params.taskID
		}

		let count = await db.getCount(DBDefine.tableRobotRuntime,index)
		let datas:RobotDefine.tRuntime[] = await db.getOption(DBDefine.tableRobotRuntime,index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				// createTimestamp:-1
			},
			projection:{
				robotUserID:1,
				status:1,				// 执行状态
				
				roomID:1,				// 房间号
				matchID:1,
				groupID:1,
				
				strategy:1,				// 策略类型
				personality:1,			// 个性类型
				
				strategyTaskID:1,		// 任务ID

				logicName:1,			// 服务器名字
				workerIdx:1,			// 进程序列
				
				startTimestamp:1,		// 启动时间
				restTimestamp:1,		// 休息截止时间
			}
		}) || []
		let loginDatas:UserDefine.tLoginData[] = await db.getOption(DBDefine.tableUserLoginData,{
			userID:{$in:datas.map(v=>v.robotUserID)}
		})
		return {
			datas,count,
			loginDatas, // 包含机器人信息
		}
	}

	// 获取机器人面板数据
	export async function getPanel(userID:number,params:{
		
	}) {
		let startTime = Number(TimeDate.getMoment().startOf("day").format("x"))
		let endTime = Number(TimeDate.getMoment().endOf("day").format("x")) + 1
		let res = await aggRobotSerial(userID,{startTime,endTime})
		let totalRobotCount = await db.getCount(DBDefine.tableRobotRuntime,{})
		let totalRunningRobotCount = await db.getCount(DBDefine.tableRobotRuntime,{status:RobotDefine.Status.Using})
		let totalLoadingRobotCount = await db.getCount(DBDefine.tableRobotRuntime,{status:RobotDefine.Status.Loading})
		
		// 库存情况
		let stores:{
			_id:string,			// itemID,
			value:number,		// 总库存
			usedValue:number,	// 总使用
		}[] = await db.aggregate(DBDefine.tableRobotStoreValue,[
			// {$match:{ended:false}},
			{$project:{
				nValue:{$toDouble:"$value"},
				nUsedValue:{$toDouble:"$usedValue"},
			}},
			{$group:{
				_id:"$itemID",
				value:{$sum:"$nValue"},
				usedValue:{$sum:"$nUsedValue"},
			}}
		]) || []

		let totalTaskCount = await db.getCount(DBDefine.tableRobotStrategyTask,{status:RobotDefine.StrategyTaskStatus.Wait})
		let totalRunningTaskCount = await db.getCount(DBDefine.tableRobotStrategyTask,{status:RobotDefine.StrategyTaskStatus.Running})
		let totalPausedTaskCount = await db.getCount(DBDefine.tableRobotStrategyTask,{status:RobotDefine.StrategyTaskStatus.Pause})

		
		// 任务执行情况
		let taskRobotCounts:{
			_id:number,			// 任务ID
			count:number,		// 正在执行的机器人数量
		}[] = await db.aggregate(DBDefine.tableRobotRuntime,[
			{$match:{
				status:RobotDefine.Status.Using,
				strategyTaskID:{$ne:null}
			}},
			{$group:{
				_id:"$strategyTaskID",
				count:{$sum:1},
			}}
		]) || []
		return {
			todayTotal:res.total,	// 今日盈亏

			totalRobotCount,		// 机器人总数
			totalRunningRobotCount,	// 正在运行的机器人数量
			totalLoadingRobotCount,	// 正在加载的机器人数量

			stores,					// 充值库存

			totalTaskCount,			// 等待执行任务总数
			totalRunningTaskCount,	// 执行中的任务数
			totalPausedTaskCount,	// 暂停任务数

			taskRobotCounts,		// 正在执行的任务对应的机器人数
		}
	}
}