
import { kdasync } from "kdweb-core/lib/tools/async"
import { kdutils } from "kdweb-core/lib/utils"
import { Config } from "../config"
import { Log } from "../log"
import { CodeHelper } from "../entity/CodeHelper_redis"
async function getCode(h:string,maxLength?:number,name?:string) {
	if(kdutils.isValid(name,"string") == false) {
		Log.oth.info("[rpc] getCode: name invalid = " + name)
		return null
	}
	if(kdutils.isValid(maxLength,"number") == false) {
		Log.oth.info("[rpc] getCode: maxLength type invalid name = " + name + " | maxLength = " + maxLength)
		return null
	}
	if(maxLength < 1) {
		Log.oth.info("[rpc] getCode: maxLength invalid name = " + name + " | maxLength = " + maxLength)
		return null
	}
	return await CodeHelper.getCode(name,maxLength)
}

async function releaseCode(h:string,code:string,maxLength?:number,name?:string) {
	if(kdutils.isValid(name,"string") == false) {
		Log.oth.info("[rpc] releaseCode: name invalid = " + name)
		return false
	}
	if(kdutils.isValid(maxLength,"number") == false) {
		Log.oth.info("[rpc] releaseCode: maxLength type invalid name = " + name + " | maxLength = " + maxLength)
		return false
	}
	if(maxLength < 1) {
		Log.oth.info("[rpc] releaseCode: maxLength invalid name = " + name + " | maxLength = " + maxLength)
		return false
	}
	return await CodeHelper.releaseCode(name,code,maxLength)
}

async function useCode(h:string,code:string,maxLength:number,name?:string) {
	return await CodeHelper.useCode(name,code,maxLength)
}

export let RpcCode = {
	get:getCode,
	release:releaseCode,
	use:useCode,
}

async function room_getCode(h:string) {
	return await getCode(h,6,"room")
}

async function room_releaseCode(h:string,code:string) {
	return await releaseCode(h,code,6,"room")
}

async function room_useCode(h:string,code:string) {
	return await useCode(h,code,6,"room")
}

export let RpcRoomCode = {
	get:room_getCode,
	release:room_releaseCode,
	use:room_useCode,
}