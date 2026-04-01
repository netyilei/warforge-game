
import request = require("request")
import { Log } from "../log"

export namespace OSSHelper {
	export async function downloadImg(url:string) {
		Log.oth.info("start donwload img url = " + url)
		return new Promise<string>(function(resolve,reject) {
			request(url,{
				encoding:null,
			},function(error,response,body) {
				if(error) {
					Log.oth.error("download url failed url = " + url,error)
					resolve(null)
					return 
				}
				if(response.statusCode == 200) {
					if(body instanceof Buffer) {
						resolve(body.toString("base64"))
						return 
					}
					// if(typeof(body) == "string") {
					// 	resolve(body)
					// 	return 
					// }
					Log.oth.error("download url failed type error url = " + url,body)
				} else {
					Log.oth.error("download url failed code = " + response.statusCode + " | url = " + url)
				}
				resolve(null)
				return;
			})
		})
	}
}