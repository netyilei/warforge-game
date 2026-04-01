import { OSSConfigType } from "../config";


export class AdapterBase {
	constructor(config:OSSConfigType) {
		this.config_ = config 
		this.initOSS()
	}

	private config_:OSSConfigType
	get config() {
		return this.config_
	}
	initOSS() {

	}

	getUrl(key:string) {

	}

	async getAllKeys(path?:string):Promise<string[]> {
		return []
	}

	async upload(key:string,buffer:Buffer) {
		return ""
	}

	async exists(name:string) {
		return false 
	}
	
	async delete(name:string) {
		return false 
	}

	async deleteMulti(names:string[]) {
		return false 
	}
}