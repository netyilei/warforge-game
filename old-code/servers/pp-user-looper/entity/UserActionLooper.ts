import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface"
import { kdutils } from "kdweb-core/lib/utils"
import { GlobalUtils } from "../../src/GlobalUtils"
import { TimeDate } from "../../src/TimeDate"
import { Rpc } from "../rpc"
import { DB } from "../../src/db"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { Log } from "../log"
import { RedisLock } from "../../src/RedisLock"
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine"


let db = DB.get()
let redis = DB.getRedis()
let keyName = "t_user_action"
let startKeyName = "t_user_action_start_time"
let endKeyName = "t_user_action_end_time"
let aday = 24 * 3600000
export class UserActionLooper {
	constructor(ignoreTimer?:boolean,rpc?:{center:knRpcManagerInterface.rpc}) {
		this.rpc_ = rpc || Rpc
		this.init(ignoreTimer)
	}
	private rpc_:{center:knRpcManagerInterface.rpc}
	async init(ignoreTimer?:boolean) {
		let s = await redis.hget(DBDefine.rTableLooper,keyName)
		if(!s) {
			this.prevTimestamp_ = 0
		} else {
			this.prevTimestamp_ = parseInt(s)
		}
		if(ignoreTimer) {
			return 
		}
		setInterval(() => {
			this.onUpdate()
		}, 60000);
		this.onUpdate()
	} 
	async savePrevTimestamp() {
		await redis.hset(DBDefine.rTableLooper,keyName,String(this.prevTimestamp_))
	}

	private prevTimestamp_:number
	private updating_ =false 
	async onUpdate() {
		if(this.updating_) {
			return 
		}
		this.updating_ = true 
		try {
			let time = kdutils.getMillionSecond()
			let prevDay = TimeDate.getFmtMoment("YYYY-MM-DD",this.prevTimestamp_)
			if(TimeDate.getFmtMoment("YYYY-MM-DD",time) == prevDay) {
				this.prevTimestamp_ = time 
				await this.savePrevTimestamp()
				return 
			}
			this.prevTimestamp_ = time 
			await this.savePrevTimestamp()

			await RedisLock.callInLock(RedisLock.UserActionGlobal(),30,async ()=>{
				await this.doWork_ActionRealtime(time)
			})
			await RedisLock.callInLock(RedisLock.LotteryGlobal(),30,async ()=>{
				await this.doWork_Lottery(time)
			})
			await RedisLock.callInLock(RedisLock.UserLotteryRewardCacheGlobal(),30,async ()=>{
				await this.doWork_LotteryRewardCache(time)
			})
		} catch (error) {
			Log.oth.error("",error)
		} finally {
			this.updating_ = false 
		}
	}

	async doWork_ActionRealtime(time:number) {
		let today = TimeDate.getFmtMoment("YYYY-MM-DD",time)
		await db.delMany(DBDefine.tableUserActionRealtime,{
			daily:true,
			dailyDate:{$ne:today}
		})
	}

	async doWork_Lottery(time:number) {
		await db.updateOrigin(DBDefine.tableUserLotteryRealtime,{},{
			$set:{
				rewards:[]
			}
		})
	}

	async doWork_LotteryRewardCache(time:number) {
		let skip = 0
		let limit = 200
		let lotteryConfig = await GlobalUtils.getLotteryConfig()
		let ps = []
		while(true) {
			let caches:LoginLobbyDefine.tUserLotteryRewardCache[] = await db.getOption(DBDefine.tableUserLotteryRewardCache,{},{
				skip,limit
			}) || []
			for(let cache of caches) {
				let changed = false 
				for(let i = cache.completeActions.length - 1 ; i >= 0 ; i --) {
					let info = cache.completeActions[i]
					let reward = lotteryConfig.rewards.find(v=>v.action.no == info.no)
					if(!reward) {
						cache.completeActions.splice(i,1)
						changed = true 
					} else if(reward.lifeTimeCount == null || reward.lifeTimeCount <= 0) {
						cache.completeActions.splice(i,1)
						changed = true 
					}
				}
				if(changed) {
					ps.push(db.update(DBDefine.tableUserLotteryRewardCache,{userID:cache.userID},cache))
				}
			}
			if(caches.length < limit) {
				break 
			}
			skip += limit
		}
		if(ps.length > 0) {
			await Promise.all(ps)
		}
	}

}