import { OSSEntity } from "./ossEntity";
import { Config } from "../config";
import { Log } from "../log";
import { OSSAdapter } from "../adapter/OSSAdapter";
import { COSAdapter } from "../adapter/COSAdapter";
import { AdapterBase } from "../adapter/adapterr";
import { LocalAdapter } from "../adapter/LocalAdapter";


let ossEntities = new Map<string,OSSEntity>()
export namespace OSSManager {
	export function getEntity(name:string) {
		if(ossEntities.has(name)) {
			return ossEntities.get(name)
		}
		let config = Config.localConfig.oss.find(v=>v.name == name)
		if(config == null) {
			Log.oth.info("[OSSMGR] cannot create oss entity name = " + name)
			ossEntities.set(name,null)
			return null
		}
		let entity = new OSSEntity({
			region:config.region,
			bucketName:config.bucketName,
			accessKeyId:config.key,
			accessKeySecret:config.secret,
			cdnPrefix:config.cdnPrefix
		})
		ossEntities.set(name,entity)
		return entity
	}

	let adapters = new Map<string,AdapterBase>()
	export function getAdapter(name:string):AdapterBase {
		if(adapters.has(name)) {
			return adapters.get(name)
		}
		let adapter = createAdapter(name)
		adapters.set(name,adapter)
		return adapter
	}
	
	function createAdapter(name:string):AdapterBase {
		let config = Config.localConfig.oss.find(v=>v.name == name)
		if(config) {
			switch(config.type) {
				case "oss": {
					return new OSSAdapter(config)
				}
				case "cos": {
					return new COSAdapter(config)
				}
			}
		}
		let local = Config.localConfig.local.find(v=>v.name == name)
		if(local) {
			switch(local.type) {
				case "local": {
					return new LocalAdapter({
						name:local.name,
						bucketName:local.localPath,
						cdnPrefix:local.cdnPrefix,
						key:"",
						secret:"",
						region:"",
						iconOSSPathPrefix:"",
						type:local.type,

					})
				}
			}
		}
		return null 
	}
}