import { mongoDB } from "kdweb-core/lib/mongo/controller";
import { redisDB } from "kdweb-core/lib/redis/controller";
import { DBDefine } from "../pp-base-define/DBDefine";
import { ServerValues, ServerConfig } from "../pp-base-define/ServerConfig";
import { kdlock } from "kdweb-core/lib/tools/lock"

let dbs = new Map<string,mongoDB>()
let dbOrigins = new Map<string,mongoDB>()
let dbSecs = new Map<string,mongoDB>()
let dbOriginSecs = new Map<string,mongoDB>()
let dbConfigs = new Map<string,mongoDB>()
let dbName = DBDefine.db
export namespace DB {
	export function get(tag?:string) {
		tag = tag || dbName
		if(dbs.has(tag)) {
			return dbs.get(tag)
		}
		let db = new mongoDB(dbName,ServerValues.dbConnectStr)
		db.originDBName = ServerValues.dbName
		dbs.set(tag,db)
		return db
	}
	export function getOrigin(tag?:string) {
		tag = tag || dbName
		if(dbOrigins.has(tag)) {
			return dbOrigins.get(tag)
		}
		let db = new mongoDB(dbName,ServerValues.dbConnectStr)
		dbOrigins.set(tag,db)
		return db
	}

	export function getSec(tag?:string) {
		tag = tag || dbName
		if(dbSecs.has(tag)) {
			return dbSecs.get(tag)
		}
		let db = new mongoDB(dbName,ServerValues.dbSecConnectStr)
		db.originDBName = ServerValues.dbName
		dbSecs.set(tag,db)
		return db
	}
	export function getOriginSec(tag?:string) {
		tag = tag || dbName
		if(dbOriginSecs.has(tag)) {
			return dbOriginSecs.get(tag)
		}
		let db = new mongoDB(dbName,ServerValues.dbSecConnectStr)
		dbOriginSecs.set(tag,db)
		return db
	}
	export function getExternal(dbName:string,dbConnectStr:string) {
		let db = new mongoDB(dbName,dbConnectStr)
		return db
	}
	export type RedisConfigType = {
		host:string,
		port:number,
		auth:string,
		idx:number,
	}
	export function getRedis(idx?:number) {
		let redisConfig:RedisConfigType = ServerConfig.getValue("redis")
		return new redisDB(redisConfig.host,redisConfig.port,redisConfig.auth,idx != null ? idx : redisConfig.idx)
	}

	let initedKDGlobal = false 
	export function initKDGlobal() {
		if(initedKDGlobal) {
			return 
		}
		kdlock.iniLockEnv(getRedis())
		initedKDGlobal = true 
	}
}