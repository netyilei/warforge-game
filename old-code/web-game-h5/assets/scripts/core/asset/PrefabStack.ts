import PrefabManager from "./PrefabManager";
import { rcLog } from "../utils/Log";

const {ccclass, property, requireComponent} = cc._decorator;



@ccclass
export default class PrefabStack extends cc.Component {
	@property({type:[cc.Prefab]})
	prefabDefines:cc.Prefab[] = []

	onLoad() {
		PrefabManager.instance.addStack(this)
	}

	async start() {
		for(let p of this.prefabDefines) {
			//console.log(p.name)
			//console.log(p == prefab)
		}
	}

	private extPrefabs_:cc.Prefab[] = []
	addCache(prefab:cc.Prefab) {
		rcLog.info(`add cache `,prefab)
		if(this.extPrefabs_.find((v)=>v == prefab)) {
			rcLog.info(`failed `)
			return false 
		}
		if(this.prefabDefines.find((v)=>v == prefab)) {
			rcLog.info(`failed 2`)
			return false 
		}
		this.extPrefabs_.push(prefab)
		return true 
	}

	getCache(name:string) {
		return this.extPrefabs_.find(v=>v.name == name)
	}

	contains(prefab:cc.Prefab) {
		let p = this.prefabDefines.find(v=>v != null && v == prefab)
		if(p) {
			return true 
		}
		p = this.extPrefabs_.find(v=>v == prefab)
		if(p) {
			return true 
		}
		return false 
	}

	getAllCaches() {
		return this.extPrefabs_
	}

	onDestroy() {
		PrefabManager.instance.removeStack(this)
		for(let prefab of this.extPrefabs_) {
			cc.loader.release(prefab)
		}
	}
}