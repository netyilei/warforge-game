
import { kdasync } from "kdweb-core/lib/tools/async"
import { kdutils } from "kdweb-core/lib/utils"
import { kdinterval } from "kdweb-core/lib/tools/interval"
import { DB } from "../../src/db"
import { ServerValues } from "../../pp-base-define/ServerConfig"
import { Log } from "../log"


let idQueue = new Map<string,kdasync.queue>()
type idCacheType = {
	name:string,
	id:number,
	step:number,
}
// type idCacheType = {
// 	ids:{
// 		name:string,
// 		id:number,
// 		step:number,
// 	}[],

// 	_idx:number,
// }
// let idCache:idCacheType = {
// 	ids:[],

// 	_idx:1,
// }
// let ready = false 

// let cacheDirty = false;
// let cacheSaving = false;
// db.get(tableName,{})
// .then(async function(results) {
// 	if(results != null && results.length > 0) {
// 		Log.oth.info("init db success ",results)
// 		idCache = results[0]
// 	} else {
// 		cacheSaving = true
// 		await db.insert(tableName,idCache)
// 		cacheSaving = false 
// 	}
// 	ready = true 
// })
// let worker = new kdinterval.lambda(1000,async function() {
// 	if(cacheSaving) {
// 		return 
// 	}
// 	if(cacheDirty) {
// 		cacheDirty = false 

// 		cacheSaving = true 
// 		await db.update(tableName,{},idCache)
// 		cacheSaving = false 
// 	}
// },false)

let redis = DB.getRedis()
async function getId(h:string,name:string,fromId?:number,step?:number) {
	if(!kdutils.isValid(name,"string")) {
		return -1 
	}
	let q = idQueue.get(name)
	if(!q) {
		Log.oth.info("create create queue name = " + name)
		q = new kdasync.queue()
		idQueue.set(name,q)
	}
	return await (new Promise<number>(function(resolve,reject) {
		q.call(async function() {
			Log.oth.info("start q " + name)
			let n = await _getId(name,fromId,step)
			Log.oth.info("end q " + name)
			resolve(n)
		})
	}))
}

let redisParentName = "access:ids"
async function _getId(name:string,fromId?:number,step?:number) {
	if(step == null) {
		step = 1
	}
	if(fromId == null) {
		fromId = 1000000
	}
	let cache:idCacheType = await redis.hget(redisParentName,name,true)
	if(cache == null) {
		console.log("new cache ")
		cache = {
			name:name,
			id:fromId,
			step:step,
		}
		//idCache.ids.push(cache)
		//await DB.redis.hset(redisParentName,name,true)
	}
	cache.id = cache.id + cache.step
	await redis.hset(redisParentName,name,cache,true)

	//await kdasync.timeout(100)
	return cache.id
}

export let RpcIdsGroup = {
	get:getId,
}