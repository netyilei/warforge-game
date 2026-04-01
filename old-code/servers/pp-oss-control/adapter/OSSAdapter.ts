import { OSSEntity } from "../oss/ossEntity";
import { AdapterBase } from "./adapterr";
import * as path from "path"
export class OSSAdapter extends AdapterBase {
	private entity_:OSSEntity
	initOSS() {
		this.entity_ = new OSSEntity({
			region:this.config.region,
			bucketName:this.config.bucketName,
			accessKeyId:this.config.key,
			accessKeySecret:this.config.secret,
			cdnPrefix:this.config.cdnPrefix
		})
	}

	getUrl(key:string) {
		return this.config.cdnPrefix + key
	}

	async getAllKeys(dirPath?:string) {
		let objs = await this.entity_.listAll(dirPath)
		if(!objs) {
			return []
		}
		let ret:string[] = []
		for(let obj of objs) {
			ret.push(obj.name)
		}
		return ret 
	}

	async upload(key:string,buffer:Buffer) {
		return await this.entity_.upload(key,buffer)
	}

	async delete(name:string) {
		return await this.entity_.delete(name)
	}

	async deleteMulti(names:string[]) {
		return await this.entity_.deleteMulti(names)
	}
}
