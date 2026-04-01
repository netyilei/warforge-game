
import { kdutils } from "kdweb-core/lib/utils"
import { Config } from "../config"
import { OSSHelper } from "../oss/ossHelper"
import { OSSManager } from "../oss/ossManager"
import { Rpc } from "../rpc"
import { DB } from "../../src/db"

let redis = DB.getRedis()
async function upload(h:string,ossName:string,fileName:string,base64Str:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null 
	}
	let buffer = Buffer.from(base64Str,"base64")
	let url = await entity.upload(fileName,buffer)
	return url 
}

let riCacheTablename = "t_oss_uploadri_origin"
async function uploadRemoteImg(h:string,ossName:string,fileName:string,url:string,useCache?:boolean) {
	if(url == null || url == "NULL") {
		return null
	}
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null 
	}
	let cacheKey = ossName + "|" + url
	if(useCache) {
		let ret = await redis.hget(riCacheTablename,cacheKey)
		if(ret) {
			return ret 
		}
	}
	let data = await OSSHelper.downloadImg(url)
	if(data) {
		let ret = await entity.upload(fileName,Buffer.from(data,"base64"))
		if(ret && useCache) {
			await redis.hset(riCacheTablename,cacheKey,ret)
		}
		return ret 
	}
	return null
}

async function remove(h:string,ossName:string,fileName:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null 
	}
	return await entity.delete(fileName)
}

async function removePath(h:string,ossName:string,path:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return false 
	}
	let objs = await entity.getAllKeys(path)
	if(objs && objs.length > 0) {
		await entity.deleteMulti(objs)
		return true 
	}
	return false 
}

async function list(h:string,ossName:string,path:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let entity = OSSManager.getAdapter(ossName)
	if(entity == null) {
		return null
	}
	return await entity.getAllKeys(path)
}

async function getCDNPrefix(h:string,ossName:string) {
	ossName = ossName || Config.localConfig.defaultOSS
	let config = Config.localConfig.oss.find(v=>v.name == ossName)
	return config ? config.cdnPrefix : null
}
async function refreshCDN(h:string,ossName:string,path:string) {

}

async function getConfigs(h:string) {
	return Config.localConfig.oss
}

export let RpcOSS = {
	upload,
	uploadRemoteImg,
	remove:remove,
	removePath:removePath,
	refresh:refreshCDN,
	cdnPrefix:getCDNPrefix,

	list:list

	// getConfigs,
}