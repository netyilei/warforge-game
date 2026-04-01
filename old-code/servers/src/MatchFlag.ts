import { DB } from "./db";
import { RedisLock } from "./RedisLock";

let redis = DB.getRedis()
export namespace MatchFlag {
    function TagTablename(tag:string) {
		return "t_match_flag:" + tag
	}
    export async function getMatch(userID:number){
		let flagName = "users"
		let mainKey = TagTablename(flagName)
		let flagData:{matchList:number[]}= await redis.hget(mainKey,userID.toString(),true)
		if(!flagData) {
			return []
		}
		return flagData.matchList
	}
	export async function joinMatch(userID:number,matchID:number){
		let flagName = "users"
		return await RedisLock.callInLock(RedisLock.MatchFlag(userID,flagName),5,async ()=>{
			let mainKey = TagTablename(flagName)
			let flagData:{matchList:number[]}= await redis.hget(mainKey,userID.toString(),true)
			if(!flagData) {
				flagData = {
					matchList:[]
				}
			}
			if(flagData.matchList.indexOf(matchID) == -1) {
				flagData.matchList.push(matchID)
			}
			await redis.hset(mainKey,userID.toString(),flagData,true)
			return true 
		})
    }

	export async function exitMatch(userID:number,matchID:number) {
		let flagName = "users"
		return await RedisLock.callInLock(RedisLock.MatchFlag(userID,flagName),5,async ()=>{
			let mainKey = TagTablename(flagName)
			let flagData:{matchList:number[]}= await redis.hget(mainKey,userID.toString(),true)
			if(!flagData) {
				return false
			}
			let index = flagData.matchList.indexOf(matchID)
			if(index == -1) {
				return false
			}else{
				flagData.matchList.splice(index,1)
			}
			await redis.hset(mainKey,userID.toString(),flagData,true)
			return true 
		})
    }

	export async function clearMatchFlag(userID:number) {
		let flagName = "users"
		return await RedisLock.callInLock(RedisLock.MatchFlag(userID,flagName),5,async ()=>{
			let mainKey = TagTablename(flagName)
			await redis.hdel(mainKey,userID.toString())
			return true 
		})
	}
}