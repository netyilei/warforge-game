import { kdutils } from "kdweb-core/lib/utils";
import { UserDefine } from "../pp-base-define/UserDefine";
import { DB } from "./db";
import { UserFlagDefine } from "../pp-base-define/UserFlag";
import { RedisLock } from "./RedisLock";

let redis = DB.getRedis()

async function clearUserSrsNodeFlag(userID:number) {
	let curNodeName = await redis.hget(t_redisUserSrsNode,userID.toString())
	if(curNodeName) {
		redis.hdel(t_redisUserFlag + "_" + curNodeName,userID.toString())	
		redis.hdel(t_redisUserSrsNode,userID.toString())
	}
}

let t_redisUserSrsNode = "t_user_srs_node"
async function redis_setUserNodeName(userID:number,nodeName:string) {
	await clearUserSrsNodeFlag(userID)
	await redis.hset(t_redisUserSrsNode,userID.toString(),nodeName)
	await redis.hset(t_redisUserFlag + "_" + nodeName,userID.toString(),true)
	await redis_setUserFlag(userID,UserFlagDefine.OfflineTime,null)
}

async function redis_getUserNodeName(userID:number) {
	let ret:string = await redis.hget(t_redisUserSrsNode,userID.toString())
	return ret 
}

async function redis_getNodeAllUser(nodeName:string) {
	let obj = await redis.hgetall(t_redisUserFlag + "_" + nodeName) || {}
	let userIDs:number[] = []
	for(let key of Object.keys(obj)) {
		userIDs.push(Number.parseInt(key))
	}
	return userIDs
}

async function redis_removeUserNodeName(userID:number,nodeName?:string) {
	let curNodeName = await redis.hget(t_redisUserSrsNode,userID.toString())
	if(curNodeName) {
		if(nodeName) {
			if(curNodeName != nodeName) {
				return false 
			}
		}
		redis.hdel(t_redisUserFlag + "_" + curNodeName,userID.toString())	
		redis.hdel(t_redisUserSrsNode,userID.toString())
		await redis_setUserFlag(userID,UserFlagDefine.OfflineTime,kdutils.getMillionSecond())
	}
	return true 
}

async function redis_getUserNodeCount() {
	let count = await redis.hlen(t_redisUserSrsNode)
	return count 
}

async function redis_removeUserWithNodeName(nodeName:string) {
	let keys = await redis.hkeys(t_redisUserFlag + "_" + nodeName) || []
	for(let key of keys) {
		redis.hdel(t_redisUserSrsNode,key)
	}
	await redis.del(t_redisUserFlag + "_" + nodeName)
}

export const UserNodeStatus = {
	get:redis_getUserNodeName,
	set:redis_setUserNodeName,
	remove:redis_removeUserNodeName,
	removeNode:redis_removeUserWithNodeName,
	count:redis_getUserNodeCount,
	getNodeAll:redis_getNodeAllUser,
}


let t_redisUserFlag = "t_user_flag"
async function redis_getUserFlag(userID:number,flagName:string,dv?:any) {
	return await RedisLock.callInLock(RedisLock.UserFlag(userID,flagName),5,async ()=>{
		let mainKey = t_redisUserFlag + ":" + flagName
		let flagData:UserDefine.UserFlagData = await redis.hget(mainKey,userID.toString(),true)
		if(flagData == null) {
			return dv || null
		}
		return flagData.data
	})
}

async function redis_setUserFlag(userID:number,flagName:string,value:any) {
	return await RedisLock.callInLock(RedisLock.UserFlag(userID,flagName),5,async ()=>{
		let mainKey = t_redisUserFlag + ":" + flagName
		let flagData:UserDefine.UserFlagData = await redis.hget(mainKey,userID.toString(),true)
		if(flagData == null) {
			flagData = {
				userID:userID,
				data:null,
			}
		}
		flagData.data = value 
		await redis.hset(mainKey,userID.toString(),flagData,true)
		return true 
	})
}
async function redis_removeUserFlag(userID:number,flagName:string,prevValue?:any) {
	return await RedisLock.callInLock(RedisLock.UserFlag(userID,flagName),5,async ()=>{
		let mainKey = t_redisUserFlag + ":" + flagName
		let flagData:UserDefine.UserFlagData = await redis.hget(mainKey,userID.toString(),true)
		if(flagData == null) {
			return true 
		}
		if(prevValue != null && flagData.data != prevValue) {
			return false 
		}
		flagData.data = null 
		await redis.hset(mainKey,userID.toString(),flagData,true)
		return true 
	})
}
async function redis_clearUserFlags(userID:number) {
	await redis.hdel(t_redisUserFlag,userID.toString())
	return true 
}

async function redis_existUserFlags(userID:number,flagName:string) {
	return await RedisLock.callInLock(RedisLock.UserFlag(userID,flagName),5,async ()=>{
		let mainKey = t_redisUserFlag + ":" + flagName
		let flagData:UserDefine.UserFlagData = await redis.hget(mainKey,userID.toString(),true)
		return flagData ? true : false
	})
}

export const UserFlag = {
	get:redis_getUserFlag,
	set:redis_setUserFlag,
	remove:redis_removeUserFlag,
	clear:redis_clearUserFlags,
	exist:redis_existUserFlags,
}