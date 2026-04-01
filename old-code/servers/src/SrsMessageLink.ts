import { kdutils } from "kdweb-core/lib/utils";
import { DB } from "./db";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";


let redis = DB.getRedis()
let tableName = "t_srs_message_link"
export namespace SrsMessageLink {
	export type tLinkCallData = {
		userID:number,
		msgName:string,
		data:any,

		fromNodeName:string,
	}

	let cacheMap = new Map<string,{method:string,expireTime:number}>()

	let inited = false 
	let rpc:knRpcManagerInterface.rpc
	export function initLink(inputRpc?:knRpcManagerInterface.rpc) {
		if(inited) {
			return 
		}
		rpc = inputRpc
		inited = true 
		setInterval(()=>{
			let delKeys:string[] = []
			let time = kdutils.getMillionSecond()
			for(let key of cacheMap.keys()) {
				let info = cacheMap.get(key)
				if(info && info.expireTime > 0 && time >= info.expireTime) {
					delKeys.push(key)
				}
			}
			for(let key of delKeys) {
				cacheMap.delete(key)
			}
		},100)
	}
	export async function regLink(msgName:string,rpcMethodName:string) {
		await redis.hset(tableName,msgName,rpcMethodName,false)
	}

	export async function ifCall(userID:number,msgName:string,data:any,fromNodeName?:string) {
		if(!inited) {
			return false 
		}
		fromNodeName = fromNodeName || process.env.sname
		let info = cacheMap.get(msgName)
		if(!info) {
			let method = await redis.hget(tableName,msgName,false)
			info = {
				method,
				expireTime:method ? -1 : kdutils.getMillionSecond() + 10000, // 如果是null则10秒超时
			}
		} else if(!info.method) {
			return false 
		}

		rpc.call(info.method,<tLinkCallData>{
			userID,msgName,data,fromNodeName
		})
		return true 
	}
	
	export async function ifGetMethod(userID:number,msgName:string,data:any,fromNodeName?:string) {
		if(!inited) {
			return null 
		}
		fromNodeName = fromNodeName || process.env.sname
		let info = cacheMap.get(msgName)
		if(!info) {
			let method = await redis.hget(tableName,msgName,false)
			info = {
				method,
				expireTime:method ? -1 : kdutils.getMillionSecond() + 10000, // 如果是null则10秒超时
			}
			cacheMap.set(msgName,info)
		}
		return info.method
	}
}