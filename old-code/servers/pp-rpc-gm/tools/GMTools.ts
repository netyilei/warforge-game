import { kdutils } from "kdweb-core/lib/utils"
import { DB } from "../../src/db"
import md5 = require("md5")
import { DBDefine } from "../../pp-base-define/DBDefine"
import { Rpc } from "../rpc"
import { kds } from "../../pp-base-define/GlobalMethods"

let db = DB.get()
let redis = DB.getRedis()
let adminTablename = DBDefine.tableGMAdminUsers
export namespace GMTools {
	
	type AKData = {
		userID:number,
		timestamp:number,
	}
	export async function createAK(userID:number) {
		let ak = md5(userID + "|" + kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,10000))
		let prev = await redis.hget("t_admin_ak",String(userID),false)
		if(prev) {
			await redis.hdel("t_admin_ak",prev)
		}
		await redis.hset("t_admin_ak",String(userID),ak,false)
		await redis.hset("t_admin_ak",ak,<AKData>{
			userID,
			timestamp:kdutils.getMillionSecond(),
		},true)
		return {
			ak,
		}
	}

	export async function parseAK(ak:string) {
		return <AKData>await redis.hget("t_admin_ak",ak,true)
	}

	export type tAdmin = {
		adminUserID:number,
		account:string,
		pwdMD5:string,
	}
	export async function getAdmin(accountOrUserID:string | number):Promise<tAdmin> {
		if(typeof(accountOrUserID) == "string") {
			return await db.getSingle(adminTablename,{account:accountOrUserID})
		}
		return await db.getSingle(adminTablename,{adminUserID:accountOrUserID})
	}

	export async function newAdmin(account:string,pwdMD5:string) {
		if(await getAdmin(account)) {
			return false
		}
		let admin:tAdmin = {
			adminUserID:await Rpc.center.callException(kds.sys.id.get,"gm-id",10000,1),
			account,
			pwdMD5,
		}
		await db.insert(adminTablename,admin)
		return true 
	}

	export async function updateAdmin(admin:tAdmin) {
		await db.update(adminTablename,{adminUserID:admin.adminUserID},admin)
	}
}