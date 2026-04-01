import { kdaccess } from "kdweb-core/lib/tools/access"
import { DB } from "./db"
import { kdutils } from "kdweb-core/lib/utils"
import { LoginLobbyDefine } from "../pp-base-define/LoginLobbyDefine"
import md5 = require("md5")

let access = new kdaccess.redisEntity(DB.getRedis(),"t_access")
async function createAK(userID:number,serverToken:string) {
	let str = userID + "|" + (serverToken || "none")
	let ak = await access.createToken(str)
	return ak 
}

async function verify(ak:string) {
	let str = await access.getId(ak)
	if(str == null) {
		return null
	}
	let arr = str.split("|")
	if(arr.length != 2) {
		return null 
	}
	let userID = Number.parseInt(arr[0])
	let sk = arr[1]
	let ret:LoginLobbyDefine.AKUserInfo = {
		userID:userID,
		sk:sk
	}
	return ret 
}

async function createSK(str:string) {
	let s = str + "TIME" + kdutils.getMillionSecond()
	return md5(s)
}

export const UserAccess = {
	createAK,
	verify,
	createSK
}