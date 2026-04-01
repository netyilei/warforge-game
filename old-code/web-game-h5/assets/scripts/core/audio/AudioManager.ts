import { rcUtils } from "../utils/Utils";

const {ccclass, property} = cc._decorator;


let ccAudioItem = cc.Class({
	name:"ccAudioItem",
	properties: {
		name:{
			default:"",
		},
		clip:{
			type:cc.AudioClip,
			default:null,
		},
		bundleAssetName:{
			default:"",
		},
	}
})
export type AudioItemType = {
	name:string,
	clip:cc.AudioClip,
	bundleAssetName:string,
}

export type AudioSettingType = {
	vol_effect:boolean,
	vol_bg:boolean,
}
let keyName = "pp_audio_setting"
let instance:AudioManager = null
@ccclass
export class AudioManager extends cc.Component implements kcore.IAudioManager {
	@property([ccAudioItem])
	audioDefines:AudioItemType[] = []

	static get instance() {
		return instance
	}
	onLoad() {
		instance = this 
	}

	start() {
		this.t_ = kcore.storage.getValue(keyName)
		if(this.t_ == null) {
			this.t_ = {
				vol_bg:true,
				vol_effect:true,
			}
			this.onConfigChanged()
		}
		window["kcore"] = window["kcore"] || <any>{}
		kcore.audio = this
	}

	private parsers_:{
		stack:any,
		parser:kcore.IAudioParser
	}[] = []
	private stacks_:any[] = []
	pushParserStack(obj:any) {
		this.stacks_.push(obj)
	}

	popParserStack(obj:any) {
		for(let i = this.parsers_.length - 1; i >= 0 ; i --) {
			let info = this.parsers_[i]
			if(info.stack == obj) {
				this.parsers_.splice(i,1)
			}
		}
		let idx = this.stacks_.indexOf(obj)
		if(idx >= 0) {
			this.stacks_.splice(idx,1)
		}
	}
	
	addParser(parser:kcore.IAudioParser) {
		let stack = this.stacks_.length > 0 ? this.stacks_[this.stacks_.length - 1] : null
		this.parsers_.push({
			stack,
			parser,
		})
	}

	private async getClip(name:string) {
		let parsedNames:string[]
		for(let i = this.parsers_.length - 1; i >= 0; i --) {
			let info = this.parsers_[i]
			parsedNames = info.parser.parse(name)
			if(parsedNames && parsedNames.length > 0) {
				break 
			}
		}
		if(!parsedNames || parsedNames.length == 0) {
			parsedNames = [name]
		}
		for(let name of parsedNames) {
			let def = this.audioDefines.find(v=>v.name == name)
			if(!def) {
				let clip = <cc.AudioClip>await kcore.bundle.loadAsset(name,cc.AudioClip)
				if(clip) {
					return clip
				}
				continue 
			}
			if(def.clip) {
				return def.clip
			}
			let assetName = def.bundleAssetName
			if(!assetName) {
				continue 
			}
			let clip = <cc.AudioClip>await kcore.bundle.loadAsset(assetName,cc.AudioClip)
			if(clip) {
				return clip
			}
		}
		return null 
	}
	private cacheMusicName_:string = null
	private cacheMusicClip_:cc.AudioClip = null 
	playMusic(name:string) {
		let self = this 
		if(this.cacheMusicName_ == name) {
			return true 
		}
		this.cacheMusicName_ = name 
		this.cacheMusicClip_ = null
		this.getClip(name).then(function(clip) {
			if(clip == null) {
				return
			}
			if(self.cacheMusicName_ != name) {
				return 
			}
			if(!self.musicEnabled) {
				return
			}
			cc.audioEngine.playMusic(clip,true)
			
		})
		return true 
	}
	playMusicClip(clip:cc.AudioClip) {
		if(this.cacheMusicClip_ == clip) {
			return true 
		}
		this.cacheMusicName_ = null 
		this.cacheMusicClip_ = clip
		if(clip == null) {
			return false
		}
		if(!this.musicEnabled) {
			return false 
		}
		cc.audioEngine.playMusic(clip,true)
		return true 
	}

	stopMusic() {
		this.cacheMusicName_ = null 
		this.cacheMusicClip_ = null 
		cc.audioEngine.stopMusic()
		
	}

	stopAllEffects() {
		cc.audioEngine.stopAllEffects()
	}

	playEffect(name:string,forcePlay?:boolean) {
		let self = this 
		this.getClip(name).then(function(clip) {
			if(clip == null) {
				return 
			}
			if(!self.effectEnabled && !forcePlay) {
				return 
			}
			cc.audioEngine.playEffect(clip,false)
		})
		return true 
	}

	playEffectClip(clip:cc.AudioClip,forcePlay?:boolean) {
		if(clip == null) {
			return false 
		}
		if(!this.effectEnabled && !forcePlay) {
			return false 
		}
		cc.audioEngine.playEffect(clip,false)
		return true 
	}

	playWebEffect(url:string,readyFunc?:Function,forcePlay?:boolean) {
		if(forcePlay == null) {
			forcePlay = false 
		}
		if(!this.effectEnabled && !forcePlay) {
			return false 
		}
		kcore.cache.loadAsset(url,cc.AudioClip)
		.then(function(clip) {
			if(clip == null) {
				kcore.log.info("load clip failed url = " + url)
				return 
			}
			readyFunc()
			let id = cc.audioEngine.playEffect(clip,false)
			// cc.audioEngine.setFinishCallback(id,function() {
			// 	kcore.log.info("release audio clip url = " + url)
			// 	setTimeout(function() {
			// 		cc.audioEngine.uncache(clip)
			// 		cc.loader.release(clip)
			// 	},1)
			// })
		})
	}

	playIDEffect(clip:cc.AudioClip,loop?:boolean,forcePlay?:boolean) {
		if(clip == null) {
			return -1 
		}
		if(!this.effectEnabled && !forcePlay) {
			return -1 
		}
		return cc.audioEngine.playEffect(clip,loop)
	}
	pauseEffect(id:number) {
		cc.audioEngine.pauseEffect(id)
	}
	resumeEffect(id:number) {
		cc.audioEngine.resumeEffect(id)
	}
	stopEffect(id:number) {
		cc.audioEngine.stopEffect(id)
	}
	
	get musicEnabled() {
		return this.t_.vol_bg
	}
	set musicEnabled(b) {
		let old = this.t_.vol_bg
		this.t_.vol_bg = b 
		if(b) {
			if(old != b) {
				let name = this.cacheMusicName_
				let clip = this.cacheMusicClip_
				this.cacheMusicName_ = null 
				this.cacheMusicClip_ = null 
				if(name) {
					this.playMusic(name)
				} else if(clip) {
					this.playMusicClip(clip)
				}
			}
		} else {
			cc.audioEngine.stopMusic()
		}
		this.onConfigChanged()
	}

	get effectEnabled() {
		return this.t_.vol_effect
	}
	set effectEnabled(b) {
		this.t_.vol_effect = b 
		this.onConfigChanged()
	}
	private t_:AudioSettingType 
	private onConfigChanged() {
		kcore.storage.setValue(keyName,this.t_)
	}
}

export namespace AudioManager {
	export function playMusic(name:string) {
		instance.playMusic(name)
	}
	export function playMusicClip(clip:cc.AudioClip) {
		instance.playMusicClip(clip)
	}
	export function playEffect(name:string,forcePlay?:boolean) {
		instance.playEffect(name,forcePlay)
	}
	export function playEffectClip(clip:cc.AudioClip,forcePlay?:boolean) {
		instance.playEffectClip(clip,forcePlay)
	}
	export function playWebEffect(url:string,readyFunc?:Function,forcePlay?:boolean) {
		instance.playWebEffect(url,readyFunc,forcePlay)
	}

	export function stopMusic() {
		instance.stopMusic()
	}

	export function stopAllEffects() {
		instance.stopAllEffects()
	}

	export function getMusicEnabled() {
		return instance.musicEnabled
	}

	export function setMusicEnabled(b:boolean) {
		instance.musicEnabled = b 
	}

	export function getEffectEnabled() {
		return instance.effectEnabled
	}

	export function setEffectEnabled(b:boolean) {
		instance.effectEnabled = b 
	}
}