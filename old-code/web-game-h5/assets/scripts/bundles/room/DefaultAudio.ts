import { DefaultAudio_CCDefine } from "./DefaultAudio_CCDefine"
import DefaultAudio_SubDefines from "./DefaultAudio_SubDefines"

const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("game/DefaultAudio")
export default class DefaultAudio extends cc.Component implements krenderer.IAudio {
	@property()
	defaultTheme:string = ""

	@property(DefaultAudio_CCDefine.ccDefaultAudioThemeDefine)
	commonDefine:DefaultAudio_CCDefine.DefaultAudioThemeDefine = null
	@property([DefaultAudio_CCDefine.ccDefaultAudioThemeDefine])
	themeDefines:DefaultAudio_CCDefine.DefaultAudioThemeDefine[] = []

	@property([cc.String])
	preloadPathsInBundle:string[] = []
	
	private theme_:string = null 
	get theme() {
		return this.theme_
	}
	set theme(v) {
		this.theme_ = v
	}

	private subDefines_:DefaultAudio_SubDefines[]
	protected onLoad(): void {
		window["krenderer"] = window["krenderer"] || <any>{}
		window["krenderer"].audio = this 
		this.theme = this.defaultTheme

		this.subDefines_ = this.getComponentsInChildren(DefaultAudio_SubDefines) || []
	}
	protected onDestroy(): void {
		if(window["krenderer"] && window["krenderer"].audio == this) {
			window["krenderer"].audio = null 
			if(this.bgName) {
				kcore.audio.stopMusic()
			}
		}
	}

	private bgName_:string = null 
	get bgName() {
		return this.bgName_
	}

	private allLoads_:{
		assetName:string,
		assetPath:string,
		clip:cc.AudioClip,
	}[] = []
	private loadInBGCaches:{
		theme:string,
		assetName:string,
		assetPath:string,
		clip:cc.AudioClip,
		complete:boolean
	}[] = []
	async preload(layer:kroom.IBaseGameLayer) {
		let ps = []
		let bundleName = kroom.env.bundleName
		if(!bundleName) {
			return false 
		}
		let map = kcore.bundle.bundleMaps.find(v=>v.name == bundleName)
		if(!map) {
			return false 
		}
		for(let path of this.preloadPathsInBundle) {
			if(path.lastIndexOf("/") != path.length - 1) {
				path += "/"
			}
			for(let assetName of map.assetNames) {
				if(assetName.startsWith(path)) {
					await this.loadAsset("",path)
					if(!layer.isValid) {
						return false 
					}
				}
			}
		}
		let defines = this.themeDefines.slice()
		defines.push(this.commonDefine)
		for(let sub of this.subDefines_) {
			defines.push(sub.commonDefine)
			for(let themeDefine of sub.themeDefines) {
				defines.push(themeDefine)
			}
		}
		for(let define of defines) {
			for(let clipDefine of define.clips) {
				if(clipDefine.loadMode == krenderer.AudioLoadMode.ForcePreload) {
					await this.loadAsset(define.basePathInBundle,clipDefine.assetName)
				}
			}
		}
		for(let define of defines) {
			for(let clipDefine of define.clips) {
				if(clipDefine.loadMode == krenderer.AudioLoadMode.PreloadBackground) {
					let assetPath = define.basePathInBundle ? define.basePathInBundle + clipDefine.assetName : clipDefine.assetName
					let cache = {
						theme:define.theme,
						assetName:clipDefine.assetName,
						assetPath,
						clip:null,
						complete:false
					}
					this.loadInBGCaches.push(cache)
					this.loadAsset(define.basePathInBundle,clipDefine.assetName,null,true)
					.then((clip)=>{
						if(!this.isValid) {
							return 
						}
						cache.complete = true 
						cache.clip = clip
						if(!clip) {
							this.onAssetLoaded(define.theme,clipDefine.name || clipDefine.assetName,clipDefine.assetName,null)
							return 
						}
						this.onAssetLoaded(define.theme,clipDefine.name || clipDefine.assetName,clipDefine.assetName,clip)
					})
				}
			}
		}
		return true 
	}
	
	protected findAudioAsset(name:string,theme?:string) {
		let clipDefine = this.commonDefine.clips.find(v=>v.name == name)
		if(clipDefine) {
			return {
				themeDefine:this.commonDefine,
				clipDefine,
			}
		}
		for(let sub of this.subDefines_) {
			let clipDefine = sub.commonDefine.clips.find(v=>v.name == name)
			if(clipDefine) {
				return {
					themeDefine:this.commonDefine,
					clipDefine,
				}
			}
		}
		for(let themeDefine of this.themeDefines) {
			if(theme !== undefined && themeDefine.theme != theme) {
				continue 
			}
			let clipDefine = themeDefine.clips.find(v=>v.name == name)

			if(clipDefine) {
				return {
					themeDefine,
					clipDefine,
				}
			}
		}
		for(let sub of this.subDefines_) {
			for(let themeDefine of sub.themeDefines) {
				if(theme !== undefined && themeDefine.theme != theme) {
					continue 
				}
				let clipDefine = themeDefine.clips.find(v=>v.name == name)
				if(clipDefine) {
					return {
						themeDefine,
						clipDefine,
					}
				}
			}
		}
		return null 
	}
	private actionCaches_:{
		theme:string,
		name:string,
		assetName:string,
		opt:krenderer.IAudioPlayOption
	}[] = []
	play(name: string, opt?: krenderer.IAudioPlayOption): boolean {
		return this.playTheme(this.theme,name,opt)
	}

	playTheme(theme: string, name: string, opt?: krenderer.IAudioPlayOption): boolean {
		let info = this.findAudioAsset(name,theme)
		if(!info && opt && opt.findAll) {
			info = this.findAudioAsset(name)
		}
		if(!info) {
			kcore.log.error("play audio failed theme define not found theme = " + this.theme + " name = " + name,opt)
			return false 

		}
		return this.playWithDefine(info.themeDefine,info.clipDefine,opt)
	}

	protected playWithDefine(themeDefine:krenderer.IAudioThemeDefine,clipDefine:krenderer.IAudioThemeClipDefine,opt?:krenderer.IAudioPlayOption) {
		if(opt && opt.asBG) {
			this.bgName_ = clipDefine.name || clipDefine.assetName
		}
		if(clipDefine.clip) {
			this.playWithClip(clipDefine.clip,opt)
			return true 
		}
		let assetPath = themeDefine.basePathInBundle ? themeDefine.basePathInBundle + clipDefine.assetName : clipDefine.assetName
		switch(clipDefine.loadMode) {
			case krenderer.AudioLoadMode.ForcePreload:{
				let loaded = this.allLoads_.find(v=>v.assetPath == assetPath)
				if(!loaded || !loaded.clip) {
					kcore.log.error("play def audio failed force preload not found name = " + clipDefine.assetName)
					return false 
				}
				this.playWithClip(loaded.clip,opt)
			} break 
			case krenderer.AudioLoadMode.PreloadBackground:{
				let loaded = this.allLoads_.find(v=>v.assetPath == assetPath)
				if(loaded) {
					this.playWithClip(loaded.clip,opt)
					return true 
				}
				let cache = this.loadInBGCaches.find(v=>v.assetPath == assetPath)
				if(cache && cache.complete && !cache.clip) {
					kcore.log.error("play def audio failed bg loaded not valid name = " + clipDefine.assetName)
					return false 
				}
				if(cache && cache.clip) {
					this.playWithClip(cache.clip,opt)
				} else {
					let ret = false 
					if(opt && opt.forcePlay) {
						let action = this.actionCaches_.find(v=>v.assetName == clipDefine.assetName && (v.opt && opt && v.opt.asBG == opt.asBG))
						if(!action) {
							action = {
								theme:themeDefine.theme,
								name:clipDefine.name || clipDefine.assetName,
								assetName:clipDefine.assetName,
								opt,
							}
							this.actionCaches_.push(action)
						}
						ret = true 
					}
					// if(!cache) {
					// 	cache = {
					// 		theme:themeDefine.theme,
					// 		assetName:clipDefine.assetName,
					// 		assetPath,
					// 		clip:null,
					// 		complete:false
					// 	}
					// 	this.loadInBGCaches.push(cache)
					// 	this.loadAsset(themeDefine.basePathInBundle,clipDefine.assetName,null,true)
					// 	.then((clip)=>{
					// 		if(!this.isValid) {
					// 			return 
					// 		}
					// 		cache.complete = true 
					// 		cache.clip = clip
					// 		if(!clip) {
					// 			this.onAssetLoaded(themeDefine.theme,clipDefine.name || clipDefine.assetName,clipDefine.assetName,null)
					// 			return 
					// 		}
					// 		this.onAssetLoaded(themeDefine.theme,clipDefine.name || clipDefine.assetName,clipDefine.assetName,clip)
					// 	})
					// } 
					return ret 
				}
			} break 
			case krenderer.AudioLoadMode.Normal:{
				let loaded = this.allLoads_.find(v=>v.assetPath == assetPath)
				if(loaded && !loaded.clip) {
					kcore.log.error("play def audio failed preload clip not found name = " + clipDefine.assetName)
					return false 
				}
				if(loaded) {
					this.playWithClip(loaded.clip,opt)
				} else {
					opt = opt || {
						forcePlay:true
					}
					let ret = false 
					if(opt && opt.forcePlay) {
						let action = this.actionCaches_.find(v=>v.assetName == clipDefine.assetName && (v.opt && opt && v.opt.asBG == opt.asBG))
						if(!action) {
							action = {
								theme:themeDefine.theme,
								name:clipDefine.name || clipDefine.assetName,
								assetName:clipDefine.assetName,
								opt,
							}
							this.actionCaches_.push(action)
						}
						ret = true 
					}
					this.loadAsset(themeDefine.basePathInBundle,clipDefine.assetName,null,true)
					.then((clip)=>{
						if(!this.isValid) {
							return 
						}
						if(!clip) {
							this.onAssetLoaded(themeDefine.theme,clipDefine.name || clipDefine.assetName,clipDefine.assetName,null)
							return 
						}
						this.onAssetLoaded(themeDefine.theme,clipDefine.name || clipDefine.assetName,clipDefine.assetName,clip)
					})
					return ret 
				}
			} break 
		}
		return true 
	}

	protected playWithClip(clip:cc.AudioClip,opt?:krenderer.IAudioPlayOption) {
		if(opt && opt.asBG) {
			kcore.audio.playMusicClip(clip)
			kcore.log.info("play bg clip name = " + clip.name,opt)
		} else {
			kcore.audio.playEffectClip(clip)
			kcore.log.info("play effect clip name = " + clip.name,opt)
		}
	}

	private loadings_:{
		assetPath:string,
		wait:kcore.async.wait<cc.AudioClip>
	}[] = []
	protected async loadAsset(basePath:string,assetName:string,bundleName?:string,ignoreBlock?:boolean) {
		let bundleNames = bundleName ? [bundleName] : kcore.bundle.loadedBundleNames
		let assetPath = basePath ? basePath + assetName : assetName
		let cache = this.loadings_.find(v=>v.assetPath == assetPath)
		if(cache) {
			let ret = await cache.wait.promise
			if(this.isValid) {
				return ret 
			}
			return null 
		}
		for(let i = bundleNames.length - 1 ; i >= 0 ; i --) {
			let bundleName = bundleNames[i]
			let map = kcore.bundle.bundleMaps.find(v=>v.name == bundleName)
			if(!map.assetNames.includes(assetPath)) {
				continue 
			}
			let wait = new kcore.async.wait<cc.AudioClip>()
			let t = {
				assetPath,wait,
			}
			this.loadings_.push(t)
			let asset = await kcore.bundle.loadAssetInBundle(assetPath,bundleName,cc.AudioClip,ignoreBlock)
			if(this.isValid) {
				let loaded = this.allLoads_.find(v=>v.assetPath == assetPath)
				if(!loaded) {
					this.allLoads_.push({
						assetName:assetName,
						assetPath,
						clip:asset,
					})
				}
				wait.resolve(asset)
				return asset
			}
		}
		return null 
	}
	protected onAssetLoaded(theme:string,name:string,assetName:string,clip:cc.AudioClip) {
		for(let i = this.actionCaches_.length - 1 ; i >= 0 ; i --) {
			let action = this.actionCaches_[i]
			if(action.name == name && action.theme == theme && action.assetName == assetName) {
				this.actionCaches_.splice(i,1)
				if(clip) {
					kcore.log.error("play cache action",action)
					this.playWithClip(clip,action.opt)
				} else {
					kcore.log.error("play cache action failed clip is null",action)
				}
			}
		}
	}
}