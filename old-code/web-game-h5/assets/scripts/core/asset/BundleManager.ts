import { BundleCache, BundleMapInfo, BundleStatus } from "./BundleDefines";


const {ccclass, property, requireComponent} = cc._decorator;


@ccclass
export class BundleManager extends cc.Component implements kcore.IBundleManager{
	@property()
	defaultBundlePrefix:string = ""
	@property(cc.JsonAsset)
	textBundleMap:cc.JsonAsset = null

	private static instance_:BundleManager = null 
	static get instance() {
		return BundleManager.instance_
	}

	private bundleUrlPrefix_:string = ""
	get bundleUrlPrefix() {
		return this.bundleUrlPrefix_
	}
	set bundleUrlPrefix(v) {
		if(v[v.length - 1] != "/") {
			v += "/"
		}
		this.bundleUrlPrefix_ = v
	}

	private bundleMaps_:BundleMapInfo[] = []
	get bundleMaps() {
		return this.bundleMaps_
	}
	get loadedBundleNames() {
		return this.caches_.map(v=>v.name)
	}
	
	private caches_:BundleCache[] = []
	onLoad() {
		BundleManager.instance_ = this 
		window["kcore"] = window["kcore"] || <any>{}
		kcore.bundle = this 

		let win:any = window 
		if(win.bundleUrlPrefix) {
			this.bundleUrlPrefix = win.bundleUrlPrefix
		} else {
			this.bundleUrlPrefix = this.defaultBundlePrefix
		}
		if(this.textBundleMap) {
			// let str = this.textBundleMap.text
			// kcore.log.info("load bundle map config")
			// try {
			// 	let t = JSON.parse(str)
			// 	if(t) {
			// 		this.bundleMaps_ = t 
			// 		for(let info of this.bundleMaps_) {
			// 			kcore.log.info("bundleName = " + info.name + " asset count = " + info.assetNames.length)
			// 		}
			// 	}
			// } catch(err) {
			// 	console.log("load bundle map failed err = ",err)
			// 	this.bundleMaps_ = []
			// }
			this.bundleMaps_ = this.textBundleMap.json
		}
	}	
	async loadAssetInBundle<T extends cc.Asset>(name:string,bundleName:string,type?:{prototype:T},ignoreBlock?:boolean):Promise<T> {
		try {
			kcore.log.info("[bundle] start to load asset name = " + name + " | bundle = " + bundleName)
			let def = this.bundleMaps_.find(v=>v.name == bundleName)
			if(def == null) {
				kcore.log.info("[bundle] cannot find bundle = " + bundleName)
				return null
			}
			let cache = this.caches_.find(v=>v.name == bundleName) 
			if(cache == null) {
				let bundle = await this.loadBundle(bundleName)
				if(bundle == null) {
					kcore.log.info("[bundle] load asset failed bundle load failed asset = " + name + " bundle = " + bundleName)
					return null 
				}
				cache = this.caches_.find(v=>v.name == bundleName) 
			}
			if(cache.bundle == null) {
				if(cache.promise == null) {
					kcore.log.info("[bundle] cannot wait bundle loaded promise is null bundle = " + bundleName)
					return null 
				}
				await cache.promise
			}
			if(cache.bundle == null) {
				kcore.log.info("[bundle] bundle load failed bundle = " + bundleName)
				return null 
			}
			let loaded = cache.loadedAssets.find(v=>v.name == "name")
			if(loaded) {
				return <T>loaded.asset
			}
			let content = "正在加载资源"
			if(!CC_BUILD) {
				content += "|" + name
			}
			let blocker = kcore.block.create(content,this.node)
			if(!ignoreBlock) {
				blocker.start(true)
			}
			kcore.log.info("[bundle] load asset in bundle asset = " + name + " bundle = " + bundleName)
			return new Promise<T>(function(resolve,reject) {
				cache.bundle.load(name,type || cc.Asset,function(err,asset) {
					blocker.stop()
					if(err) {
						kcore.log.info("[bundle] load asset failed name = " + name + " err = ",err)
						resolve(null)
						return null 
					}
					cache.loadedAssets.push({
						name:name,
						asset:asset
					})
					resolve(<T>asset)
				})
			})
		} catch (error) {
			kcore.log.info("[bundle] load asset error name = " + name + " error = ",error)
			return null
		} finally {
		}
	}

	async loadAsset<T extends cc.Asset>(name:string,type?:{prototype:T},ignoreBlock?:boolean):Promise<T> {
		try {
			kcore.log.info("[bundle] start to load asset name = " + name)
			let bundleName = this.getBundleNameByAssetName(name,true)
			
			if(bundleName == null) {
				bundleName = this.getBundleNameByAssetName(name,false)
				console.log(bundleName);
				if(bundleName == null) {
					kcore.log.info("[bundle] cannot find bundle name by asset")
					return null 
				}
				let bundle = await this.loadBundle(bundleName)
				if(bundle == null) {
					kcore.log.info("[bundle] load asset failed bundle load failed asset = " + name + " bundle = " + bundleName)
					return null 
				}
			}
			let cache = this.caches_.find(v=>v.name == bundleName)
			if(cache.bundle == null) {
				if(cache.promise == null) {
					kcore.log.info("[bundle] assert by load asset name = " + name + " bundleName = " + bundleName)
					return null 
				}
				kcore.log.info("[bundle] wait for bundle loaded when load asset name = " + name + " bundleName = " + bundleName)
				await cache.promise
				if(cache.bundle == null) {
					kcore.log.info("[bundle] wait bundle load failed bundle = " + bundleName)
					//return await this.loadAsset(name)
					return null 
				}
			}
			let info = cache.loadedAssets.find(v=>v.name == name)
			if(info) {
				return <T>info.asset
			}
			
			let content = "正在加载资源"
			if(!CC_BUILD) {
				content += "|" + name
			}
			let blocker = kcore.block.create(content,this.node)
			if(!ignoreBlock) {
				blocker.start(true)
			}
			kcore.log.info("[bundle] load asset in bundle asset = " + name + " bundle = " + bundleName)
			return new Promise<T>(function(resolve,reject) {
				cache.bundle.load(name,type || cc.Asset,function(err,asset) {
					blocker.stop()
					if(err) {
						kcore.log.info("[bundle] load asset failed name = " + name + " err = ",err)
						resolve(null)
						return null 
					}
					cache.loadedAssets.push({
						name:name,
						asset:asset
					})
					resolve(<T>asset)
				})
			})
		} catch (error) {
			kcore.log.info("[bundle] load asset error name = " + name + " error = ",error)
			return null
		} finally {
		}
	}

	async loadPrefab(name:string,ignoreBlock?:boolean) {
		return <cc.Prefab>await this.loadAsset(name,cc.Prefab,ignoreBlock)
	}

	getBundleNameByAssetName(name:string,inLoad?:boolean) {
		if(inLoad) {
			for(let i = this.caches_.length - 1 ; i >= 0 ; i --) {
				let cache = this.caches_[i]
				let info = this.bundleMaps_.find(v=>v.name == cache.name)
				if(info) {
					if(info.assetNames.indexOf(name) >= 0) {
						return info.name 
					}
				}
			}
		} else {
			for(let info of this.bundleMaps_) {
				if(info.assetNames.indexOf(name) >= 0) {
					console.log(info);
					return info.name
				}
			}
		}
		return null 
	}

	getDepsLoop(bundleName:string,opt?:{
		containsLoaded?:boolean,
		containsSelf?:boolean,
	}) {
		opt = opt || {}

		let ret:string[] = []
		let self = this 
		let func = function(name:string) {
			if(name == bundleName && !opt.containsSelf) {
				return 
			}
			let cache = self.caches_.find(v=>v.name == name)
			if(!opt.containsLoaded) {
				if(cache && cache.bundle) {
					return 
				}
			}
			let def = self.bundleMaps_.find(v=>v.name == name)
			if(def == null) {
				return null 
			}
			ret.splice(0,0,name)
			for(let dep of def.deps) {
				if(ret.indexOf(dep) < 0) {
					func(dep)
				}
			}
		}
		func(bundleName)
		return ret 
	}
	async loadBundle(name:string) {
		let content = "正在加载资源"
		if(!CC_BUILD) {
			content += "|" + name
		}
		let blocker = kcore.block.create(content,this.node)

		blocker.start(true)
		try {
			let self = this 
			kcore.log.info("[bundle] start to load bundle name = " + name)
			let cache = this.caches_.find(v=>v.name == name)
			if(cache) {
				return await this.loadSingleBundle(name)
			}

			let loadNames = self.getDepsLoop(name,{
				containsLoaded:false,
				containsSelf:true,
			})
			if(loadNames.length == 0) {
				kcore.log.info("[bundle] load bundle with except: deps empty name = " + name)
				return null 
			}

			let originCache = cache
			let progress:kcore.BundleProgressDataType = {
				getProgress:function() {
					// defence
					if(loadNames.length == 0) {
						return 0
					}

					let per = 0
					for(let name of loadNames) {
						let cache = self.caches_.find(v=>v.name == name)
						if(cache) {
							per += (cache.progress.per / loadNames.length)
						}
					}
					return cc.misc.clamp01(per)
				}
			}
			let rt = {
				abandon:false 
			}
			kcore.data.set(kcore.bundleProgressDataPath,progress)
			let ps = []
			for(let bundleName of loadNames) {
				let rName = bundleName
				let promise:Promise<cc.AssetManager.Bundle> = this.loadSingleBundle(bundleName,bundleName != name)
				promise.then(function(bundle) {
					if(rt.abandon) {
						kcore.log.info("[bundle] abandon load bundle name = " + rName)
						self.afterLoadFailed(name)
						return 
					}
					if(bundle == null) {
						kcore.log.info("[bundle] load failed dep = " + bundleName + " name = " + name)
						rt.abandon = true 
						self.afterLoadFailed(name)
						return null 
					}
					let cache = self.caches_.find(v=>v.name == bundleName)
					if(cache == null) {
						kcore.log.info("[bundle] load interrupt dep = " + bundleName + " name = " + name)
						return null 
					}
					kcore.data.change(kcore.bundleProgressDataPath)
				})
				ps.push(promise)
			}
			await Promise.all(ps)
			cache = this.caches_.find(v=>v.name == name)
			return cache ? cache.bundle : null
		} catch (error) {
			kcore.log.info("[bundle] load bundle error name = " + name + " error = ",error)
			return null 
		} finally {
			blocker.stop()
		}
	}

	async loadSingleBundle(name:string,isDep?:boolean) {
		let content = "正在加载资源"
		if(!CC_BUILD) {
			content += "|" + name
		}
		let blocker = kcore.block.create(content,this.node)
		blocker.start()
		try {
			kcore.log.info("[bundle] start to load single bundle name = " + name)
			let cache = this.caches_.find(v=>v.name == name)
			if(cache) {
				if(cache.bundle) {
					kcore.log.info("[bundle] bundle already loaded name = " + name)
					return cache.bundle
				}
				kcore.log.info("[bundle] wait prev load name = " + name)
				return await cache.promise
			}
			
			let mapInfo = this.bundleMaps_.find(v=>v.name == name)
			let url = name
			if(!(cc.sys.platform === cc.sys.WECHAT_GAME)) {

			} else if((mapInfo && mapInfo.remote) && CC_BUILD) {
				if(this.bundleUrlPrefix.length == 0) {
					kcore.log.info("[bundle] load bundle failed url prefix not exist name = " + name)
					return null 
				}
				url = this.bundleUrlPrefix + mapInfo.name
			} 
			cache = {
				name:name,
				bundle:null,
				status:BundleStatus.Loading,

				loadedAssets:[],
				loadByDep:isDep != null ? isDep : false,

				promise:null,

				progress:{
					totalBytes:1,
					per:0,
				}
			}
			// if(CC_WECHATGAME && mapInfo && !mapInfo.remote) {
			// 	let b = await this.loadSubpackageInWechat(name)
			// 	if(!b) {
			// 		kcore.log.info("wechat subpackage preload failed name = " + name)
			// 		return null 
			// 	}
			// }
			this.caches_.push(cache)
			
			let self = this 
			cache.promise = new Promise<cc.AssetManager.Bundle>(function(resolve,reject) {
				cc.assetManager.loadBundle(url,{onFileProgress:function(loaded,total){
					if(typeof(loaded) == "object") {
						cache.progress.totalBytes = loaded.totalBytesExpectedToWrite || 1
						cache.progress.per = cc.misc.clamp01((loaded.progress || 0) * 0.01)
					} else {
						cache.progress.totalBytes = total || 1
						cache.progress.per = cc.misc.clamp01((loaded || 0) / (total || 1))
					}
				}},function(err,bundle) {
					blocker.stop()
					let idx = self.caches_.findIndex(v=>v == cache)
					if(idx < 0) {
						kcore.log.info("[bundle] bundle load abandon name = " + name)
						if(bundle) {
							cc.assetManager.removeBundle(bundle)
						}
						resolve(null)
						return 
					}
					let curCache = self.caches_[idx]
					if(err) {
						if(bundle) {
							kcore.log.info("bundle is not null = ",bundle)
							cc.assetManager.removeBundle(bundle)
						} else {
							// kcore.log.info("remove bundle cache name = " + name )
							// cc.assetManager.removeBundle(<any>{
							// 	_destroy:function(){},
							// 	name:name,
							// })
						}
						// if(Config.wechatPlatform) {
						// 	let dir = "subpackages/" + name 
						// 	kcore.log.info("remove dir = " + dir)
						// 	wx.getFileSystemManager().rmdirSync(dir,true)
						// }
						kcore.log.info("[bundle] load bundle failed err = ",err)
						self.caches_.splice(idx,1)
						resolve(null)
						return 
					}
					curCache.bundle = bundle 
					curCache.promise = null 
					resolve(bundle)
				})
			})
			return await cache.promise
		} catch (error) {
			kcore.log.info("[bundle] load single bundle error name = " + name + " error = ",error)
			return null 
		} finally {
			blocker.stop()
		}
	}

	afterLoadFailed(name:string) {
		kcore.log.info("[bundle] afterLoadFailed name = " + name)
		for(let i = this.caches_.length - 1 ; i >= 0 ; i --) {
			let cache = this.caches_[i]
			let remove = cache.name == name || cache.loadByDep
			if(!remove) {
				return 
			}
			kcore.log.info("[bundle] clear bundle name = " + cache.name)
			if(cache.bundle) {
				cc.assetManager.removeBundle(cache.bundle)
			}
			this.caches_.splice(i,1)
		}
	}

	unloadAsset(asset:cc.Asset) {
		for(let cache of this.caches_) {
			let idx = cache.loadedAssets.findIndex(v=>v.asset == asset)
			if(idx >= 0) {
				cache.loadedAssets.splice(idx,1)
				cc.assetManager.releaseAsset(asset)
				return true 
			}
		}
	}

	unloadAllBundles(unloadAllAssets?:boolean) {
 		for(let info of this.caches_) {
			 if(info.bundle) {
				 //info.bundle.releaseAll()
				//  if(unloadAllAssets) {
					 info.bundle.releaseAll()
				//  }
				 cc.assetManager.removeBundle(info.bundle)
			 }
		}
		this.caches_.splice(0)
	}


	clearProgress() {
		kcore.data.set(kcore.bundleProgressDataPath,null)
	}
}