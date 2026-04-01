
export interface IFileInterface {
	readonly rootDir:string
	mkdir(dir:string):boolean
	loadJson(path:string):any
	loadContent(path:string):string
	loadArrayBuffer(path:string):ArrayBuffer
	saveJson(path:string,obj:any):boolean 
	saveContent(path:string,content:string):boolean
	saveArrayBuffer(path:string,arrayBuffer:ArrayBuffer):boolean
	exist(path:string):boolean
	isDir(path:string):boolean
	isFile(path:string):boolean
	rmFile(path:string):boolean
	rmDir(dir:string):boolean
}

type CacheFileItem = {
	url:string,
	byteSize:number,
	filename:string,
	ext:string,
	md5:string,
	timestamp:number,
	timeout:number,
	valid:boolean,
}
let mimeTypeImgMap = {
	"image/jpeg":".jpg",
	"image/png":".png",
}
let reverseMimeTypeImgMap = {
	".jpg":"image/jpeg",
	".jpeg":"image/jpeg",
	".png":"image/png",
}
export class CacheManagerBase implements IFileInterface,kcore.ICacheManager {
	constructor(rootNode:cc.Node) {
		this.rootNode_ = rootNode
		this.rootCom_ = rootNode.addComponent(cc.Component)
		// cc.director.getScheduler().schedule(rcApis.handler(this,this.update),rootNode,0,false)
	}
	protected rootNode_:cc.Node 
	protected rootCom_:cc.Component
	protected waits_:{
		url:string,
		wait:kcore.async.wait
	}[] = []
	protected loaded_:{
		url:string,
		frame:cc.SpriteFrame
		count:number,
	}[] = []
	protected loadedAsset_:{
		url:string,
		asset:cc.Asset,
		count:number,
	}[] = []
	protected loadedBundles_:{
		resData:ResourcePoolDefine.ResData,
		count:number,
	}[] = []
	protected nodeStack_:{
		node:cc.Node,
		frames:cc.SpriteFrame[],
		assets:cc.Asset[],
	}[] = []
	async loadImg(url:string,opt?:{
		timeoutMS?:number,
		noWait?:boolean,	// 不等待重复加载
		noLoad?:boolean,	// 有缓存就返回，不然返回null
	}):Promise<cc.SpriteFrame> {
		let wait = this.waits_.find(v=>v.url == url)
		if(wait) {
			if(opt && opt.noWait) {
				return null 
			}
			kcore.log.info("[cache] wait load url = " + url)
			return <cc.SpriteFrame>await wait.wait.promise
		}
		let loaded = this.loaded_.find(v=>v.url == url)
		if(loaded) {
			kcore.log.info("[cache] load cached frame url = " + url)
			this._pushCache(url,loaded.frame)
			return loaded.frame
		}
		if(opt && opt.noLoad) {
			return null 
		}
		wait = {
			url:url,
			wait:new kcore.async.wait()
		}
		this.waits_.push(wait)

		let self = this 
		return await (new Promise<cc.SpriteFrame>(function(resolve,reject) {
			kcore.log.info("[cache] start to load url = " + url)
			cc.assetManager.loadRemote<cc.Texture2D>(url,function(err,texture){
				let idx = self.waits_.indexOf(wait)
				if(idx >= 0) {
					self.waits_.splice(idx,1)
				}
				if(err) {
					kcore.log.info("[cache] load url failed url = " + url,err)
					resolve(null)
					wait.wait.resolve(null)
					return 
				}
				let spriteFrame = new cc.SpriteFrame(texture)
				// FrameCache.frames.set(url,spriteFrame)
				self._pushCache(url,spriteFrame)
				resolve(spriteFrame)
				wait.wait.resolve(spriteFrame)
			})
		}))
	}
	async loadAsset<T extends cc.Asset>(url:string,type?:{prototype:T},opt?:{
		timeoutMS?:number,
		noWait?:boolean,	// 不等待重复加载
		noLoad?:boolean,	// 有缓存就返回，不然返回null
	}):Promise<T> {
		let wait = this.waits_.find(v=>v.url == url)
		if(wait) {
			if(opt && opt.noWait) {
				return null 
			}
			kcore.log.info("[cache] wait load url = " + url)
			return <T>await wait.wait.promise
		}
		let loaded = this.loadedAsset_.find(v=>v.url == url)
		if(loaded) {
			kcore.log.info("[cache] load cached frame url = " + url)
			this._pushCacheAsset(url,loaded.asset)
			return <T>loaded.asset
		}
		if(opt && opt.noLoad) {
			return null 
		}
		wait = {
			url:url,
			wait:new kcore.async.wait()
		}
		this.waits_.push(wait)

		let self = this 
		return await (new Promise<T>(function(resolve,reject) {
			kcore.log.info("[cache] start to load url = " + url)
			cc.assetManager.loadRemote<T>(url,function(err,asset){
				let idx = self.waits_.indexOf(wait)
				if(idx >= 0) {
					self.waits_.splice(idx,1)
				}
				if(err) {
					kcore.log.info("[cache] load url failed url = " + url,err)
					resolve(null)
					wait.wait.resolve(null)
					return 
				}
				self._pushCacheAsset(url,asset)
				resolve(asset)
				wait.wait.resolve(asset)
			})
		}))
	}
	protected _pushCache(url:string,frame:cc.SpriteFrame) {
		if(this.nodeStack_.length == 0) {
			return false
		}
		let last = this.nodeStack_[this.nodeStack_.length - 1]
		if(!last.frames.includes(frame)) {
			last.frames.push(frame)
			let loaded = this.loaded_.find(v=>v.frame == frame) 
			if(!loaded) {
				loaded = {
					url:url,
					frame:frame,
					count:0
				}
				frame.addRef()
				this.loaded_.push(loaded)
			}
			loaded.count ++
			kcore.log.info("[cache] retain count url = " + loaded.url + " | count = " + loaded.count)
		}
		return true 
	}
	protected _pushCacheAsset(url:string,asset:cc.Asset) {
		if(this.nodeStack_.length == 0) {
			return false
		}
		let last = this.nodeStack_[this.nodeStack_.length - 1]
		if(!last.assets.includes(asset)) {
			last.assets.push(asset)
			let loaded = this.loadedAsset_.find(v=>v.asset == asset) 
			if(!loaded) {
				loaded = {
					url:url,
					asset:asset,
					count:0
				}
				asset.addRef()
				this.loadedAsset_.push(loaded)
			}
			loaded.count ++
			kcore.log.info("[cache] retain count url = " + loaded.url + " | count = " + loaded.count)
		}
		return true 
	}
	pushStack(node:cc.Node) {
		if(this.nodeStack_.find(v=>v.node == node)) {
			return true 
		}
		kcore.log.info("[cache] push stack name = " + node.name)
		this.nodeStack_.push({
			node:node,
			frames:[],
			assets:[],
		})
		let self = this 
		kcore.nodeCycle.listenDestroy(node,function() {
			let idx = self.nodeStack_.findIndex(v=>v.node == node)
			if(idx < 0) {
				kcore.log.info("[cache] cannot find stack node = " + node.name)
				return 
			}
			kcore.log.info("[cache] pop stack name = " + node.name)
			let stack = self.nodeStack_[idx]
			for(let frame of stack.frames) {
				let idx = self.loaded_.findIndex(v=>v.frame == frame)
				let loaded = self.loaded_[idx]
				if(loaded) {
					loaded.count -- 
					kcore.log.info("[cache] release count url = " + loaded.url + " | count = " + loaded.count)
					if(loaded.count <= 0) {
						kcore.log.info("[cache] uncache frame url = " + loaded.url)
						self.loaded_.splice(idx,1)
						self.rootCom_.scheduleOnce(function() {
							loaded.frame.decRef()
							// cc.assetManager.releaseAsset(loaded.frame.getTexture())
							loaded.frame.destroy()
						})
						// cc.assetManager.releaseAsset(loaded.frame)
					}
				} else {
					kcore.log.info("[cache] cannot release frame url = " + loaded.url)
				}
			}
			for(let asset of stack.assets) {
				let idx = self.loadedAsset_.findIndex(v=>v.asset == asset)
				let loaded = self.loadedAsset_[idx]
				if(loaded) {
					loaded.count -- 
					kcore.log.info("[cache] release count url = " + loaded.url + " | count = " + loaded.count)
					if(loaded.count <= 0) {
						kcore.log.info("[cache] uncache asset url = " + loaded.url)
						self.loadedAsset_.splice(idx,1)
						self.rootCom_.scheduleOnce(function() {
							loaded.asset.decRef()
							// cc.assetManager.releaseAsset(loaded.asset)
							if(loaded.asset.isValid) {
								loaded.asset.destroy()
							}
						})
					}
				} else {
					kcore.log.info("[cache] cannot release asset url = " + loaded.url)
				}
			}
		})
		return true 
	}

	parseInternalAssetPath(kinUrl:string):string {
		if(kinUrl.indexOf("kin://") == 0) {
			return kinUrl.substring("kin://".length)
		}
		return null
	}
	get internalAssetUrlPrefix() {
		return "kin://"
	}
	// protected update(dt) {
	// 	if(this.configDirty) {
	// 		this._saveCacheConfig()
	// 		this.configDirty = false 
	// 	}
	// 	this.onUpdate(dt)
	// }
	// onUpdate(dt) {

	// }
	
	get rootDir() {
		return ""
	}
	mkdir(dir:string) {
		return false 
	}
	loadJson(path:string) {
		return null 		
	}
	loadContent(path:string) {
		return null 		
	}
	loadArrayBuffer(path:string) {
		return null 
	}
	saveJson(path:string,obj:any) {
		return false 
	}
	saveContent(path,content:string) {
		return false 
	}
	saveArrayBuffer(path:string,arrayBuffer:ArrayBuffer) {
		return false 
	}
	exist(path:string) {
		return false 
	}
	isDir(path:string) {
		return false 
	}
	isFile(path:string) {
		return false 
	}

	rmFile(path:string) {
		return false 
	}
	rmDir(dir:string) {
		return false 
	}
}