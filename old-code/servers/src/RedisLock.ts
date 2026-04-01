import { kdutils } from "kdweb-core/lib/utils"
import { DB } from "./db"
import { Log } from "../pp-rpc-center/log"
import { kdasync } from "kdweb-core/lib/tools/async"
import md5 = require("md5")
import uuid = require("uuid")

const releaseLockLuaScripts = `
if redis.call("GET",KEYS[1]) == ARGV[1]
then
    return redis.call("DEL",KEYS[1])
else
    return 0
end
`
let redis = DB.getRedis(1)
export class RedisLock {
	constructor(lockName:string,timeoutSec?:number) {
		this.lockName_ = lockName
		this.timeoutSec_ = timeoutSec || 10
	}
	private lockName_:string = null 
	get lockName() {
		return this.lockName_
	}
	set lockName(v) {
		this.lockName_ = v
	}

	private timeoutSec_:number = null 
	get timeoutSec() {
		return this.timeoutSec_
	}
	set timeoutSec(v) {
		this.timeoutSec_ = v
	}
	
	createUUID() {
		return RedisLock.createUUID()
	}
	createMD5ID() {
		return RedisLock.createMD5ID()
	}
	
	public static createUUID() {
		return uuid.v1()
	}
	public static createMD5ID() {
		return md5(this.createUUID() + "|RAND:" + kdutils.intRandom(1,1000000) + "|TIME:" + kdutils.getMillionSecond())
	}

	private locked_ = false 
	get isLocked() {
		return this.locked_
	}
	
	private lockUUID_ = RedisLock.createMD5ID()
	async lock() {
		if(this.locked_) {
			return true 
		}
		return new Promise<boolean>(async (resolve,reject)=>{
			let timeoutMS = this.timeoutSec * 1000
			let starTime = kdutils.getMillionSecond()
			while(kdutils.getMillionSecond() - starTime < timeoutMS) {
				let b = await new Promise<boolean>((resolve,reject)=>{
					let instance = redis.instance
					instance.set.apply(instance,[[
						this.lockName,
						this.lockUUID_,
						"EX",
						this.timeoutSec,
						"NX"
					],(err,ret)=>{
						Log.oth.info("lock " + this.lockName + " uuid = " + this.lockUUID_,ret,err)
						if(ret == "OK") {
							resolve(true)
						} else {
							resolve(false)
						}
					}])
				})
				if(b) {
					this.locked_ = true 
					resolve(true)
					return 
				}
				Log.oth.info("lock failed " + this.lockName + " wait 50ms retry")
				await kdasync.timeout(50)
			}
			resolve(false)
		})
	}

	async releaseLock() {
		if(!this.locked_) {
			return 
		}
		return new Promise<void>((resolve,reject)=>{
			let instance = redis.instance
			instance.eval(releaseLockLuaScripts,1,this.lockName,this.lockUUID_,(err,ret)=>{
				Log.oth.info("releaseLock " + this.lockName + " uuid = " + this.lockUUID_,ret,err)
				resolve()
			})
			this.locked_ = false 
		})
	}

	async runInLock(func:(...args)=>Promise<any>) {
		let b = await this.lock()
		if(!b) {
			return false 
		}
		try {
			await func()
		} catch (error) {
			Log.oth.error("runInLock error",error)
		}
		this.releaseLock()
		return true 
	}

	async check() {
		let uuid = await redis.get(this.lockName)
		if(!uuid) {
			return RedisLock.CheckStatus.None
		}
		return uuid == this.lockUUID_ ? RedisLock.CheckStatus.Locked_Self : RedisLock.CheckStatus.Locked_Other
	}

	static async check(lockName:string) {
		let uuid = await redis.get(lockName)
		if(!uuid) {
			return RedisLock.CheckStatus.None
		}
		return RedisLock.CheckStatus.Locked_Other
	}

	static async callInLock<T>(lockName:string,timeoutSec:number,func:()=>Promise<T>):Promise<T> {
		let lock = new RedisLock(lockName,timeoutSec)
		let ret = await new Promise<T>(async (resolve,reject)=>{
			let b = await lock.runInLock(async ()=>{
				try {
					let ret:T = await func()
					resolve(ret)	
					return 
				} catch (error) {
					Log.oth.error("callInLock failed lockName = " + lockName,error)					
					reject(error)
					return 
				}
			})
			if(!b) {
				Log.oth.error("callInLock failed lock failed lockName = " + lockName)
				reject(null)
				return 
			}
		})
		return ret 
	}
}

export namespace RedisLock {
	export enum CheckStatus {
		None,
		Locked_Other,
		Locked_Self,
	}
	export function SRSUserEnter(userID:number) {
		return "lock:srs:userEnter:" + userID
	}
	export function UserFlag(userID:number,flagName:string) {
		return "lock:user:flag:" + userID + "|" + flagName
	}
	export function MatchFlag(userID:number,flagName:string) {
		return "lock:match:flag:" + userID + "|" + flagName
	}
	export function ClubHookLooperLock(clubID:number) {
		return "lock:club:looper:" + clubID
	}
	export function ClubMember(clubID:number) {
		return "lock:club:member:" + clubID
	}
	export function ClubJoin(clubID:number) {
		return "lock:club:join:" + clubID
	}

	export function EnterGroup(userID:number) {
		return "lock:group:enter:" + userID
	}
	export function EnterMatch(userID:number) {
		return "lock:match:enter:" + userID
	}

	export function UserPlayAction(userID:Number) {
		return "lock:user:play:action:" + userID
	}
	export function PromoteRelation() {
		return "lock:user:promoterelation"
	}
	export function ChainReq(no:number) {
		return "lock:chainreq:" + no 
	}
	export function WithdrawReq(no:number) {
		return "lock:chainreq:" + no 
	}
	export function UserGetChargeConfig(userID:number) {
		return "lock:user:getchargetconfig:" + userID
	}
	export function SearchRobot() {
		return "lock:robot:searchrobot"
	}

	export function CreateCollectionTask() {
		return "lock:chain:createcollection"
	}

	// 机器人库存
	export function RobotStore() {
		return "lock:robot:store"
	}

	export function RobotStrategyTask(taskID:number) {
		return "lock:robot:strategy:task:" + taskID
	}

	export function Checkin(userID:number) {
		return "lock:checkin:" + userID
	}
	export function Lottery(userID:number) {
		return "lock:lottery:" + userID
	}
	export function LotteryGlobal() {
		return "lock:lottery:global"
	}
	export function UserActionGlobal() {
		return "lock:useraction:global"
	}
	export function UserAction(userID:number) {
		return "lock:useraction:" + userID
	}
	export function UserLotteryRewardCache(userID:number) {
		return "lock:lottery:rewardcache" + userID
	}
	export function UserLotteryRewardCacheGlobal() {
		return "lock:lottery:rewardcache:global"
	}

	export function MatchSignup(matchID:number) {
		return "lock:match:signup:" + matchID
	}
	export function MatchUserRuntimeGlobal(matchID:number) {
		return "lock:match:userruntime:global:" + matchID
	}
	export function UserCreateRoom(userID:number) {
		return "lock:user:createroom:" + userID
	}
	export function ReqWalletAddress(userID:number) {
		return "lock:user:reqwalletaddress:" + userID
	}
	export function ReqWithdrawMainAddress(tag:string) {
		return "lock:user:reqwithdrawmainaddress:" + tag
	}

	export function ChargeWithdraw(userID:number) {
		return "lock:charge:withdraw:" + userID
	}
}