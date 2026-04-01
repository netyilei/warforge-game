import { kdutils } from "kdweb-core/lib/utils"
import { Log } from "../pp-account/log"
import { DBDefine } from "../pp-base-define/DBDefine"
import { RobotDefine } from "../pp-base-define/RobotDefine"
import { DB } from "./db"
import { IDUtils } from "./IDUtils"
import { RedisLock } from "./RedisLock"
import { TimeDate } from "./TimeDate"


let db = DB.get()
export class RobotStrategyTask {
	private constructor() {}

	// 只读创建
	static async create(taskID:number) {
		let task:RobotDefine.tStrategyTask = await db.getSingle(DBDefine.tableRobotStrategyTask,{taskID:taskID})
		if(!task) {
			return null 
		}
		let ret = new RobotStrategyTask()
		ret.task_ = task
		return ret 
	}

	// 可读可写,使用完毕必须调用saveAndRelease或者release
	static async createAndLock(taskID:number,reason:string,data?:any) {
		let lock = new RedisLock(RedisLock.RobotStrategyTask(taskID))
		let b = await lock.lock()
		if(!b) {
			Log.oth.error("lock failed taskID = " + taskID)
			return null 
		}
		let ret = await RobotStrategyTask.create(taskID)
		if(!ret) {
			lock.releaseLock()
			return null 
		}
		ret.originTask_ = kdutils.clone(ret.task_)
		ret.lock_ = lock 
		ret.reason = reason 
		ret.data = data 
		return ret 
	}

	static async newTask(planID:number,personality:RobotDefine.Personality,strategy:RobotDefine.RuntimeStrategy,strategyData:any,gmID?:number) {
		let plan:RobotDefine.tRobotStrategy = await db.getSingle(DBDefine.tableRobotStrategyConfig,{planID:planID})
		if(!plan) {
			return null 
		}
		let task:RobotDefine.tStrategyTask = {
			taskID:await IDUtils.getRobotPlanTaskID(),			// 任务流水号
			planID:plan.planID,			// 策略ID
			personality:personality,	// 个性
			strategy:strategy,
			strategyData:strategyData,	// 基于strategy生成对应的Data

			status:RobotDefine.StrategyTaskStatus.Wait,

			createGMID:gmID,
			createTimestamp:kdutils.getMillionSecond(),
			createDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),

			startTimestamp:null,
			startDate:null,
			datas:[],
		}
		await db.insert(DBDefine.tableRobotStrategyTask,task)
		return task 
	}

	private task_:RobotDefine.tStrategyTask
	get task() {
		return this.task_
	}
	private reason_:string = null 
	get reason() {
		return this.reason_
	}
	set reason(v) {
		this.reason_ = v 
	}
	private data_:any = null 
	get data() {
		return this.data_
	}
	set data(v) {
		this.data_ = v
	}
	private originTask_:RobotDefine.tStrategyTask
	private lock_:RedisLock
	async saveAndRelease() {
		if(!this.originTask_) {
			return false 
		}
		if(!this.lock_) {
			throw new Error("task lock already unlocked taskID = " + this.task.planID)
		}
		let keys = Object.keys(this.originTask_)
		let records:RobotDefine.tStrategyTaskRecord[] = []
		let setObj:any = {}
		let time = kdutils.getMillionSecond()
		for(let key of keys) {
			let fromValue = this.originTask_[key]
			let toValue = this.task_[key]
			if(JSON.stringify({v:fromValue}) != JSON.stringify({v:toValue})) {
				setObj[key] = toValue 
				this.originTask_[key] = toValue
				records.push({
					taskID:this.task_.taskID,
					planID:this.task_.planID,
					key,
					fromValue,
					toValue,
					reason:this.reason,
					data:this.data,
					timestamp:time,
					date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time),
				})
			}
		}
		if(records.length > 0) {
			await db.insert(DBDefine.tableRobotStrategyTaskRecord,records)
			await db.updateOrigin(DBDefine.tableRobotStrategyTask,{taskID:this.task_.taskID},{
				$set:setObj,
			})
		}
		this.lock_.releaseLock()
		this.lock_ = null 
		return true 
	}

	release() {
		if(this.lock_) {
			this.lock_.releaseLock()
			this.lock_ = null 
		}
	}
}