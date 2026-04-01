import { rcUtils, rcApis } from "../utils/Utils"

namespace FrameCache {
	export let frames = new Map<string,cc.SpriteFrame>()
	export function clear() {
		frames.forEach(function(frame) {
			frame.destroy()
		})
	}
	export function clearUnused() {
		let keys:string[] = []
		
		frames.forEach(function(frame,key) {
			if(frame.refCount == 1) {
				frame.destroy()
				keys.push(key)
			}
		})
		for(let key of keys) {
			frames.delete(key)
		}
	}
}
class _Internal_Display implements kcore.IDisplay {
	newSprite(params:{
		frame?:cc.SpriteFrame,
		url?:string,

		size?:cc.Size,
		scale?:number,
		pos?:cc.Vec2,

		color?:cc.Color,
		opacity?:number,
	}) {
		let node = new cc.Node()
		let sprite = node.addComponent(cc.Sprite)
		if(params.frame) {
			sprite.spriteFrame = params.frame
		} else {
			if(params.url) {
				rcUtils.loadRes(params.url,cc.SpriteFrame)
				.then(rcApis.lifeFunc(node,function(frame) {
					sprite.spriteFrame = frame
				}))
			} else {

			}
		}
		if(params.pos) {
			node.position2 = params.pos 
		}
		if(params.size) {
			sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
			node.setContentSize(params.size )
		}
		if(params.scale != null) {
			node.scale = params.scale
		}
		if(params.color != null) {
			node.color = params.color
		}
		if(params.opacity != null) {
			node.opacity = params.opacity
		}
		return sprite 
	}

	newNode(params:{
		pos?:cc.Vec2,
		size?:cc.Size,
		scale?:number,
	}) {
		let node = new cc.Node()
		if(params.pos) {
			node.position2 = params.pos 
		}
		if(params.size) {
			node.setContentSize(params.size )
		}
		if(params.scale != null) {
			node.scale = params.scale
		}
		return node 
	}

	setupSprite(sprite:cc.Sprite,spriteFrame:cc.SpriteFrame,size?:cc.Size,autoRef?:boolean) {
		if(!sprite.isValid) {
			return 
		}
		if(spriteFrame) {
			sprite.spriteFrame = spriteFrame
			sprite.node.opacity = 255
		} else {
			sprite.node.opacity = 0
		}
		if(size) {
			sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
			sprite.node.setContentSize(size)
		} else {
			//sprite.sizeMode = cc.Sprite.SizeMode.RAW
		}
		if(spriteFrame && autoRef) {
			// spriteFrame.addRef()
			// rcDestroy(sprite.node,function() {
			// 	spriteFrame.decRef()
			// })
		}
	}

	async loadWebTexture(url:string,node?:cc.Node) {
		if(!url	|| url.length == 0 || url.toUpperCase() == "NULL") {
			return null 
		}
		let frame = FrameCache.frames.get(url)
		if(frame) {
			return frame
		}
		let internalAssetName = kcore.cache.parseInternalAssetPath(url)
		if(internalAssetName) {
			let frame = await kcore.bundle.loadAsset<cc.SpriteFrame>(internalAssetName,cc.SpriteFrame)
			if(frame) {
				FrameCache.frames.set(url,frame)
			}
			return frame
		}
		if(kcore.cache) {
			return await kcore.cache.loadImg(url)
		}
		return new Promise<cc.SpriteFrame>((resolve,reject)=> {
			kcore.log.info("[display] start to load url = " + url)
			cc.assetManager.loadRemote<cc.Texture2D>(url,(err,texture)=>{
				if(err) {
					kcore.log.info("[display] load url failed url = " + url)
					kcore.log.info("",err)
					resolve(null)
					return 
				}
				let spriteFrame = new cc.SpriteFrame(texture)
				// FrameCache.frames.set(url,spriteFrame)
				resolve(spriteFrame)
			})
		})
	}

	protected setSpriteUrl(sprite:cc.Sprite,url?:string) {
		sprite["__d_load_url"] = url 
	}
	protected getSpriteUrl(sprite:cc.Sprite) {
		return sprite["__d_load_url"]
	}

	isValidUrl(url:string) {
		if(!url	|| url.length == 0 || url.toUpperCase() == "NULL") {
			return false 
		}
		if(url.indexOf("http://") != 0 && url.indexOf("https://") != 0 && url.indexOf(kcore.cache.internalAssetUrlPrefix) != 0) {
			return false 
		}
		return true
	}
	setWebTexture(sprite:cc.Sprite,url:string,size?:cc.Size,defaultSpriteFrame?:cc.SpriteFrame) {
		this.setSpriteUrl(sprite)
		if(!this.isValidUrl(url)) {
			this.setupSprite(sprite,defaultSpriteFrame,size)
			return false 
		}
		this.setSpriteUrl(sprite,url)
		// let frame = FrameCache.frames.get(url)
		// if(frame) {
		// 	setupSprite(sprite,frame,size)
		// 	return true 
		// }
		this.loadWebTexture(url,sprite.node)
		.then((frame)=>{
			if(frame == null) {
				this.setupSprite(sprite,defaultSpriteFrame,size)
				return 
			}
			if(this.getSpriteUrl(sprite) != url) {
				kcore.log.info("[display] load url cancelled url = " + url)
				return 
			}
			this.setupSprite(sprite,frame,size)
		})
		return true 
	}

	setWebTextureOpt(sprite:cc.Sprite,url:string,opt?:{
		size?:cc.Size,
		defaultSpriteFrame?:cc.SpriteFrame,
		func?:(frame:cc.SpriteFrame)=>any,
	}) {
		opt = opt || {}
		this.setSpriteUrl(sprite)
		if(!this.isValidUrl(url)) {
			this.setupSprite(sprite,opt.defaultSpriteFrame,opt.size)
			return false 
		}
		this.setSpriteUrl(sprite,url)
		let frame = FrameCache.frames.get(url)
		if(frame) {
			this.setupSprite(sprite,frame,opt.size)
			if(opt.func) {
				opt.func(frame)
			}
			return true 
		}
		this.loadWebTexture(url,sprite.node).then((spriteFrame)=> {
			if(spriteFrame == null) {
				this.setupSprite(sprite,opt.defaultSpriteFrame,opt.size)
				return 
			}
			if(this.getSpriteUrl(sprite) != url) {
				kcore.log.info("[display] load url cancelled url = " + url)
				return 
			}
			this.setupSprite(sprite,spriteFrame,opt.size)
			if(opt.func) {
				opt.func(spriteFrame)
			}
		})
		return true 
	}

	private onSpriteStyleReset(sprite:cc.Sprite,style:"opacity" | "active",defaultSpriteFrame?:cc.SpriteFrame) {
		if(style == "opacity") {
			sprite.node.opacity = 0
		} else if(style == "active") {
			sprite.node.active = false
		}
		if(defaultSpriteFrame) {
			this.setupSprite(sprite,defaultSpriteFrame)
		}
	}
	private onSpriteStyleEnd(sprite:cc.Sprite,style:"opacity" | "active",frame?:cc.SpriteFrame,defaultSpriteFrame?:cc.SpriteFrame) {
		if(!frame) {
			this.onSpriteStyleReset(sprite,style,defaultSpriteFrame)
			return
		}
		if(style == "opacity") {
			sprite.node.opacity = 255
		} else if(style == "active") {
			sprite.node.active = true
		}
		sprite.spriteFrame = frame
	}
	setWebTextureStyle(sprite:cc.Sprite,url:string,opt:{
		style:"opacity" | "active",
		defaultSpriteFrame?:cc.SpriteFrame,
		func?:(frame:cc.SpriteFrame)=>any,
	}) {
		this.setSpriteUrl(sprite)
		if(!this.isValidUrl(url)) {
			this.onSpriteStyleReset(sprite,opt.style,opt.defaultSpriteFrame)
			return false 
		}
		this.setSpriteUrl(sprite,url)
		this.onSpriteStyleReset(sprite,opt.style,opt.defaultSpriteFrame)
		let frame = FrameCache.frames.get(url)
		if(frame) {
			this.onSpriteStyleEnd(sprite,opt.style,frame,opt.defaultSpriteFrame)
			if(opt.func) {
				opt.func(frame)
			}
			return true 
		}
		this.loadWebTexture(url,sprite.node).then((spriteFrame)=> {
			if(spriteFrame == null) {
				this.onSpriteStyleEnd(sprite,opt.style,null,opt.defaultSpriteFrame)
				return 
			}
			if(this.getSpriteUrl(sprite) != url) {
				kcore.log.info("[display] load url cancelled url = " + url)
				return 
			}
			this.onSpriteStyleEnd(sprite,opt.style,spriteFrame,opt.defaultSpriteFrame)
			if(opt.func) {
				opt.func(spriteFrame)
			}
		})
		return true 
	}

	instantiate(prefab:cc.Prefab | cc.Node) {
		let node = <cc.Node>cc.instantiate(prefab)
		let coms = node.getComponents(cc.Component)
		for(let com of coms) {
			let func = com["kdsInit"]
			if(func && typeof(func) == "function") {
				try {
					func.apply(com)
				} catch (error) {
					kcore.log.info("exception in kdsInit", error)					
				}
			}
		}
		node.position2 = cc.v2()
		return node 
	}
	
	createAnimation(prefab:cc.Prefab):cc.Animation {
		let node = cc.instantiate(prefab)
		if(node) {
			let animation = node.getComponent(cc.Animation)
			if(animation) {
				return animation
			}
			node.destroy()
			node = null
		}
		return null
	}
}

export const Display = new _Internal_Display