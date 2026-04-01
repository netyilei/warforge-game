import md5 = require("md5")
import { kdutils } from "kdweb-core/lib/utils";
import { DB } from "./db";
import { kdmodule } from "kdweb-core/lib/mongo/model";
import _ = require("underscore");
import { RedisLock } from "./RedisLock";

type tLeaderTag = {
	code:string,
	userID:number,
	timestamp:number,
}
export const Module_LeaderInviteTag = new kdmodule.database<tLeaderTag>({
	db:DB.get(),mainIndexName:"code",useMongoIDForIndex:true,indexes:{code:1},autoCreateIndexes:false,
	lockTable:true,
	tableName:"t_leader_tag_defines",
	kvChangeTableName:"t_leader_tag_defines_changed"
})

export namespace LeaderHelper {
	let redis = DB.getRedis()
	let tagDict = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	export async function createTag(userID:number) {
		return await RedisLock.callInLock("LeaderHelper_CreateTag",10,async ()=>{
			let tag = await redis.hget("t_leader_tag",String(userID),false)
			if(tag) {
				return tag 
			}
			tag = ""
			while(true) {
				for(let i = 0 ; i < 8 ; i++) {
					tag += tagDict[kdutils.intRandom(0,tagDict.length)]
				}
				// let exist = await Module_LeaderInviteTag.getSingle({code:tag})
				let exist = !!await redis.hget("t_leader_tag",tag,false)
				if(!exist) {
					break 
				}
			}
			await Module_LeaderInviteTag.insert({
				code:tag,
				userID:userID,
				timestamp:kdutils.getMillionSecond(),
			})
			
			// tag = md5(userID + "|" + kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,10000))
			await redis.hset("t_leader_tag",String(userID),tag)
			await redis.hset("t_leader_tag",tag,String(userID))
			return tag 
		})
	}

	export async function getLeaderByTag(tag:string) {
		let userID = Number.parseInt(tag)
		if(!Number.isNaN(userID) && String(userID) == tag) {
			return userID
		}
		let str = await redis.hget("t_leader_tag",tag)
		if(str) {
			return Number.parseInt(str)
		}
		return null 
	}

	export async function initTagDB() {
		await Module_LeaderInviteTag.checkAndCreateIndexes()
	}
}