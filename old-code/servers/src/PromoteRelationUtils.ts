import _ = require("underscore");
import { kdasync } from "kdweb-core/lib/tools/async";
import { RedisLock } from "./RedisLock";
import { UserDefine } from "../pp-base-define/UserDefine";
import { Log } from "../pp-rpc-center/log";
import { Module_UserRelation } from "../pp-base-define/DM_UserDefine";
import { LeaderDefine } from "../pp-base-define/LeaderDefine";
import { Module_UserBalance } from "../pp-base-define/DM_LeaderDefine";
import Decimal from "decimal.js";
import { ItemDefine, ItemID } from "../pp-base-define/ItemDefine";
import { GlobalUtils } from "./GlobalUtils";
import { RpcAccountItem } from "../pp-account/rpc/account";
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { kds } from "../pp-base-define/GlobalMethods";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { UserUtils } from "./UserUtils";


export namespace PromoteRelationUtils {
	export async function setLeader(userID:number,leaderUserID?:number) {
		return await runInLockQueue(async ()=>{
			if(userID == leaderUserID) {
				Log.oth.error("set leader 0")
				return false 
			}
			let relation = await getPromoteRelation(userID)
			if(!relation) {
				Log.oth.error("set leader 1")
				return false 
			}
			if(relation.leaders[0] == leaderUserID) {
				Log.oth.error("set leader 2")
				return false 
			}
			// 反向关系
			if(await isLeader(leaderUserID,userID,true)) {
				Log.oth.error("set leader 3")
				return false 
			}

			let newLeaderRelation:UserDefine.PromoteRelation
			if(leaderUserID) {
				newLeaderRelation = await getPromoteRelation(leaderUserID)
				if(!newLeaderRelation) {
					Log.oth.error("set leader 4")
					return false 
				}
			}

			let allSubs = await getSubs(userID,true) || []

			// 清理之前的关系
			let oldLeaderRelation:UserDefine.PromoteRelation
			if(relation.leaders.length > 0) {
				oldLeaderRelation = await getPromoteRelation(relation.leaders[0])
				if(!oldLeaderRelation) {
					Log.oth.error("set leader 5")
					return false 
				}
			}
			relation.leaders = []
			if(oldLeaderRelation) {
				let idx = oldLeaderRelation.subs.findIndex(v=>v == userID)
				if(idx >= 0) {
					oldLeaderRelation.subs.splice(idx,1)
				}
				await saveRelation(oldLeaderRelation)
			}

			// 去掉所有下级从自己开始的上级链条
			let subRelations = await getPromoteRelations(allSubs)
			{
				let ps = []
				for(let subRelation of subRelations) {
					let idx = subRelation.leaders.indexOf(userID)
					if(idx >= 0) {
						subRelation.leaders.splice(idx+1)
						if(!leaderUserID) {
							ps.push(
								saveRelation(subRelation)
							)
						}
					}
				}
				if(ps.length > 0) {
					await Promise.all(ps)
				}
			}

			if(!leaderUserID) {
				await saveRelation(relation)
				return true 
			}
			newLeaderRelation.subs.push(userID)
			await saveRelation(newLeaderRelation)
			
			if(!relation) {
				relation = {
					userID,
					level:0,
					leaders:[],
					subs:[],
				}
			}
			relation.leaders.push(leaderUserID)
			relation.leaders.push.apply(relation.leaders,newLeaderRelation.leaders)
			{
				let ps = []
				for(let subRelation of subRelations) {
					subRelation.leaders.push.apply(subRelation.leaders,relation.leaders)
					ps.push(
						saveRelation(subRelation)
					)
				}
				if(ps.length > 0) {
					await Promise.all(ps)
				}
			}
			await saveRelation(relation)
			return true 
		})
	}


	export async function callInLock<T>(func:()=>Promise<T>) {
		return await RedisLock.callInLock(RedisLock.PromoteRelation(),10,func)
	}

	let q:kdasync.queue = new kdasync.queue
	export async function runInLockQueue<T>(func:()=>Promise<T>) {
		return new Promise<T>(async (resolve,reject)=>{
			// q.call(async ()=>{
				resolve(await callInLock(func))
			// })
		})
	}
	export async function saveRelation(relation:UserDefine.PromoteRelation) {
		await Module_UserRelation.updateOrInsert(relation)
		await UserUtils.rebuildSearch(relation.userID)
	}


	export async function getPromoteRelation(userID:number) {
		return await Module_UserRelation.getMain(userID)
	}
	export async function getPromoteRelations(userIDs:number[]) {
		return await Module_UserRelation.get({userID:{$in:userIDs}})
	}
	/**
	 * 
	 * @param userID 
	 * @param leaderUserID 
	 * @param deep 是否处于关系链中
	 */
	export async function isLeader(userID:number,leaderUserID:number,deep?:boolean) {
		let relation = await getPromoteRelation(userID)
		if(!relation) {
			return false 
		}
		if(relation.leaders[0] == leaderUserID) {
			return true 
		}
		if(!deep) {
			return false 
		}
		if(relation && relation.leaders.includes(leaderUserID)) {
			return true 
		}
		return false 
	}

	/**
	 * 
	 * @param userID 
	 * @param nearToFar true - 由近及远 false - 由远及近
	 * @returns 
	 */
	export async function getLeaders(userID:number,nearToFar?:boolean) {
		let relation = await getPromoteRelation(userID)
		if(relation) {
			return nearToFar ? relation.leaders : relation.leaders.reverse()
		}
		return []
	}

	/**
	 * 
	 * @param userID 
	 * @param deep 是否全部下级 false - 直接下级
	 */
	export async function getSubs(userID:number,deep?:boolean) {
		if(deep) {
			let relations:UserDefine.PromoteRelation[] = 
			await Module_UserRelation.get({
				userID:{$ne:userID},
				leaders:userID
			}) || []
			let userIDs:number[] = []
			for(let relation of relations) {
				userIDs.push(relation.userID)
				userIDs.push.apply(userIDs,relation.subs || [])
			}
			return _.uniq(userIDs)
		}
		let relation = await getPromoteRelation(userID)
		if(relation) {
			return relation.subs
		}
		return []
	}

	export async function addBalance(userID:number,itemID:string,values:Partial<Pick<LeaderDefine.tBalance,
		"exceptionValue"
		| "rewardValue"
		| "totalCharge"
		| "totalWithdraw"
		| "water"
		| "win"
		| "lose"
	>>,reason?:string) {
		itemID = itemID || ItemID.Gold
		let keys = Object.keys(values)
		if(keys.length == 0) {
			return true 
		}
		let decimalValues:{[key:string]:Decimal} = {}
		for(let key of keys) {
			let v = values[key]
			decimalValues[key] = new Decimal(v)
		}
		reason = reason ? ("addBalance:" + reason+ ":" + userID) : ("addBalance:"+userID)
		let balance = await Module_UserBalance.searchLockedSingleData(userID,null,reason,(userID)=>{
			return {
				userID,
				itemID:itemID,
				value:"0",
				exceptionValue:"0",
				rewardValue:"0",
				totalCharge:"0",
				totalWithdraw:"0",
				water:"0",
				win:"0",
				lose:"0",
			}
		})
		try {
			for(let key of keys) {
				let v = decimalValues[key]
				let oldValue = new Decimal(balance.data[key] || "0")
				oldValue = oldValue.add(v)
				balance.data[key] = oldValue.toString()
			}
			await balance.saveAndRelease()
		} catch (error) {
			Log.oth.error("add balance error userID = " + userID,error)
		} finally {
			await balance.release()
		}
		return true
	}

	export async function reportCharge(userID:number,itemID:string,charge:string,rpc:knRpcManagerInterface.rpc) {
		let relation = await getPromoteRelation(userID)
		if(relation && relation.leaders.length > 0) {
			let proxyCharge = await GlobalUtils.getProxyChargeReward(relation.leaders[0])
			let config = await GlobalUtils.getGlobalChargeReward()
			let leader = relation.leaders[0]
			let itemCharge = proxyCharge?.charges?.find(v=>v.itemID == itemID) || config.charges.find(v=>v.itemID == itemID)
			if(itemCharge) {
				let percent = itemCharge.chargeLeaderPercent
				if(percent > 0) {
					let chargeDecimal = new Decimal(charge)
					let minCharge = new Decimal(itemCharge.minChargeValue || "0")
					let maxCharge = new Decimal(itemCharge.maxChargeValue || "0")
					if((minCharge.lessThanOrEqualTo(0) || chargeDecimal.greaterThanOrEqualTo(minCharge))
						&& (maxCharge.lessThanOrEqualTo(0) || chargeDecimal.lessThanOrEqualTo(maxCharge))) {

						let rewardValue = GlobalUtils.roundDown(chargeDecimal.mul(percent).div(100))
						rpc.call(kds.item.add,leader,itemID,rewardValue.toString(),ItemDefine.SerialType.ChargeReward,{
							fromUserID:userID,
						})
						await addBalance(leader,itemID,{
							rewardValue:rewardValue.toString(),
						},"promote relation reward from userID:" + userID)
						return true 
					}
				}
			}
		}
		return false 
	}
}