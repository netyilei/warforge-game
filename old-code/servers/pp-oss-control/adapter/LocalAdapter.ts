import { OSSConfigType } from "../config";
import { AdapterBase } from "./adapterr";
import fs = require("fs")
import path = require("path")


export class LocalAdapter extends AdapterBase {

	get localPath() {
		return this.config.bucketName
	}

	initOSS() {

	}

	getUrl(key:string) {
		return this.config.cdnPrefix + key
	}

	async getAllKeys(p?:string):Promise<string[]> {
		let root = path.join(this.localPath,p ? p : "")
		let ret:string[] = []
		let _listDir = (dirPath:string) => {
			let files = fs.readdirSync(dirPath)
			for(let f of files) {
				let fullPath = path.join(dirPath,f)
				let stat = fs.statSync(fullPath)
				if(stat.isDirectory()) {
					_listDir(fullPath)
				} else {
					let relativePath = path.relative(root,fullPath).replace(/\\/g,"/")
					ret.push(relativePath)
				}
			}
		}
		_listDir(root)
		return ret
	}

	async upload(key:string,buffer:Buffer) {
		let fullPath = path.join(this.localPath,key)
		let dirPath = path.dirname(fullPath)
		if(!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath,{recursive:true})
		}
		fs.writeFileSync(fullPath,buffer)
		return this.getUrl(key)
	}

	async exists(name:string) {
		let fullPath = path.join(this.localPath,name)
		try {
			let stat = fs.statSync(fullPath)
			return stat.isFile()
		} catch {
			return false
		}
	}
	
	async delete(name:string) {
		let fullPath = path.join(this.localPath,name)
		try {
			fs.unlinkSync(fullPath)
			return true
		} catch {
			return false
		}
		return false 
	}

	async deleteMulti(names:string[]) {
		for(let name of names) {
			let fullPath = path.join(this.localPath,name)
			try {
				fs.unlinkSync(fullPath)
			} catch {
				return false
			}
		}
		return false 
	}
}