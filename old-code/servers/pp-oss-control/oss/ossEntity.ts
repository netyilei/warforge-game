
let OSS = require("ali-oss")
import * as http from "http";
import * as request from "request"
import { kdlog } from "kdweb-core/lib/log";
import { Logger,Log4js } from "log4js";
import { Log } from "../log";
export type ossObject = {
	etag:string,
	name:string,
	url:string,
	size:number,
	lastModified:string,

	owner: {
		displayName:string,
		id:string
	}
}
export type ossList = {
	objects:ossObject[],
	prefixes:string,

	res: {
		status:number,
		statusCode:number,
	}

	isTruncated:boolean,	// 后面是否还有
	nextMarker:string,
}

export type ossEntityParams = {
	region:string;
	bucketName:string;
	accessKeyId:string;
	accessKeySecret:string;

	cdnPrefix:string;
}

export type ossDownloadCallback = (error:any,res:any,body:any)=>void;
export type ossDonwload = {
	error:any,
	res:any,
	body:any,
}

export class OSSEntity
{
	private params_:ossEntityParams
	private client_;
	private logger_:Logger;
	public constructor(params:ossEntityParams) {
		this.params_ = params
		this.client_ = new OSS({
			region: this.params_.region,
			bucket: this.params_.bucketName,
			accessKeyId: this.params_.accessKeyId,
			accessKeySecret: this.params_.accessKeySecret,
		})
		this.logger_ = kdlog.getLogger("oth")
	}


	public async list(prefix?:string,maxNum?:number):Promise<ossList> {
		let result:ossList = await this.client_.list({
			"prefix": prefix,
			"max-keys": maxNum || 1000,
		})
		return result 
	}

	public async nextList(list:ossList,maxNum?:number) {
		if(list.isTruncated) {
			let result:ossList = await this.client_.list({
				marker:list.nextMarker,
				"max-keys": maxNum || 1000,
			})
			return result
		}
		return null;
	}

	public async listAll(prefix:string) {
		let objects:ossObject[] = []
		try {
			let arr = await this.list(prefix,100)
			if(arr == null || arr.objects == null || arr.objects.length == 0) {
				return []
				//return arr.objects
			}
			objects = arr.objects
			if(arr.objects.length < 100) {
				return objects
			}
			while(true) {
				arr = await this.nextList(arr,100)
				if(arr == null || arr.objects.length == 0) {
					break 
				}
				for(let obj of arr.objects) {
					objects.push(obj)
				}
				if(arr.objects.length < 100) {
					break 
				}
			}
		} catch (error) {
			Log.oth.info("error in list oss = " + this.params_.bucketName + " prefix = " + prefix,error)
		}
		return objects
	}

	public async upload(name:string,buffer:Buffer) {
		Log.oth.info("start to upload oss = " + this.params_.bucketName + " filename = " + name + " len = " + buffer.byteLength + "/bs")
		try {
			let ret = await this.client_.put(name,buffer)
			return this.params_.cdnPrefix + name
		} catch (error) {
			Log.oth.info("upload failed name = " + name,error)
		}
		return null 
	}

	public getPath(name:string) {
		return this.params_.cdnPrefix + name
	}

	public downloadCallback(obj:ossObject,func:ossDownloadCallback) {
		let pattern = "aliyuncs.com"
		let useUrl = obj.url
		if(this.params_.cdnPrefix != null) {
			let pos = useUrl.indexOf(pattern)
			if(pos > 0) {
				useUrl = useUrl.substr(pos+pattern.length)
				useUrl = this.params_.cdnPrefix + useUrl
			}
		}
		request.get({
			url:useUrl
		},function(error,res,body) {
			if(error) {
				func(error,res,null)
			} else {
				func(null,res,body)
			}
		})
	}

	public download(obj:ossObject):Promise<ossDonwload> {
		let self = this 
		return new Promise<ossDonwload>(function(resolved,reject) {
			self.downloadCallback(obj,function(error,res,body) {
				resolved({
					error:error,
					body:body,
					res:res,
				})
			})
		})
	}

	public async delete(obj:ossObject | string) {
		let name:string = null 
		if(typeof(obj) == "string") {
			name = obj 
		} else {
			name = obj.name
		}
		try {
			await this.client_.delete(name)
			Log.oth.info("delete obj name = ",name)
		} catch (error) {
			Log.oth.info("delete obj failed name = " + name," | error = ",error)
			return false;
		}
		return true
	}

	public async deleteMulti(objs:ossObject[] | string[]) {
		let names = []
		for(let obj of objs) {
			if(typeof(obj) == "string") {
				names.push(obj)
			} else {
				names.push(obj.name)
			}
		}
		Log.oth.info("try delete obj length = ",objs.length)
		Log.oth.info("names = ",names)
		try {
			await this.client_.deleteMulti(names)
		} catch (error) {
			Log.oth.info("error in delete ",error)
			return false;
		}
		return true 
	}
	
}