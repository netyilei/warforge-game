import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface"
import { kdutils } from "kdweb-core/lib/utils"
import { GlobalUtils } from "../../src/GlobalUtils"
import { TimeDate } from "../../src/TimeDate"
import { Rpc } from "../rpc"
import { DB } from "../../src/db"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { Log } from "../log"
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine"
import { kdasync } from "kdweb-core/lib/tools/async"
import { RedisLock } from "../../src/RedisLock"
import { UserDefine } from "../../pp-base-define/UserDefine"


let db = DB.get()
let redis = DB.getRedis()
let aday = 24 * 3600000
export class ProcessActionLooper {
	constructor(ignoreTimer?:boolean,rpc?:{center:knRpcManagerInterface.rpc}) {
		this.rpc_ = rpc || Rpc
		this.init(ignoreTimer)
	}
	private rpc_:{center:knRpcManagerInterface.rpc}
	async init(ignoreTimer?:boolean) {
		if(ignoreTimer) {
			return 
		}
		setInterval(() => {
			this.onUpdate()
		}, 10000);
		this.onUpdate()
	} 

	private allUserIDs_:number[] = null 
	get allUserIDs() {
		return this.allUserIDs_
	}
	set allUserIDs(v) {
		this.allUserIDs_ = v
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
			this.prevTimestamp_ = time 

			while(true) {
				let b = await RedisLock.callInLock(RedisLock.UserActionGlobal(),30,async ()=>{
					return await this.operDatas()
				})
				if(!b) {
					break 
				}
				await kdasync.timeout(500)
			}
		} catch (error) {
			Log.oth.error("",error)
		} finally {
			this.updating_ = false 
		}
	}

	async operDatas() {
		this.allUserIDs = this.allUserIDs || (<UserDefine.tLoginData[]>await db.getOption(DBDefine.tableUserLoginData,{},{
			projection:{userID:1}
		})).map(v=>v.userID)

		let datas:LoginLobbyDefine.tProcessAction[] = await db.getOption(DBDefine.tableProcessAction,{},{
			limit:50
		})
		if(!datas || datas.length == 0) {
			return false 
		}
		let lotteryConfig = await GlobalUtils.getLotteryConfig()
		let lotteryControl = await GlobalUtils.getLotteryControl()
		let tasks = await GlobalUtils.getTasks()
		for(let data of datas) {
			if(data.userID) {
				await this.operDataForUser(data.userID,data,{lotteryConfig,lotteryControl,tasks})
			} else if(data.bill) {
				for(let user of data.bill.users) {
					await this.operDataForUser(user.userID,data,{lotteryConfig,lotteryControl,tasks})
				}
			} else if(data.finalBill) {
				for(let user of data.finalBill.users) {
					await this.operDataForUser(user.userID,data,{lotteryConfig,lotteryControl,tasks})
				}
			} else {
				for(let userID of this.allUserIDs) {
					this.operDataForUser(userID,data,{lotteryConfig,lotteryControl,tasks})
				}
			}
		}
		await Promise.all([
			db.insert(DBDefine.tableProcessActionHistory,datas),
			db.delMany(DBDefine.tableProcessAction,{no:{$in:datas.map(v=>v.no)}}),
		])
		return true 
	}

	async operDataForUser(userID:number,data:LoginLobbyDefine.tProcessAction,opt:{
		lotteryConfig:LoginLobbyDefine.tLotteryConfig,
		lotteryControl:LoginLobbyDefine.tLotteryControl,
		tasks:LoginLobbyDefine.tTask[],
	}) {
		let actions:LoginLobbyDefine.tUserActionRealtime[] = await db.get(DBDefine.tableUserActionRealtime,{userID})
		let changeActions:LoginLobbyDefine.tUserActionRealtime[] = []
		for(let reward of opt.lotteryConfig.rewards) {
			if(!this.isSame(reward.action,data)) {
				continue 
			}
			let action = actions.find(v=>v.no == reward.action.no)
			if(action) {
				if(action.complete) {
					continue 
				}
				action.count ++ 
			} else {
				action = {
					userID,
					no:reward.action.no,
					type:LoginLobbyDefine.UserActionRealtimeType.Lottery,
					
					count:1,
					complete:false,
					gain:false,

					createTime:kdutils.getMillionSecond(),
					createDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					daily:true,
					dailyDate:TimeDate.getFmtMoment("YYYY-MM-DD"),
				}
			}
			if(data.targetCount) {
				if(action.count >= data.targetCount) {
					action.complete = true 
				} 
			} else {
				action.complete = true 
			}
			changeActions.push(action)
		}
		for(let task of opt.tasks) {
			if(!this.isSame(task.action,data)) {
				continue 
			}
			let action = actions.find(v=>v.no == task.action.no)
			if(action) {
				if(action.complete) {
					continue 
				}
				action.count ++ 
			} else {
				action = {
					userID,
					no:task.action.no,
					type:LoginLobbyDefine.UserActionRealtimeType.Task,
					
					count:1,
					complete:false,
					gain:false,

					createTime:kdutils.getMillionSecond(),
					createDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					daily:task.expireType == LoginLobbyDefine.TaskExpireType.Daily,
					dailyDate:task.expireType == LoginLobbyDefine.TaskExpireType.Daily ? TimeDate.getFmtMoment("YYYY-MM-DD") : null,
				}
			}
			if(data.targetCount) {
				if(action.count >= data.targetCount) {
					action.complete = true 
				} 
			} else {
				action.complete = true 
			}
			changeActions.push(action)
		}
		if(changeActions.length > 0) {
			let ps = changeActions.map(v=>db.updateOrInsert(DBDefine.tableUserActionRealtime,v,{userID,no:v.no}))
			await Promise.all(ps)
		}
	}

	isSame(action:LoginLobbyDefine.tAction,data:LoginLobbyDefine.tProcessAction) {
		switch(action.type) {
			case LoginLobbyDefine.ActionType.Special:{
				return !!data.targetStr && data.targetStr == action.targetStr
			} break 
			case LoginLobbyDefine.ActionType.PlayJu:{
				let b = false 
				if(!data.bill) {
					return false 
				}
				if(action.gameID != null && action.gameID != data.gameData.gameID) {
					return false 
				}
				if(action.roomTypes) {
					for(let roomType of action.roomTypes) {
						switch(roomType) {
							case LoginLobbyDefine.ActionRoomType.Group:{
								b = data.bill.groupID != null
							} break 
							case LoginLobbyDefine.ActionRoomType.Club:{
								b = data.bill.clubID != null
							} break 
							case LoginLobbyDefine.ActionRoomType.Match:{
								b = data.bill.matchID != null
							} break 
							case LoginLobbyDefine.ActionRoomType.Custom:{
								b = data.bill.groupID == null && data.bill.matchID == null && data.bill.clubID == null
							} break 
						}
					}
				} else {
					b = true 
				}
				return b 
			} break 
		}
		return false 
	}
}