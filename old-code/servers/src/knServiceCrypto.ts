import { baseService, lambdaAsyncService } from "kdweb-core/lib/service/base";
import { gunzipSync, gzip, gzipSync } from "zlib"
import * as express from "express"
import { Log } from "../pp-rpc-center/log";
import md5 = require("md5")
import { kdutils } from "kdweb-core/lib/utils";
import _ = require("underscore");
import CryptoJS = require("crypto-js")
import { DB } from "./db";
import { UserDefine } from "../pp-base-define/UserDefine";

export namespace knServiceCrypto {
	export function lambdaInstance(func:(params:any,req:express.Request)=>Promise<any>) {
		let service = new lambdaAsyncService(async (params)=>{
			return encode(await func(decode(params),service.currentReq))
		})
		return service
	}
	export function lambdaTokenInstance(func:(params:any)=>Promise<any>) {
		let service = new lambdaAsyncService(async (params)=>{
			let token = await getToken(params.ak,service.currentReq)
			if(!token) {
				return baseService.errJson(0,"get token failed")
			}
			let t = await decodeWithToken(params,token)
			if(!t) {
				return baseService.errJson(0,"decode failed")
			}
			let ret
			try {
				t.ak = params.ak
				ret = await func(t)
			} catch (error) {
				Log.oth.error("service error ",error)
			}
			if(!ret) {
				return baseService.errJson(0,"")
			}
			ret.token = await nextToken(params.ak,service.currentReq)
			ret = await encodeWithToken(ret,token)
			return ret 
		})
		return service
	}
	export function lambdaAKInstance(func:(userID:number,params:any)=>Promise<any>) {
		return lambdaTokenInstance(async (params:{ak:string})=>{
			if(!params.ak) {
				return baseService.errJson(0,"")
			}
			let akData = await parseAK(params.ak)
			if(!akData) {
				return baseService.errJson(0,"")
			}
			return await func(akData.userID,params)
		})
	}
	export function getIP(req:express.Request) {
		let ip = (<string>req.headers['x-forwarded-for'] || req.connection.remoteAddress ||'').split(',')[0] .trim()
		// Log.oth.info("get ip req = ",{
		// 	header:req.headers['x-forwarded-for'],
		// 	remote:req.connection.remoteAddress,
		// 	ret:ip,
		// })
		return "127.0.0.1"
	}
	let redis = DB.getRedis()
	export async function getToken(ak:string,req:express.Request) {
		let ip = getIP(req)
		if(!ip) {
			return null 
		}
		let ret = await redis.hget("t_sec_token",ak + "-" + ip,false)
		Log.oth.info("get token key = " + ak + "-" + ip + " token = " + ret)
		return ret 
	}
	export async function nextToken(ak:string,req:express.Request) {
		let ip = getIP(req)
		if(!ip) {
			return null 
		}
		let token = md5(kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,10000))
		token = _.shuffle(token + token).join("").slice(0,16)
		await redis.hset("t_sec_token",ak + "-" + ip,token,false)
		return token 
	}

	export function encode(t) {
		let str = JSON.stringify(t)
		let buffer = Buffer.from(str,"utf8")
		let zipBuffer = gzipSync(buffer)
		
		let n = Math.floor(zipBuffer.length / 2)
		let len = zipBuffer.length
		for(let i = 0 ; i < n ; i +=2) {
			let to = len - i - 1
			let c = zipBuffer[i]
			zipBuffer[i] = zipBuffer[to]
			zipBuffer[to] = c 
		}

		return {
			q:zipBuffer.toString("base64")
		}
	}

	export function decode(t) {
		if(typeof(t) != "object") {
			return t 
		}
		if(!t.q) {
			return t 
		}
		let ret = null 
		try {
			let data:string = t.q 
			let buffer = Buffer.from(data,"base64")
			
			let n = Math.floor(buffer.length / 2)
			let len = buffer.length
			for(let i = 0 ; i < n ; i +=2) {
				let to = len - i - 1
				let c = buffer[i]
				buffer[i] = buffer[to]
				buffer[to] = c 
			}

			let unBuffer = gunzipSync(buffer)
			let str = unBuffer.toString("utf8")
			ret = JSON.parse(str)
		} catch (error) {
			//_log.log("decode msg failed ",t,error)
			//console.log("decode msg failed ",t,error)
			Log.oth.error("decode failed",error)
			return {}
		}
		return ret 
	}

	export function encodeWithToken(t,token:string) {
		try {
			let content = JSON.stringify(t)
			let d = CryptoJS.AES.encrypt(content,token,{
				"mode": CryptoJS.mode.ECB,
				"padding": CryptoJS.pad.Pkcs7
			}).toString()
			return {
				d
			}
		} catch (error) {
			Log.oth.error("encode failed token = " + token,t,error)
		}
		return baseService.errJson(0,"")
	}
	export function decodeWithToken(t,token:string) {
		try {
			if(!t || !t.d) {
				return null
			}
			// var keyHex = CryptoJS.enc.Base64.parse(token);
			var decrypt = CryptoJS.AES.decrypt(t.d, token, {
				"mode": CryptoJS.mode.ECB,
				"padding": CryptoJS.pad.Pkcs7
			});
			return JSON.parse(CryptoJS.enc.Utf8.stringify(decrypt));
		} catch (error) {
			Log.oth.error("decode failed token = " + token,t,error)
		}
		return null 
	}

	type AKData = {
		userID:number,
		timestamp:number,
	}
	export async function createAK(userID:number,req:express.Request) {
		let ak = md5(userID + "|" + kdutils.getMillionSecond() + "|" + kdutils.intRandom(0,10000))
		let token = await nextToken(ak,req)
		let prev = await redis.hget("t_user_ak",String(userID),false)
		if(prev) {
			await redis.hdel("t_user_ak",prev)
		}
		await redis.hset("t_user_ak",String(userID),ak,false)
		await redis.hset("t_user_ak",ak,<AKData>{
			userID,
			timestamp:kdutils.getMillionSecond(),
		},true)
		return {
			ak,
			token,
		}
	}

	export async function parseAK(ak:string) {
		return <AKData>await redis.hget("t_user_ak",ak,true)
	}

	export async function clearAK(userID:number) {
		let ak = await redis.hget("t_user_ak",String(userID))
		if(ak) {
			await redis.hdel("t_user_ak",String(userID))
			await redis.hdel("t_user_ak",ak)
		}
	}
	export function createSimpleAK(userID:number,target:UserDefine.LoginTarget) {
		let ak = md5(userID + "|" + kdutils.getMillionSecond() + "|" + UserDefine.LoginTarget[target] + "|" + kdutils.intRandom(0,10000))
		return ak 
	}
}