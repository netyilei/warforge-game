import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine";
import { DB } from "../../src/db";
import { RedisLock } from "../../src/RedisLock";
import { TimeDate } from "../../src/TimeDate";
import { Log } from "../log";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { IDUtils } from "../../src/IDUtils";
import { RoomDefine } from "../../pp-base-define/RoomDefine";


let db = DB.get()
let redis = DB.getRedis()
export namespace LobbyRewardUtils {
	/**
	 * 
	 * @param userID 
	 * @param lockFunc true false 表示时候需要保存
	 * @returns 
	 */
	export async function getLottery(userID:number,lockFunc?:(lottery:LoginLobbyDefine.tUserLottery)=>Promise<boolean>) {
		return await RedisLock.callInLock(RedisLock.LotteryGlobal(),10,async ()=>{
			return await RedisLock.callInLock(RedisLock.Lottery(userID),10,async ()=>{
				let lottery:LoginLobbyDefine.tUserLottery = await db.getSingle(DBDefine.tableUserLotteryRealtime,{userID})
				let today = TimeDate.getFmtMoment("YYYY-MM-DD")
				let changed = false 
				if(lottery) {
					if(lottery.date != today) {
						lottery = null 
					}
				}
				if(!lottery) {
					let config = <LoginLobbyDefine.tLotteryConfig>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLottery,true)
					lottery = {
						userID,
						date:today,
						count:0,
						maxCount:config?.freeTimes || 0,
						rewards:[],
						lastTimestamp:kdutils.getMillionSecond(),
						lastDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
					}
					changed = true 
				}
				if(lockFunc) {
					try {
						let b = await lockFunc(lottery)
						changed = changed || b
					} catch (error) {
						Log.oth.error("getLottery: call lock func",lockFunc,error)
					}
				}
				if(changed) {
					await db.updateOrInsert(DBDefine.tableUserLotteryRealtime,lottery,{userID})
				}
				return lottery
			})
		})
	}
	export async function getLotteryRewardCache(userID:number,lockFunc?:(lottery:LoginLobbyDefine.tUserLotteryRewardCache)=>Promise<boolean>) {
		return await RedisLock.callInLock(RedisLock.UserLotteryRewardCacheGlobal(),10,async ()=>{
			return await RedisLock.callInLock(RedisLock.UserLotteryRewardCache(userID),10,async ()=>{
				let cache:LoginLobbyDefine.tUserLotteryRewardCache = await db.getSingle(DBDefine.tableUserLotteryRewardCache,{userID})
				if(!cache) {
					cache = {
						userID,
						completeActions:[]
					}
				}
				let changed = false 
				try {
					changed = await lockFunc(cache)
				} catch (error) {
					Log.oth.error("getLottery: call lock func",lockFunc,error)
				}
				if(changed) {
					await db.updateOrInsert(DBDefine.tableUserLotteryRewardCache,cache,{userID})
				}
				return cache
			})
		})
	}
	export async function doLottery(userID:number) {
		let item = await new Promise<LoginLobbyDefine.tLotteryItem>(async (resolve,reject)=>{
			await getLottery(userID,async (lottery)=>{
				if(lottery.count >= lottery.maxCount) {
					resolve(null)
					return false 
				}	
				let config = <LoginLobbyDefine.tLotteryConfig>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLottery,true)
				let control = <LoginLobbyDefine.tLotteryControl>await redis.hget(DBDefine.rTableConfigLobby,DBDefine.keyConfigLotteryControl,true)
				let items = config.items.slice()
				let targetItems:LoginLobbyDefine.tLotteryItem[] = []
				if(control.items) {
					for(let cItem of control.items) {
						let item = items[cItem.idx]
						if(!item) {
							continue 
						}
						if(!cItem.enabled) {
							items.splice(cItem.idx,1)
							continue 
						}
						if(cItem.powerOffset) {
							item.power += cItem.powerOffset
						}
						if(cItem.targetUserIDs) {
							if(cItem.targetUserIDs.includes(userID)) {
								targetItems.push(item)
							} else {
								items.splice(cItem.idx,1)
							}
						}
					} 
				}
				if(items.length == 0) {
					resolve(null)
					return false 
				}
				let totalPower = items.reduce((n,v)=>n + v.power,0)
				let p = kdutils.intRandom(0,totalPower+1)
				let curp = 0
				let selItem:LoginLobbyDefine.tLotteryItem
				for(let item of items) {
					curp += item.power
					if(p <= curp) {
						selItem = item 
					}
				}
				lottery.count ++
				Rpc.center.call(kds.item.add,userID,selItem.itemID,selItem.count,ItemDefine.SerialType.Lobby_Lottery)
				resolve(selItem)
				return true 
			})
		})
		return item 
	}
	
	export async function createProcessAction_TargetStr(targetStr:string,userID?:number) {
		await db.insert(DBDefine.tableProcessAction,<LoginLobbyDefine.tProcessAction>{
			no:await IDUtils.getProcessActionID(),
			targetStr,
			userID,
		
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		})
	}

	export async function createProcessAction_RoomBill(bill:RoomDefine.BillData) {
		await db.insert(DBDefine.tableProcessAction,<LoginLobbyDefine.tProcessAction>{
			no:await IDUtils.getProcessActionID(),

			gameData:bill.gameData,
			bill,
		
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		})
	}
	export async function createProcessAction_FinalBill(finalBill:RoomDefine.BillData) {
		await db.insert(DBDefine.tableProcessAction,<LoginLobbyDefine.tProcessAction>{
			no:await IDUtils.getProcessActionID(),

			gameData:finalBill.gameData,
			finalBill,
		
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		})
	}

	export async function getUserCheckin(userID:number,lockFunc?:(checkin:LoginLobbyDefine.tUserCheckin)=>Promise<boolean>) {
		return await RedisLock.callInLock(RedisLock.Checkin(userID),10,async ()=>{
			let checkin:LoginLobbyDefine.tUserCheckin = await db.getSingle(DBDefine.tableUserCheckin,{userID})
			let monthDate = TimeDate.getFmtMoment("YYYY-MM")
			let today = TimeDate.getFmtMoment("YYYY-MM-DD")

			let changed = false 
			if(checkin) {
				if(checkin.curMonthDate != monthDate) {
					checkin.curMonthDate = monthDate
					checkin.curMonthDays = []
					changed = true 
				}
				if(checkin.nextDate != today && checkin.lastDate != today) {
					checkin.nextDate = today
					checkin.dayCount = 0
				}
			} else {
				checkin = {
					userID,dayCount:0,
					lastDate:null,
					nextDate:today,
					curMonthDate:monthDate,
					curMonthDays:[]
				}
				changed = true 
			}
			if(lockFunc) {
				try {
					let b = await lockFunc(checkin)
					changed = changed || b
				} catch (error) {
					Log.oth.error("getUserCheckin: call lock func",lockFunc,error)
				}
			}
			if(changed) {
				await db.updateOrInsert(DBDefine.tableUserCheckin,checkin,{userID})
			}
			return checkin
		})

	}

}