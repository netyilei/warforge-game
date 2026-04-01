import { baseService } from "kdweb-core/lib/service/base"
import { GMTools } from "../tools/GMTools"
import { DB } from "../../src/db"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { Config } from "../config"
import fs = require("fs")
import { Log } from "../log"
import md5 = require("md5")

let db = DB.get()
let redis = DB.getRedis()
export namespace GMService {
	export async function login(params:{
		account:string,
		pwdMD5:string
	}) {
		let account = await GMTools.getAdmin(params.account)
		if(!account || account.pwdMD5 != params.pwdMD5) {
			return baseService.errJson(1,"登录失败")
		}
		let t = await GMTools.createAK(account.adminUserID)
		delete account.pwdMD5
		return {
			ak:t.ak,
			account,
		}
	}


	export async function uploadImg(userID:number,params:{
		midPath:string,
		filename:string,
		data:string,
	}) {
		let str = md5(params.data)
		// if(await redis.hget("t_upload_img_cache",str)) {
		// 	return baseService.errJson(1,"不能重复上传")
		// }
		if(params.midPath[params.midPath.length - 1] != "/") {
			params.midPath += "/"
		}
		let dir = Config.localConfig.uploadBasePath + params.midPath
		try {
			let stat = fs.statSync(dir)
			if(!stat || !stat.isDirectory()) {
				fs.mkdirSync(dir)
			}
		} catch (error) {
			Log.oth.error("",error)
			fs.mkdirSync(dir)
		}
		let basePath = Config.localConfig.uploadBasePath
		let path = basePath + params.midPath + params.filename
		return new Promise<any>((resolve,reject)=>{
			fs.writeFile(path,Buffer.from(params.data,"base64"),null,async (error)=>{
				if(error) {
					Log.oth.error("upload failed filename = " + params.filename + " path = " + path,error)
					resolve(baseService.errJson(1,"write失败"))
					return 
				}
				let url = Config.localConfig.uploadBaseUrl + params.midPath + params.filename
				// await redis.hset("t_upload_img_cache",str,url)
				// await redis.hset("t_upload_img_cache",params.filename,url)
				resolve({url})
				return 
			})
		})
	}
}