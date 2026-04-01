import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { Log } from "../pp-rpc-center/log";
import { knRpcTools } from "./knRpcTools";


export class CheckStartClient {
	constructor(rpc:knRpcManager.base,params:{
		prefix?:string[],
		suffix?:string[],
		pattern?:string[],
		interval?:number,
	}) {
		this.prefix_ = params.prefix
		this.suffix_ = params.suffix
		this.pattern_ = params.pattern
		this.rpc_ = rpc 

		setInterval(()=>{
			this.work()	
		},params.interval || 30000)
	}

	private prefix_:string[]
	private suffix_:string[]
	private pattern_:string[]
	private rpc_:knRpcManager.base

	private working_ = false 
	async work() {
		if(this.working_) {
			return 
		}
		this.working_ = true 
		try {
			if(this.prefix_) {
				for(let prefix of this.prefix_) {
					let configs = await knRpcTools.getConfigBlur({
						prefix,
					})
					if(configs && configs.length > 0) {
						for(let config of configs) {
							this.rpc_.startClient(config)
						}
					}
				}
				for(let suffix of this.suffix_) {
					let configs = await knRpcTools.getConfigBlur({
						suffix,
					})
					if(configs && configs.length > 0) {
						for(let config of configs) {
							this.rpc_.startClient(config)
						}
					}
				}
				for(let pattern of this.pattern_) {
					let configs = await knRpcTools.getConfigBlur({
						pattern,
					})
					if(configs && configs.length > 0) {
						for(let config of configs) {
							this.rpc_.startClient(config)
						}
					}
				}
			}
		} catch (error) {
			Log.oth.error("",error)
		}
		this.working_ = false 
	}
}