import { BaseGameLayerExtension } from "./BaseGameLayerExtension"
import { PlayerPotLayer, PlayerPotPos } from "./BasePlayer"
import { BasePlayerExtension } from "./BasePlayerExtension"
import { GameLayerEvents } from "./GameLayerEvents"
import GameLayerExtension_SubComponent, { GameLayerExtensionPosition } from "./GameLayerExtension_SubComponent"

const { ccclass, property, menu } = cc._decorator

const ccGameLayerExtensionRootDefine = cc.Class({
	name:"ccGameLayerExtensionRootDefine",
	properties:{
		position:{
			type:cc.Enum(GameLayerExtensionPosition),
			default:GameLayerExtensionPosition.Up,
		},
		rootNode:{
			type:cc.Node,
			default:null,
		},
	}
})
type GameLayerExtensionRootDefine = {
	position:GameLayerExtensionPosition,
	rootNode:cc.Node,
}

@ccclass
@menu("game/GameLayerExtensionManager")
export default class GameLayerExtensionManager extends cc.Component {
	@property([ccGameLayerExtensionRootDefine])
	rootDefines:GameLayerExtensionRootDefine[] = []

	private gameLayer_:kroom.IBaseGameLayer
	get gameLayer() {
		return this.gameLayer_
	}
	private exts_:{
		prefabName:string,
		com:kroom.IBaseLayerExtension<kroom.IBaseGameLayer>,
		node:cc.Node,
	}[] = []
	onInitLayer(gameLayer:kroom.IBaseGameLayer) {
		this.gameLayer_ = gameLayer
		
		let subs = gameLayer.node.getComponentsInChildren(GameLayerExtension_SubComponent) || []
		for(let sub of subs) {
			for(let ext of sub.selfExtensions) {
				try {
					ext.onInitExtension(this.gameLayer)
				} catch (error) {
					kcore.log.error("init layer self ext failed node = " + ext.node.name + " name = " + ext.name,error)
					continue 
				}
				this.exts_.push({
					prefabName:"SELF|" + ext.node,
					com:ext,
					node:ext.node,
				})
			}
			for(let node of sub.selfExtensionNodes) {
				let coms = node.getComponents(cc.Component)
				for(let com of coms) {
					if(!com["onInitExtension"]) {
						continue 
					}
					let ext = <BaseGameLayerExtension>com
					if(sub.selfExtensions.includes(ext)) {
						continue 
					}
					try {
						ext.onInitExtension(this.gameLayer)
					} catch (error) {
						kcore.log.error("init layer self-node ext failed node = " + ext.node.name + " name = " + ext.name,error)
						continue 
					}
					this.exts_.push({
						prefabName:"SELF|" + ext.node + "|" + ext.name,
						com:ext,
						node:ext.node,
					})
				}
			}
			
			for(let def of sub.layerExtensionDefines) {
				let rootDef = this.rootDefines.find(v=>v.position == def.position)
				if(!rootDef) {
					kcore.log.error("ext init failed name = " + def.prefab?.name + " root not found = " + GameLayerExtensionPosition[def.position])
					continue 
				}
				let node = kcore.display.instantiate(def.prefab)
				let com = kcore.utils.getComponentByMethod<kroom.IBaseLayerExtension<kroom.IBaseGameLayer>>(node,"onInitExtension")
				if(!com) {
					kcore.log.error("ext init failed com not found = " + def.prefab.name)
					node.destroy()
					continue 
				}
				rootDef.rootNode.addChild(node)
	
				kcore.log.info("handle init ext name = " + def.prefab.name)
				try {
					com.onInitExtension(this.gameLayer_)
				} catch (error) {
					kcore.log.error("ext init error name = " + def.prefab.name,error)
					node.destroy()
					node = null 
				}
				if(node) {
					this.exts_.push({
						prefabName:def.prefab.name,
						node,
						com,
					})
				}
			}
	
			this.gameLayer_.dispMsg.addNode(this.node,null,this)
				.listen(GameLayerEvents.ON_CREATEPLAYER,(player:kroom.IBasePlayer)=>{
					for(let sub of subs) {
						for(let def of sub.playerExtensionDefines) {
							if(!def.prefab) {
								continue 
							}
							if(def.viewIDSpecial >= 0 && def.viewIDSpecial != player.viewID) {
								continue 
							}
							kcore.log.info("add ext to player chairNo = " + player.userData.chairNo + " name = " + def.prefab.name)
							player.addExtensions(def.prefab,def.position,def.layer)
						}
					}
				})
		}
	}

	onLayerUpdate(dt) {
		for(let ext of this.exts_) {
			try {
				ext.com.onLayerUpdate(dt)
			} catch (error) {
				kcore.log.error("ext update error name = " + ext.prefabName,error)
			}
		}
	}

	onLayerDestroy() {
		for(let ext of this.exts_) {
			try {
				ext.com.onLayerDestroy()
			} catch (error) {
				kcore.log.error("ext on destroy error name = " + ext.prefabName,error)
			}
		}
	}

	
}