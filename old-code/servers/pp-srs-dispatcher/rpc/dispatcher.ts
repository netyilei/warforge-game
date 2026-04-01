import { kdreq } from "kdweb-core/lib/service/req"
import { SrsDefine } from "../../pp-base-define/SrsDefine"
import { DB } from "../../src/db"
import { Log } from "../log"

let redis = DB.getRedis()
async function sendToUser(h:string,userID:number,msgName:string,data:any) {
	let srsNodeName = await redis.hget(SrsDefine.Redis.tableUserSrsNode,String(userID))
	if(srsNodeName) {
		let info:SrsDefine.Redis.tSrsNodeMap = await redis.hget(SrsDefine.Redis.tableSrsNodeMap,srsNodeName,true)
		if(!info) {
			return false 
		}
		let url = info.layerConfig.httpHost + SrsDefine.Http.Layer.pathSendToUser
		let t:SrsDefine.Http.Layer.tSendToUserReq = {
			userID,
			msg:{
				name:msgName,
				data:data,
			}
		}
		Log.oth.info("send req to url = " + url,t)
		let res = await kdreq.postJson(url,t)
		Log.oth.info("",res)
		if(res.body) {
			let t:SrsDefine.Http.Layer.tSendToUserRes = res.body
			if(t.code == "success") {
				return true 
			}
		}
	}
	return false 
}

async function sendToDevice(h:string,deviceID:string,msgName:string,data:any) {
	let srsNodeName = await redis.hget(SrsDefine.Redis.tableDeviceSrsNode,String(deviceID))
	if(srsNodeName) {
		let info:SrsDefine.Redis.tSrsNodeMap = await redis.hget(SrsDefine.Redis.tableSrsNodeMap,srsNodeName,true)
		if(!info) {
			return false 
		}
		let url = info.layerConfig.httpHost + SrsDefine.Http.Layer.pathSendToDevice
		let t:SrsDefine.Http.Layer.tSendToDeviceReq = {
			deviceID,
			msg:{
				name:msgName,
				data:data,
			}
		}
		Log.oth.info("send req to url = " + url,t)
		let res = await kdreq.postJson(url,t)
		Log.oth.info("",res.body)
		if(res.body) {
			let t:SrsDefine.Http.Layer.tSendToDeviceRes = res.body
			if(t.code == "success") {
				return true 
			}
		}
	}
	return false 
}

export let RpcSRSDispatcher = {
	sendToUser,
	sendToDevice,
}