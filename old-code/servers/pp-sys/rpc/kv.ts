import { kdutils } from "kdweb-core/lib/utils"
import { KVDefine } from "../../pp-base-define/KVDefine"
import { DB } from "../../src/db"
import { FindOneOptions} from "mongodb";
import { Log } from "../log";
import { DBDefine } from "../../pp-base-define/DBDefine";


let tableName = "t_common"
let redis = DB.getRedis()
let redis1 = DB.getRedis(1)
async function set(h:string,key:string,value:string) {
	await redis.hset(tableName,key,value)
	return true 
}

async function get(h:string,key:string) {
	return await redis.hget(tableName,key)
}

async function del(h:string,key:string) {
	return await redis.hdel(tableName,key)
}

namespace KV0 {
	export async function sett(h:string,tableName:string,key:string,value:string) {
		await redis.hset(tableName,key,value)
		return true 
	}
	
	export async function gett(h:string,tableName:string,key:string) {
		return await redis.hget(tableName,key)
	}
	
	export async function gettAll(h:string,tableName:string) {
		return await redis.hgetall(tableName)
	}
	
	export async function gettKeys(h:string,tableName:string) {
		return await redis.hkeys(tableName) || []
	}
	
	export async function delt(h:string,tableName:string,key:string) {
		return await redis.hdel(tableName,key)
	}
	
	export async function removet(h:string,tableName:string) {
		return await redis.del(tableName)
	}
}

namespace KV1 {
	export async function sett(h:string,tableName:string,key:string,value:string) {
		Log.oth.info('set',tableName,key,value);
		await redis1.hset(tableName,key,value)
		return true 
	}

	export async function gett(h:string,tableName:string,key:string) {
		return await redis1.hget(tableName,key)
	}

	export async function gettAll(h:string,tableName:string) {
		return await redis1.hgetall(tableName)
	}

	export async function gettKeys(h:string,tableName:string) {
		return await redis1.hkeys(tableName) || []
	}

	export async function delt(h:string,tableName:string,key:string) {
		return await redis1.hdel(tableName,key)
	}

	export async function removet(h:string,tableName:string) {
		return await redis1.del(tableName)
	}
}

let cTableName = "t_common_c"
let cCacheTableName = "t_common_c_cache"
async function c_get(h:string,key:string,tag:string) {
	let cached = await redis.hget(cCacheTableName,key)
	if(cached == tag) {
		return {
			changed:false,
			tag:tag,
		}
	}
	let data = await redis.hget(cTableName,key)
	let t:KVDefine.KVChangedData = {
		changed:true,
		data:data,
		tag:cached
	}
	return t 
}

async function c_set(h:string,key:string,value:string) {
	let time = kdutils.getMillionSecond()
	await redis.hset(cTableName,key,value)
	await redis.hset(cCacheTableName,key,time.toString())
	return true 
}

async function c_del(h:string,key:string) {
	await redis.hdel(cTableName,key)
	await redis.hdel(cCacheTableName,key)
	return true 
}

export let RpcKV = {
	set,
	get,
	del,

	sett:		KV0.sett,
	gett:		KV0.gett,
	gettAll:	KV0.gettAll,
	gettKeys:	KV0.gettKeys,
	delt:		KV0.delt,
	removet:	KV0.removet,
	cleart:		KV0.removet,
}

export let RpcKV1 = {
	sett:		KV1.sett,
	gett:		KV1.gett,
	gettAll:	KV1.gettAll,
	gettKeys:	KV1.gettKeys,
	delt:		KV1.delt,
	removet:	KV1.removet,
	cleart:		KV1.removet,
}

export let RpcChangedKV = {
	set:c_set,
	get:c_get,
	del:c_del
}
let db = DB.get()
async function m_insert(h:string,tableName:string,data:any) {
	return await db.insert(tableName,data)
}

async function m_get(h:string,tableName:string,index:any) {
	return await db.get(tableName,index)
}

async function m_getOption(h:string,tableName:string,index:any,opt:FindOneOptions) {
	return await db.getOption(tableName,index,opt)
}

async function m_getSingle(h:string,tableName:string,index:any) {
	return await db.getSingle(tableName,index)
}

async function m_getCount(h:string,tableName:string,index:any,opt?:FindOneOptions) {
	let cursor = await db.getCursor(tableName,index,opt)
	return cursor.entity.count()
}

async function m_update(h:string,tableName:string,index:any,data:any) {
	return await db.update(tableName,index,data)
}

async function m_updateOrInsert(h:string,tableName:string,data:any,index:any) {
	return await db.updateOrInsert(tableName,data,index)
}

async function m_delete(h:string,tableName:string,index:any) {
	return await db.delMany(tableName,index)
}

async function m_aggregate(h:string,tableName:string,pipelines:any[]) {
	return await db.aggregate(tableName,pipelines)
}

export let RpcMongoKV = {
	insert:m_insert,
	get:m_get,
	getOption:m_getOption,
	getSingle:m_getSingle,
	getCount:m_getCount,
	update:m_update,
	updateOrInsert:m_updateOrInsert,
	delete:m_delete,
	aggregate:m_aggregate,
}

async function count_step(h:string,tableName:string,key:string,count?:number) {
	count = count || 1
	return await redis.hincrby(tableName,key,count)
}

async function count_get(h:string,tableName:string,key:string) {
	let str = await redis.hget(tableName,key)
	if(str) {
		let n = Number.parseInt(str)
		if(Number.isNaN(n)) {
			return 0
		}
		return n 
	}
	return 0
}

async function count_delete(h:string,tableName:string,key:string) {
	await redis.hdel(tableName,key)
}

async function count_clear(h:string,tableName:string) {
	await redis.del(tableName)
}


async function count_getAll(h:string,tableName:string) {
	return await redis.hgetall(tableName)
}
export let RpcStepKV = {
	step:count_step,
	get:count_get,
	getAll:count_getAll,
	delete:count_delete,
	remove:count_clear,
	clear:count_clear,
}