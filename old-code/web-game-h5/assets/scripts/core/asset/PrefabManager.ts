
import { rcUtils } from "../utils/Utils"
import PrefabStack from "./PrefabStack"

async function loadPrefabFunc(url) {
	kcore.log.info(`[loadPrefab] start to load prefabName = ${url}`)
	let realUrl = url
	let prefab:cc.Prefab = null
	try {
		prefab = await rcUtils.loadRes<cc.Prefab>(realUrl)
	} catch (error) {
		kcore.log.error(error)	
	}
	if(prefab == null) {
		kcore.log.error(`[loadPrefab] load failed prefabName = ${url}`)
	}
	return prefab
}


export default class PrefabManager implements kcore.IPrefabManager {
	private constructor() {}
	async loadPrefab(url:string) {
		let prefab = await kcore.async.blockSafeCall("正在加载",loadPrefabFunc,url)
		if(prefab) {
			this.addCache(prefab)
		}
		return prefab
	}

	getPrefab(name:string):cc.Prefab {
		for(let i = this.stacks_.length - 1; i >= 0 ; i --) {
			let stack = this.stacks_[i]
			let prefab = stack.prefabDefines.find(v=>v.name == name)
			if(prefab) {
				return prefab
			}
		}
		return null
	}

	private static instance_:PrefabManager = null;
	static get instance() {
		if(PrefabManager.instance_ == null) {
			PrefabManager.instance_ = new PrefabManager()
		}
		return PrefabManager.instance_
	}

	private stacks_:PrefabStack[] = []
	addStack(stack:PrefabStack) {
		if(this.stacks_.find(v=>v == stack)) {
			return false;
		}
		this.stacks_.push(stack)
		return true 
	}

	removeStack(stack:PrefabStack) {
		let idx = this.stacks_.findIndex(v=>v == stack)
		if(idx < 0) {
			return false 
		}
		this.stacks_.splice(idx,1)
		return true 
	}

	getStack() {
		if(this.stacks_.length == 0) {
			return null
		}
		return this.stacks_[this.stacks_.length - 1]
	}

	addCache(prefab:cc.Prefab) {
		if(this.stacks_.length == 0) {
			return false 
		}
		let b = false 
		for(let stack of this.stacks_) {
			b = stack.contains(prefab)
			if(b) {
				break
			}
		}
		if(b) {
			return false 
		}
		let stack = this.getStack()
		stack.addCache(prefab)
		return true 
	}
}