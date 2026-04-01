import { baseService } from "kdweb-core/lib/service/base"
import { kds } from "../../pp-base-define/GlobalMethods"
import { Rpc } from "../rpc"
import { kdutils } from "kdweb-core/lib/utils"


export namespace GMUploadService {
	export async function uploadMedia_Start(userID:number,params:{
		path?:string,		// 强制使用中间路径
		filename?:string,	// 强制使用文件名，不带扩展名
		ext:string,			// 扩展名，带点 如 .png
	}) {
		if(params.ext["0"] !== ".") {
			params.ext = "." + params.ext
		}
		let filename = params.path ? 
			"cpp-media/" + params.path + "/" + (params.filename || kdutils.getMillionSecond()) + params.ext
			:
			"cpp-media/" + (params.filename || kdutils.getMillionSecond()) + params.ext

		let b = await Rpc.center.callException(kds.oss.seq.start,null,filename)
		if(!b) {
			return baseService.errJson(1,"启动失败")
		}
		return {
			filename
		}
	}
	
	export async function uploadMedia_Upload(userID:number,params:{
		filename:string,
		base64Data:string,
	}) {
		let b = await Rpc.center.callException("kds.oss.seq.upload",params.filename,params.base64Data)
		if(!b) {
			return baseService.errJson(1,"上传失败")
		}
		return {}
	}
	
	export async function uploadMedia_End(userID:number,params:{
		filename:string,
	}) {
		let url = await Rpc.center.callException("kds.oss.seq.end",params.filename)
		if(!url) {
			return baseService.errJson(1,"上传失败")
		}
		return {
			url
		}
	}
}