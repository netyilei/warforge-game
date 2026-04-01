import { Config } from "../config"
import { Log } from "../log"
import { OSSManager } from "../oss/ossManager"
import request = require("request")
import { Rpc } from "../rpc"
import { OSSHelper } from "../oss/ossHelper"
import { DB } from "../../src/db"

let iconUploadOriginTablename = "t_icon_upload_origin"
let iconUploadCacheTablename = "t_icon_upload_mutex"

let redis = DB.getRedis()
function getIconOSSPath(userID:number) {
	return "wicon-fk/u" + userID + ".jpg"
}

async function operWechatIcon(ossName:string,userID:number,url:string,ignoreTail?:boolean) {
	if(url == null || url == "NULL") {
		return "NULL"
	}
	
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return "NULL" 
	}
	let ossConfig = Config.localConfig.oss.find(v=>v.name == ossName)
	if(!ignoreTail) {
		url += "?a=a.jpg"
	}
	let originUrl:string = await redis.hget(iconUploadOriginTablename,userID.toString())
	let cacheUrl:string 
	if(originUrl != url) {
		let data = await OSSHelper.downloadImg(url)
		if(data) {
			let ossPath = getIconOSSPath(userID)
			if(ossConfig.iconOSSPathPrefix) {
				ossPath = ossConfig.iconOSSPathPrefix + ossPath
			}
			//cacheUrl = <string>await Rpc.center.callException("kds.oss.upload",null,ossPath,data)
			cacheUrl = await entity.upload(ossPath,Buffer.from(data,"base64"))
			if(cacheUrl == null) {
				Log.oth.error("oss upload failed path = " + ossPath + " | icon = " + url)
			} else {
				redis.hset(iconUploadOriginTablename,userID.toString(),url)
				redis.hset(iconUploadCacheTablename,userID.toString(),cacheUrl)
			}
		}
	}
	if(cacheUrl == null) {
		cacheUrl = await redis.hget(iconUploadCacheTablename,userID.toString()) 
	}
	return cacheUrl || "NULL"
}

async function upload(h:string,ossName:string,userID:number,iconUrl:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null
	}
	return await operWechatIcon(ossName,userID,iconUrl)
}

async function uploadXLApp(h:string,ossName:string,userID:number,iconUrl:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null
	}
	return await operWechatIcon(ossName,userID,iconUrl,true)
}

async function getUrl(h:string,ossName:string,userID:number) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null
	}
	return entity.getUrl(getIconOSSPath(userID))
}

export let RpcIcon = {
	upload,
	uploadXLApp,
	getUrl,
}