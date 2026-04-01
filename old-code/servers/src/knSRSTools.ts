import { kdreq } from "kdweb-core/lib/service/req";
import { SrsDefine } from "../pp-base-define/SrsDefine";
import { DB } from "./db";


let redis = DB.getRedis()
export namespace knSRSTools {
	export async function sendToUser(userID:number,msgName:string,data:any) {
		let srsNodeName = await redis.hget(SrsDefine.Redis.tableUserSrsNode,String(userID))
		if(!srsNodeName) {
			return false 
		}
		let nodeConfig:SrsDefine.Redis.tSrsNodeMap = await redis.hget(SrsDefine.Redis.tableSrsNodeMap,srsNodeName,true)
		if(!nodeConfig) {
			return false 
		}
		let url = nodeConfig.layerConfig.httpHost + SrsDefine.Http.Layer.pathSendToUser
		let t:SrsDefine.Http.Layer.tSendToUserReq = {
			userID,
			msg:{
				name:msgName,
				data:data,
			}
		}
		let res = await kdreq.postJson(url,t)
		if(res.body) {
			let t:SrsDefine.Http.Layer.tSendToUserRes = res.body
			if(t.code == "success") {
				return true 
			}
		}
		return false 
	}
	export async function sendDCN(dkey:string,data:any,filterUserIDs:number[]) {
		return false 
	}
}