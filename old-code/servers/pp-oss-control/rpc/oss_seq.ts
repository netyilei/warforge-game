import { kdutils } from "kdweb-core/lib/utils"
import { Config } from "../config"
import { Log } from "../log"
import { OSSManager } from "../oss/ossManager"

class SeqUploadEntity {
	constructor() {
		let self = this 
		this.prevTime_ = kdutils.getMillionSecond()
		self.h_ = setInterval(function() {
			if(kdutils.getMillionSecond() - self.prevTime_ >= self.timeout) {
				Log.oth.info("[seq-upload] timeout name = " + self.filename)
				self.release()
			}
		},100)
		entities.push(this)
	}

	release() {
		if(this.h_ != null) {
			clearInterval(this.h_)
			this.h_ = null 
		}
		let idx = entities.indexOf(this)
		if(idx >= 0) {
			entities.splice(idx,1)
		}
	}
	private filename_:string = null
	get filename() {
		return this.filename_
	}
	set filename(v) {
		this.filename_ = v
	}

	private content_:string = ""
	get content() {
		return this.content_
	}
	set content(v) {
		this.content_ = v
	}
	private ossName_:string = null
	get ossName() {
		return this.ossName_
	}
	set ossName(v) {
		this.ossName_ = v
	}

	private targetSize_:number = null
	get targetSize() {
		return this.targetSize_
	}
	set targetSize(v) {
		this.targetSize_ = v
	}

	private timeout_:number = 20000
	get timeout() {
		return this.timeout_
	}
	set timeout(v) {
		this.timeout_ = v
	}

	private prevTime_:number = null 
	private h_:NodeJS.Timeout

	checkSize(newSize:number) {
		if(this.targetSize && (this.content.length + newSize) > this.targetSize) {
			return false 
		}
		return true
	}
	append(base64Str:string) {
		this.prevTime_ = kdutils.getMillionSecond()
		this.content += base64Str
		Log.oth.info("[seq-upload] append file = " + this.filename + " str size = " + base64Str.length)
	}

}

let entities:SeqUploadEntity[] = []
async function start(h:string,ossName:string,filename:string,totalSize?:number) {
	let entity = entities.find(v=>v.filename == filename)
	if(entity) {
		entity.release()
	} 
	ossName = ossName || Config.localConfig.defaultOSS
	if(!ossName) {
		return false 
	}
	entity = new SeqUploadEntity()
	entity.filename = filename
	entity.ossName = ossName
	entity.targetSize = totalSize || null
	entities.push(entity)
	return true 
}
async function checkSize(h:string,filename:string,newSize:number) {
	let entity = entities.find(v=>v.filename == filename)
	if(!entity) {
		return false 
	}
	return entity.checkSize(newSize)
}

async function upload(h:string,filename:string,base64Str:string) {
	let entity = entities.find(v=>v.filename == filename)
	if(!entity) {
		return false 
	} 
	if(!entity.checkSize(base64Str.length)) {
		return false 
	}
	entity.append(base64Str)
	return true 
}

async function end(h:string,filename:string) {
	let entity = entities.find(v=>v.filename == filename)
	if(!entity) {
		return null 
	}
	entity.release()
	let url:string = null 
	do {
		let buffer = Buffer.from(entity.content,"base64")
		if(!buffer || buffer.length == 0) {
			break 
		}
		Log.oth.info("[seq-upload] filename = " + filename + " buffer size = " + buffer.length)
		let adapter = OSSManager.getAdapter(entity.ossName)
		if(!adapter) {
			break 
		}
		url = await adapter.upload(filename,buffer)
	} while (false);
	return url 
}

async function cancel(h:string,filename:string) {
	let entity = entities.find(v=>v.filename == filename)
	if(!entity) {
		return false 
	}
	entity.release()
	return true 
}
export let RpcOSSSeq = {
	start,
	upload,
	end,
	cancel,
	checkSize,
}