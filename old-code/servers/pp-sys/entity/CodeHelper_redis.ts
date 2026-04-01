import { kdasync } from "kdweb-core/lib/tools/async"
import { kdutils } from "kdweb-core/lib/utils"
import { Log } from "../log"
import { mongoDB } from "kdweb-core/lib/mongo/controller"
import { redisDB } from "kdweb-core/lib/redis/controller"
import { Config } from "../config"
import { max, relativeTimeRounding } from "moment"
import { DB } from "../../src/db"

function getSysTableName(name:string) {
	return "t_codesys_" + name
}

function getCodeStatusTableName(name:string) {
	return "t_codestatus_" + name
}

type CodeStatus = {
	code:string,
	used:boolean,
	timestamp:number,
	date:string,
}
export class CodeEntity {
	constructor(name:string,maxLength:number) {
		this.name_ = name 
		this.maxLength_ = maxLength
		this.redis_ = DB.getRedis()
		this.init()
	}

	private init_ = false 
	private initError_ = false 
	private initWait_ = new kdasync.wait()
	private name_:string
	private maxLength_:number
	private codeCaches_:CodeStatus[]
	private redis_:redisDB
	private async init() {
		let obj = await this.redis_.hgetall(getCodeStatusTableName(this.name_),true) || {}
		let statuss:CodeStatus[] = []
		for(let key of Object.keys(obj)) {
			statuss.push(obj[key])
		}
		this.codeCaches_ = []
		Log.oth.info("[init] start to init code status name = " + this.name_ + " | db cache len = " + statuss.length)
		let max = Math.pow(10,this.maxLength_)
		let min = Math.pow(10,this.maxLength_ - 1)
		Log.oth.info("[init] min = " + min + " | max = " + max)
		for(let i = min ; i < max ; i ++) {
			this.codeCaches_.push({
				code:i.toString(),
				used:false,
				timestamp:null,
				date:null,
			})
		}

		Log.oth.info("[init] shuffle name = " + this.name_ + " | length = " + this.codeCaches_.length)
		// shuffle
		let len = this.codeCaches_.length
		for(let i = 0 ; i < len ; i ++) {
			let ti = Math.floor(Math.random() * max * 10) % len
			let temp = this.codeCaches_[ti]
			this.codeCaches_[ti] = this.codeCaches_[i]
			this.codeCaches_[i] = temp 
		}

		Log.oth.info("[init] combine with db status name = " + this.name_)
		for(let info of statuss) {
			let t = this.codeCaches_.find((v)=>v.code == info.code)
			if(t == null) {
				Log.oth.error("[init] cannot find code info in mem cache code = " + info.code)
				continue 
			}
			t.used = info.used
			t.timestamp = info.timestamp
		}
		Log.oth.info("[init] end init code status name = " + this.name_)

		this.init_ = true 
		this.initWait_.resolve()
	}
	async lazyInit() {
		if(this.init_) {
			return 
		}
		if(this.initError_) {
			Log.oth.error("code init failed name = " + this.name_)
			this.codeCaches_ = []
			return 
		}
		await this.initWait_.promise
	}
	async getCode() {
		await this.lazyInit()
		if(this.codeCaches_.length == 0) {
			return null
		}
		let startAs = kdutils.intRandom(0,Math.floor(this.codeCaches_.length * 0.9))
		let isRandom = true 
		do {
			for(let i = startAs ; i < this.codeCaches_.length ; i ++) {
				let info = this.codeCaches_[i]
				if(!info.used) {
					info.used = true 
					info.timestamp = kdutils.getMillionSecond()
					info.date = kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
					await this.redis_.hset(getCodeStatusTableName(this.name_),info.code,info,true)
					return info.code
				}
			}
			if(!isRandom) {
				break 
			}
			isRandom = false 
			startAs = 0
		} while(false)
		return null
	}

	async releaseCode(code:string) {
		await this.lazyInit()
		if(this.codeCaches_.length == 0) {
			return false 
		}
		let info = this.codeCaches_.find((v)=>v.code == code)
		if(info == null) {
			Log.oth.info("[releaseCode] cannot get cache code = " + code)
			return false 
		}
		info.used = false 
		info.timestamp = null
		info.date = null
		await this.redis_.hdel(getCodeStatusTableName(this.name_),info.code)
		return true 
	}

	async useCode(code:string) {
		await this.lazyInit()
		if(this.codeCaches_.length == 0) {
			return false 
		}
		let info = this.codeCaches_.find((v)=>v.code == code)
		if(info == null) {
			Log.oth.info("[releaseCode] cannot get cache code = " + code)
			return false 
		}
		if(info.used) {
			return false 
		}
		info.used = true 
		info.timestamp = kdutils.getMillionSecond()
		info.date = kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		await this.redis_.hset(getCodeStatusTableName(this.name_),info.code,info,true)
		return true 
	}
}

let codeCache = new Map<string,CodeEntity>()
let qs = new Map<string,kdasync.queue>()
function getQuene(name:string) {
	let q = qs.get(name)
	if(!q) {
		q = new kdasync.queue()
		qs.set(name,q)
	}
	return q 
}
export namespace CodeHelper {
	function getEntity(name:string,maxLength) {
		if(codeCache.has(name)) {
			return codeCache.get(name)
		}
		let ret = new CodeEntity(name,maxLength)
		codeCache.set(name,ret)
		return ret 
	}
	async function _getCode(name:string,maxLength:number) {
		return await getEntity(name,maxLength).getCode()
	}

	async function _releaseCode(name:string,code:string,maxLength:number) {
		return await getEntity(name,maxLength).releaseCode(code)
	}
	async function _useCode(name:string,code:string,maxLength:number) {
		return await getEntity(name,maxLength).useCode(code)
	}

	export async function getCode(name:string,maxLength:number) {
		return await new Promise<string>(function(resolve,reject) {
			getQuene("getCode|" + name).call(async function() {
				let code = await _getCode(name,maxLength)
				resolve(code)
			})
		})
	}

	export async function releaseCode(name:string,code:string,maxLength:number) {
		return await new Promise<boolean>(function(resolve,reject) {
			getQuene("getCode|" + name).call(async function() {
				let b = await _releaseCode(name,code,maxLength)
				resolve(b)
			})
		})
	}

	export async function useCode(name:string,code:string,maxLength:number) {
		return await new Promise<boolean>(function(resolve,reject) {
			getQuene("getCode|" + name).call(async function() {
				let b = await _useCode(name,code,maxLength)
				resolve(b)
			})
		})
	}
}