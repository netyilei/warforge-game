import { UserDefine } from "../../pp-base-define/UserDefine"
import { DB } from "../../src/db"

let bindTablename = "t_user_bind"
let bindReverseTablename = "t_user_bind_reverse"
let redis = DB.getRedis()
async function getUserIDByBind(h:string,bindType:string,bindStr:string) {
	let key = bindType + "_" + bindStr
	let str = await redis.hget(bindTablename,key)
	if(str) {
		return Number.parseInt(str)
	}
	return null
}

async function setUserBind(h:string,userID:number,bindType:string,bindStr:string) {
	let key = bindType + "_" + bindStr
	await redis.hset(bindTablename,key,userID.toString())
	let data:UserDefine.Bind.DataType = await redis.hget(bindReverseTablename,userID.toString(),true)
	if(!data) {
		data = {
			infos:[],
		}
	}
	let info = data.infos.find(v=>v.type == bindType)
	if(!info) {
		data.infos.push({
			type:bindType,
			content:bindStr,
		})
	} else {
		info.type = bindType
		info.content = bindStr
	}
	await redis.hset(bindReverseTablename,userID.toString(),data,true)
}

async function getBindInfos(h:string,userID) {
	return await redis.hget(bindReverseTablename,userID.toString(),true)
}

export let RcpUserBindRedis = {
	get:getUserIDByBind,
	set:setUserBind,

	getBindInfos:getBindInfos,
}
