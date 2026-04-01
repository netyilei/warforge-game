import { rcUtils } from "./Utils";


let cacheAsync = new Map<Function,Promise<any>>()
export namespace rcAsync {
	export function clear() {
		cacheAsync.clear();
	}
	export async function safeCall<T>(func:(...params:any)=>Promise<T>,...params:any[]) {
		let promise:Promise<T> = cacheAsync.get(func)
		if(promise != null) {
			let worker = async function() {
				kcore.log.info("wait in queue")
				let ret = await promise
				return ret 
			}
			return worker()
		}
		let worker = async function() {
			kcore.log.info("wait in start")
			let promise = func(...params)
			cacheAsync.set(func,promise)

			let ret = await promise
			if(cacheAsync.get(func) == null) {
				return null
			}
			cacheAsync.delete(func)
			return ret 
		}
		return worker()
	}

	export async function blockSafeCall<T>(content:string,func:(...params:any)=>Promise<T>,...params:any[]) {
		let blocker = kcore.block.create(content) 
		blocker.start()
		let ret:T = null
		let err = null
		try {
			ret = await safeCall(func,...params)
		} catch (error) {
			err = error
		} finally {
			blocker.stop()
		}
		if(err) {
			throw(err)
		}
		return ret 
	}
	
	export async function timeout<T>(interval:number,data?:T):Promise<T> {
		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(data), interval);
		})
	}
	
	export class ResourceLoader {
		start() {
			this.promises_ = []
		}
		private promises_:Promise<cc.Asset>[] = []
		loadRes<T extends cc.Asset>(url,type?:{prototype:T}):Promise<T> {
			let ret = rcUtils.loadRes<T>(url,type)
			this.promises_.push(ret)
			return ret 
		}

		async end() {
			return await Promise.all(this.promises_)
		}
	}

	
	export class lock {
		private promise_:Promise<void> = null
		private resolveFunc_:Function = null
		async start() {
			let bCreate = false 
			while(this.promise_ != null) {
				await this.promise_
				await this.timeout()
			}
			let self = this 
			this.promise_ = new Promise<void>(function(resolve,reject) {
				self.resolveFunc_ = function() {
					resolve()
				}
			})
			return 
		}

		end() {
			if(this.resolveFunc_) {
				this.resolveFunc_()

				this.promise_ = null
				this.resolveFunc_ = null
			}
		}

		async timeout() {
			await new Promise(function(resolve,reject) {
				setTimeout(function() {
					resolve(null)
				},50)
			})	
		}
	}

	export interface waitLike<T = any> {
		promise:Promise<T>
		resolve(ret?:T)
	}
	export class wait<T = any> implements waitLike<T> {
		private promise_:Promise<T> = null
		private resolveFunc_:Function = null
		constructor() {
			let self = this 
			this.promise_ = new Promise<T>(function(resolve,reject) {
				self.resolveFunc_ = function(ret:T) {
					resolve.call(null,ret)
				}
			})
		}
		
		get promise() {
			return this.promise_
		}

		private isResolved_ = false 
		get isResolved() {
			return this.isResolved_
		}
		resolve(ret?:T) {
			try {
				this.isResolved_ = true 
				this.resolveFunc_.call(null,ret)
			} catch (error) {
				console.log(error)
			}
		}
	}

	export class waitTimeout<T = any> implements waitLike<T> {
		private promise_:Promise<T> = null
		private resolveFunc_:Function = null
		constructor(timeout:number) {
			this.timeout_ = timeout
			this.isResolved_ = false 
			this.isTimeout_ = false 
			
			let self = this 
			this.promise_ = new Promise<T>(function(resolve,reject) {
				self.resolveFunc_ = function(ret:T) {
					self.isResolved_ = true 
					resolve(ret)
				}
			})
			setTimeout(function() {
				if(!self.isResolved_) {
					self.isTimeout_ = true 
					self.resolve()
				}
			},timeout)
		}
		private timeout_:number
		private isResolved_:boolean
		private isTimeout_:boolean
		get isTimeout():boolean {
			return this.isTimeout_;
		}
		
		get promise() {
			return this.promise_
		}

		resolve(ret?:T) {
			if(!this.isResolved_) {
				try {
					this.resolveFunc_.call(null,ret)
				} catch (error) {
					console.log(error)				
				}
			}
		}
	}
	type queueItemType = {
		func:Function,
		l:wait,
		valid:boolean,
	}
	export class queue {
		private lock_ = new lock()

		private items_:queueItemType[] = []
		get length() {
			return this.items_.length
		}
		/*
			return value: giveup function
		*/
		call(func:Function) {
			let item:queueItemType = {
				func:func,
				l:new wait(),
				valid:true,
			}
			let giveup = function() {}
			if(this.items_.length == 0) {
				this.items_.push(item)
				let self = this 
				let worker = async function() {
					let promise = item.func()
					if(typeof(promise["then"]) === "function") {
						await promise 
					}
					
					let idx = self.items_.findIndex((v)=>v == item)
					self.items_.splice(idx,1)

					item.l.resolve()
				}
				worker()
			} else {
				giveup = function() {
					item.valid = false 
				}

				let prevItem = this.items_[this.items_.length - 1]
				this.items_.push(item)

				let self = this 
				let worker = async function() {
					await prevItem.l.promise
					let idx = self.items_.findIndex((v)=>v == prevItem)
					self.items_.splice(idx,1)
					if(item.valid) {
						let promise = item.func()
						if(typeof(promise["then"]) === "function") {
							await promise 
						}
					}
					item.l.resolve()
				}
				worker()
			}
			return giveup
		}
	}

	let cacheQueueFuncs = new Map<any,queue>()
	export type queueFuncType = (...params)=>Promise<any>
	// func必须是async
	export function queueFunc<T>(func:(...params)=>Promise<T>,obj?:any):(...params)=>Promise<T> {
		let q:queue = null
		if(obj == null) {
			obj = func
		}
		if(cacheQueueFuncs.has(obj) == false) {
			q = new queue()
			cacheQueueFuncs.set(obj,q)
		} else {
			q = cacheQueueFuncs.get(obj)
		}
		let retFunc = async function(...params) {
			return await new Promise<T>(function(resolve,reject) {
				q.call(async function() {
					let promise = func.apply(null,params)
					resolve(await promise)
				})
			})
		}
		return retFunc 
	}
}