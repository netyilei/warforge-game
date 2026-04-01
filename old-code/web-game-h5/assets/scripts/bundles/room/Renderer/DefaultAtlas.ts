import BaseSkin from "./Skin/BaseSkin"

const { ccclass, property, menu } = cc._decorator

enum RType {
	Card,
	HandCards,
	Background,
	Timer,
}

const ccDefaultAtlasSkinPrefabDefine = cc.Class({
	name:"ccDefaultAtlasSkinPrefabDefine",
	properties:{
		name:{
			default:""
		},
		prefab:{
			type:cc.Prefab,
			default:null 
		}
	}
})
type DefaultAtlasSkinPrefabDefine = {
	name:string,
	prefab:cc.Prefab,
}

const ccDefaultAtlasSelfSkinDefine = cc.Class({
	name:"ccDefaultAtlasSelfSkinDefine",
	properties:{
		name:{
			default:""
		},
		skin:{
			type:BaseSkin,
			default:null 
		}
	}
})
type DefaultAtlasSelfSkinDefine = {
	name:string,
	skin:BaseSkin
}

const ccDefaultAtlasTemplateDefine = cc.Class({
	name:"ccDefaultAtlasTemplateDefine",
	properties:{
		type:{
			type:cc.Enum(RType),
			default:RType.Card,
		},
		prefab:{
			type:cc.Prefab,
			default:null,
		},
		node:{
			type:cc.Node,
			default:null,
		},
	}
})
type DefaultAtlasTemplateDefine = {
	type:RType,
	prefab:cc.Prefab,
	node:cc.Node
}
@ccclass
@menu("game/DefaultAtlas")
export default class DefaultAtlas extends cc.Component implements krenderer.IAtlas {
	@property([ccDefaultAtlasSkinPrefabDefine])
	skinPrefabDefines:DefaultAtlasSkinPrefabDefine[] = []
	@property([ccDefaultAtlasSelfSkinDefine])
	selfSkinDefines:DefaultAtlasSelfSkinDefine[] = []
	@property([ccDefaultAtlasTemplateDefine])
	templates:DefaultAtlasTemplateDefine[] = []
	
	protected onLoad(): void {
		window["krenderer"] = window["krenderer"] || <any>{}
		window["krenderer"].atlas = this 

		this.disp_ = kcore.disp()
		try {
			for(let define of this.skinPrefabDefines) {
				this.loadSkinPrefab(define.prefab,define.name)
			}
			for(let define of this.selfSkinDefines) {
				this.loadSkin(define.name,define.skin)
			}
		} catch (error) {
			kcore.log.error("error in atlas init",error)
		}

		this.setDefaultSkin(krenderer.RType.Card)
		this.setDefaultSkin(krenderer.RType.HandCards)
		this.setDefaultSkin(krenderer.RType.Background)
		this.setDefaultSkin(krenderer.RType.Timer)
		this.setDefaultSkin(krenderer.RType.CardBack)
	}
	protected onDestroy(): void {
		if(window["krenderer"] && window["krenderer"].atlas == this) {
			window["krenderer"].atlas = null 
		}
	}
	private disp_:kcore.IEventDispatcher
	get disp() {
		return this.disp_
	}

	private skins_:{
		name:string,
		prefab?:cc.Prefab,
		prefabName?:string,
		skin:krenderer.ISkin,
	}[] = []

	private renderers_:{
		renderer:krenderer.IRenderer,
		skin:krenderer.ISkin,
		skin2?:krenderer.ISkin,
	}[] = []
	loadSkinPrefab(prefab: cc.Prefab, rename?: string) {
		let name = rename || prefab.name
		let skin:krenderer.ISkin
		let node = kcore.display.instantiate(prefab)
		skin = kcore.utils.getComponentByMethod(node,"addRenderer")
		if(!skin) {
			node.destroy()
			kcore.log.error("load skin prefab failed com not found name = " + prefab.name)
			return null 
		}
		kcore.log.info("skin prefab loaded name = " + prefab.name + " skin = " + krenderer.RType[skin.type])
		this.node.addChild(node)
		skin.node.name = name
		this.skins_.push({
			name,prefab,prefabName:prefab.name,skin
		})
		return skin 
	}
	async loadSkinAsset(assetName, rename?: string) {
		let name = rename || assetName
		if(this.skins_.find(v=>v.name == name)) {
			kcore.log.error("load skin asset failed already exist name = " + name)
			return null 
		}
		let skin:krenderer.ISkin
		let prefab = await kcore.bundle.loadPrefab(assetName)
		if(!prefab) {
			kcore.log.error("load skin asset failed name = " + assetName)
			return null 
		}
		let node = kcore.display.instantiate(prefab)
		skin = kcore.utils.getComponentByMethod(node,"addRenderer")
		if(!skin) {
			node.destroy()
			kcore.log.error("load skin asset failed com not found name = " + assetName)
			return null 
		}
		kcore.log.info("skin asset loaded name = " + prefab.name + " skin = " + krenderer.RType[skin.type])
		this.node.addChild(node)
		skin.node.name = name
		this.skins_.push({
			name,prefab,prefabName:prefab.name,skin
		})
		return skin 
	}

	loadSkin(name: string, skin: krenderer.ISkin) {
		name = name || skin.node.name
		if(this.skins_.find(v=>v.name == name)) {
			kcore.log.error("load skin failed already exist name = " + name)
			return false 
		}
		skin.node.name = name
		kcore.log.info("skin loaded name = " + name + " skin = " + krenderer.RType[skin.type])
		this.skins_.push({
			name,skin,
		})
	}

	addRenderer(renderer: krenderer.IRenderer) {
		this.renderers_.push({
			renderer,skin:null,
		})
	}

	changeSkin(name: string, renderer: krenderer.IRenderer) {
		let info = this.renderers_.find(v=>v.renderer == renderer)
		if(!info) {
			this.renderers_.push({
				renderer,
				skin:null,
			})
			let self = this 
			kcore.nodeCycle.listenDestroy(renderer.node,()=>{
				if(!self.renderers_ || !self.isValid) {
					return 
				}
				let idx = self.renderers_.findIndex(v=>v.renderer == renderer)
				if(idx >= 0) {
					self.renderers_.splice(idx,1)
				}
			})
		}
		if(info.skin) {
			info.skin.removeRenderer(info.renderer)
			info.skin = null 
		}
		let skin = this.getSkin(name)
		if(!skin) {
			return false 
		}
		skin.addRenderer(renderer)
		info.skin = skin 
		return true 
	}

	changeAllRendererSkin(type:krenderer.RType,skin:krenderer.ISkin) {
		if(type != krenderer.RType.CardBack) {
			let oldSkins:krenderer.ISkin[] = []
			let oldLength = 0
			for(let info of this.renderers_) {
				if(info.renderer.type == type && info.skin) {
					oldSkins.push(info.skin)
					oldLength ++
					if(oldLength >= 2) {
						break 
					}
				}
			}
			let ignoreRemove = false 
			if(oldLength == 1) {
				oldSkins[0].clearRenderers()
				ignoreRemove = true 
			}
			let renderers = this.renderers_.slice(0)
			for(let info of renderers) {
				if(!info.renderer.node || !info.renderer.node.isValid) {
					continue 
				}
				if(info.renderer.type == type) {
					if(info.skin && !ignoreRemove) {
						info.skin.removeRenderer(info.renderer)
						info.skin = null 
					}
					info.renderer.useSkin(skin)
					info.skin = skin
					skin.addRenderer(info.renderer)
				}
			}
			this.disp.dispatch(krenderer.AtlasEvent.OnSkinChanged,type,skin)
		} else {
			let targetType = krenderer.RType.Card
			let oldSkins:krenderer.ISkin[] = []
			let oldLength = 0
			for(let info of this.renderers_) {
				if(info.renderer.type == targetType && info.skin2) {
					oldSkins.push(info.skin2)
					oldLength ++
					if(oldLength >= 2) {
						break 
					}
				}
			}
			let ignoreRemove = false 
			if(oldLength == 1) {
				oldSkins[0].clearRenderers()
				ignoreRemove = true 
			}
			let renderers = this.renderers_.slice(0)
			for(let info of renderers) {
				if(!info.renderer.node || !info.renderer.node.isValid) {
					continue 
				}
				if(info.renderer.type == targetType) {
					if(info.skin2 && !ignoreRemove) {
						info.skin2.removeRenderer(info.renderer)
						info.skin2 = null 
					}
					info.renderer.useSkin2(skin)
					info.skin2 = skin
					skin.addRenderer(info.renderer)
				}
			}
			this.disp.dispatch(krenderer.AtlasEvent.OnSkinChanged,type,skin)
		}
		
	}
	private defaultSkins_:{
		name:string,
		type:krenderer.RType,
		skin:krenderer.ISkin,
	}[] = []
	setDefaultSkin(type: krenderer.RType, name?: string, changeAll?: boolean): boolean {
		let skin = this.skins_.find(v=>v.skin.type == type && (!name || name == v.name))
		if(skin) {
			let def =this.defaultSkins_.find(v=>v.type == type)
			if(!def) {
				def = {
					type,name:skin.name,skin:skin.skin
				}
				this.defaultSkins_.push(def)
			} else {
				def.name = skin.name
				def.skin = skin.skin
			}
			if(changeAll) {
				this.changeAllRendererSkin(type,skin.skin)
			}
			return true 
		}
		return false 
	}

	getDefaultSkin(type: krenderer.RType): krenderer.ISkin {
		return this.defaultSkins_.find(v=>v.type == type)?.skin
	}
	
	getSkin<T extends krenderer.ISkin = krenderer.ISkin>(name: string):T {
		return <T>this.skins_.find(v=>v.name == name)?.skin
	}

	getSkinByType<T extends krenderer.ISkin = krenderer.ISkin>(type: krenderer.RType, idx?: number): T {
		idx = idx || 0
		for(let i = 0 ; i < this.skins_.length ; i ++) {
			let skin = this.skins_[i]
			if(skin.skin.type == type) {
				if(idx <= 0) {
					return <T>skin.skin 
				}
				idx --
			}
		}
		return null 
	}
	getSkins<T extends krenderer.ISkin = krenderer.ISkin>(type:krenderer.RType):{name:string, skin:T}[] {
		return this.skins_.filter(v=>v.skin.type == type).map(v=> {
			return {
				name:v.name,
				skin:<T>v.skin,
			}
		})
	}
	createRenderer<T extends krenderer.IRenderer = krenderer.IRenderer>(type: krenderer.RType, ...params: any[]):T {
		let def = this.defaultSkins_.find(v=>v.type == type)
		if(!def) {
			kcore.log.error("create renderer failed skin not found type = " + krenderer.RType[type])
			return null 
		}
		params.splice(0,0,def.skin)
		let renderer = this.createRendererBySkin.apply(this,params)
		this.addRenderer(renderer)
		return <T>renderer
	}
	createRendererByName<T extends krenderer.IRenderer = krenderer.IRenderer>(skinName: string, ...params: any[]):T {
		let skin = this.skins_.find(v=>v.name == skinName)
		if(!skin) {
			kcore.log.error("create renderer failed skin not found name = " + skinName)
			return null 
		}
		params.splice(0,0,skin.skin)
		return this.createRendererBySkin.apply(this,params)
	}
	createRendererBySkin<T extends krenderer.IRenderer = krenderer.IRenderer>(skin: krenderer.ISkin, ...params: any[]):T {
		let template = this.templates.find(v=>v.type == skin.type)
		if(!template) {
			kcore.log.error("create renderer failed template not found type = " + krenderer.RType[skin.type])
			return null 
		}
		let node = template.node ? kcore.display.instantiate(template.node) : kcore.display.instantiate(template.prefab)
		let com = kcore.utils.getComponentByMethod<krenderer.IRenderer>(node,"onInitRenderer")
		if(!com) {
			kcore.log.error("create renderer failed com not found template = ",template)
			node.destroy()
			return null 
		}
		try {
			com.onInitRenderer(...params)
		} catch (error) {
			kcore.log.error("create renderer failed onInitRenderer error =",error)
		}
		let self = this 
		kcore.nodeCycle.listenDestroy(com.node,()=>{
			if(!self.renderers_ || !self.isValid) {
				return 
			}
			let idx = self.renderers_.findIndex(v=>v.renderer == com)
			if(idx >= 0) {
				self.renderers_.splice(idx,1)
			}
		})
		com.useSkin(skin)
		if(com.type == krenderer.RType.Card) {
			let backSkin = <krenderer.ISkinCardBack>this.getDefaultSkin(krenderer.RType.CardBack)
			com.useSkin2(backSkin)
		}
		return <T>com 
	}
}