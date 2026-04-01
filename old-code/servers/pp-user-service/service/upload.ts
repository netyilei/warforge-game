import { baseService } from "kdweb-core/lib/service/base"
import { kds } from "../../pp-base-define/GlobalMethods"
import { Rpc } from "../rpc"
import { kdutils } from "kdweb-core/lib/utils"


export namespace UserUploadService {
	export async function uploadMedia_Start(userID:number,params:{
		path?:string,		// 强制使用中间路径
		filename?:string,	// 强制使用文件名，不带扩展名
		ext:string,			// 扩展名，带点 如 .png
		totalSize:number,
	}) {
		if(!params.totalSize || typeof(params.totalSize) != "number" || params.totalSize <= 0 || params.totalSize > 15 * 1024 * 1024) {
			return baseService.errJson(1,"无效的文件大小")
		}
		if(params.ext["0"] !== ".") {
			params.ext = "." + params.ext
		}
		let userFilename = "u" + userID + "_" + kdutils.getMillionSecond() + params.ext
		let filename = params.path ? 
			"user-media/" + params.path + "/" + userFilename
			:
			"user-media/" + userFilename

		let b = await Rpc.center.callException(kds.oss.seq.start,null,filename,params.totalSize)
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
		if(!params.base64Data || params.base64Data.length <= 0) {
			return baseService.errJson(1,"无效的上传数据")
		}
		if(!await Rpc.center.callException(kds.oss.seq.checkSize,params.filename,params.base64Data.length)) {
			return baseService.errJson(1,"上传数据不正确")
		}
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