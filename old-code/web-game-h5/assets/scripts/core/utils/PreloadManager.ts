import { BasePreload } from "./BasePreload"


export class PreloadManager {
	private static instance_:PreloadManager = null 
	static get instance() {
		if(PreloadManager.instance_ == null) {
			PreloadManager.instance_ = new PreloadManager()
		}
		return PreloadManager.instance_
	}

	run(name:string,func:Function,...params:any[]) {
		let entity = this.preloads_.find(v=>v.name == name)
		if(entity) {
			entity.work.apply(entity,params)
			.then(function(...rets:any[]) {
				if(func) {
					func.apply(null,rets)
				}
			})
			return true 
		}
		return false 
	}

	private preloads_:BasePreload[] = []
	reg(entity:BasePreload) {
		this.preloads_.push(entity)
	}
}