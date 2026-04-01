import { GSUserMsg } from "../../ServerDefines/GSUserMsg"
import { BasePlayerExtension } from "./BasePlayerExtension"
import { GameLayerEvents } from "./GameLayerEvents"


const { ccclass, property } = cc._decorator

const ccBasePlayerSexNode = cc.Class({
	name:"ccBasePlayerSexNode",
	properties:{
		sex:{
			default:0,
		},
		node:{
			type:cc.Node,
			default:null
		}
	}
})
type BasePlayerSexNode = {
	sex:number,
	node:cc.Node,
}

/**
 * 位置类型
 */
export enum PlayerPotPos {
	Self,

	Pool,
	Pool2,
	Pool3,

	Score,
	Score2,
	Score3,

	Ready,
	Ready2,
	Ready3,

	Card,
	Card2,
	Card3,

	Status,
	Status2,
	Status3,

	Ani,
	Ani2,
	Ani3,

	Tiemr,
	Tiemr2,
	Tiemr3,

	CustomStart = 100,
}

/**
 * 引用管理类型
 */
export enum PlayerPotType {
	Ref,
	Ref_NoReset,

	AddChild,
}

/**
 * 层级，如果是AddChild
 */
export enum PlayerPotLayer { 
	None,
	Up,
	Middle,
	Down,
}

const ccBasePlayerPotDefine = cc.Class({
	name:"ccBasePlayerPotDefine",
	properties:{
		rootUp:{
			type:cc.Node,
			default:null,
		},
		rootMiddle:{
			type:cc.Node,
			default:null,
		},
		rootDown:{
			type:cc.Node,
			default:null,
		},
	}
})
type BasePlayerPotDefine = {
	rootUp:cc.Node,
	rootMiddle:cc.Node,
	rootDown:cc.Node,
}

@ccclass
export default class BasePlayer extends cc.Component implements kroom.IBasePlayer {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property([BasePlayerExtension])
	selfExtensions:BasePlayerExtension[] = []
	@property([cc.Node])
	selfExtensionNodes:cc.Node[] = []

	@property(ccBasePlayerPotDefine)
	potDefines:BasePlayerPotDefine = null

	initPlayer(gameLayer:kroom.IBaseGameLayer,viewID:number,userData:GSUserMsg.tUserEnterData) {
		this.gameLayer_ = gameLayer 
		this.viewID_ = viewID 
		this.userData = userData
		this.addPot(this.node,PlayerPotPos.Self,PlayerPotType.Ref_NoReset)
		for(let ext of this.selfExtensions) {
			if(this.exts_.find(v=>v.com == ext)) {
				continue 
			}
			try {
				ext.onInitPlayer(this.gameLayer,this)
			} catch (error) {
				kcore.log.error("init player self ext failed node = " + ext.node.name + " name = " + ext.name,error)
				continue 
			}
			this.exts_.push({
				prefabName:"SELF|" + ext.node,
				com:ext,
				node:ext.node,
			})
		}
		for(let node of this.selfExtensionNodes) {
			let coms = node.getComponents(cc.Component)
			for(let com of coms) {
				if(!com["onInitPlayer"]) {
					continue 
				}
				let ext = <BasePlayerExtension>com
				if(this.selfExtensions.includes(ext)) {
					continue 
				}
				try {
					ext.onInitPlayer(this.gameLayer,this)
				} catch (error) {
					kcore.log.error("init player self-node ext failed node = " + ext.node.name + " name = " + ext.name,error)
					continue 
				}
				this.exts_.push({
					prefabName:"SELF|" + ext.node + "|" + ext.name,
					com:ext,
					node:ext.node,
				})
			}
		}
		this.gameLayer.dispMsg.dispatch(GameLayerEvents.ON_CREATEPLAYER,this)

		this.onInitPlayer()
		this.onUserDataChanged()
	}

	protected onInitPlayer() {
		
	}

	private gameLayer_:kroom.IBaseGameLayer = null 
	get gameLayer() {
		return this.gameLayer_
	}

	private viewID_:number = null 
	get viewID() {
		return this.viewID_
	}

	private userData_:kroom.ServerUserData = null 
	get userData() {
		return this.userData_
	}
	set userData(v) {
		this.userData_ = v
		this.score = v.score
	}

	get chairNo() {
		return this.userData_?.chairNo
	}
	get userID() {
		return this.userData_?.userID
	}

	private score_:string = "0"
	get score() {
		return this.score_
	}
	set score(v) {
		let prev = this.score_
		this.score_ = v
		this.onScoreChanged(v,prev)
	}

	setScoreChanged(score:string,changed:string) {
		let prev = this.score_
		this.score_ = score
		this.onScoreChanged(score,prev,changed)
	}


	get online() {
		return this.userData_?.online
	}
	set online(v) {
		this.userData_.online = v 
		this.onOnline()
	}

	get tuoguan() {
		return this.userData_?.tuoguan
	}
	set tuoguan(v) {
		this.userData_.tuoguan = v 
		this.onTuoguan()
	}

	private ready_:boolean = false 
	get ready() {
		return this.ready_
	}
	set ready(v) {
		this.ready_ = v
		this.onReady() 
	}

	private status_:number = null 
	get status() {
		return this.status_
	}
	set status(v) {
		let prev = this.status_
		this.status_ = v
		this.onStatus(v,prev)
	}
	private exts_:{
		prefabName:string
		com:kroom.IBasePlayerExtension<kroom.IBaseGameLayer,kroom.IBasePlayer>,
		node:cc.Node,
	}[] = []
	get exts() {
		return this.exts_
	}

	addExtensions(prefab:cc.Prefab,pos:PlayerPotPos,layer:PlayerPotLayer) {
		let node = kcore.display.instantiate(prefab)
		let com = kcore.utils.getComponentByMethod<any>(node,"onInitPlayer")
		if(!com) {
			kcore.log.error("create player ext failed com not found name = " + prefab.name)
			node.destroy()
			return null 
		}
		this.exts.push({
			node,com,prefabName:prefab.name
		})
		this.addPot(node,pos,PlayerPotType.AddChild,layer)

		try {
			com.onInitPlayer(this.gameLayer,this)
		} catch (error) {
			kcore.log.error("init player ext failed name = " + prefab.name,error)
			this.removePotByNode(node)
			this.exts_.pop()
			node = null 
		}
		if(!node) {
			return null 
		}
	}
	
	private pots_:{
		node:cc.Node,pos:PlayerPotPos,type:PlayerPotType,layer:PlayerPotLayer
	}[] = []
	get pots() {
		return this.pots_
	}
	addPot(node:cc.Node,pos:PlayerPotPos,type:PlayerPotType,layer?:PlayerPotLayer) {
		// this.removePotByPos(pos)
		if(node) {
			if(this.pots_.find(v=>v.node == node)) {
				kcore.log.error("cannot add pot twice")
				return false 
			}
		}
		this.pots_.push({
			node,pos,type,layer
		})
		switch(type) {
			case PlayerPotType.Ref:{
				node.active = true 
			} break 
			case PlayerPotType.Ref_NoReset: {

			} break 
			case PlayerPotType.AddChild: {
				// proxy 不判断 layer ?
				// let root:cc.Node = this.potProxyNodes_.find(v=>v.pos == pos && v.layer == layer)?.node
				let root:cc.Node = this.potProxyNodes_.find(v=>v.pos == pos)?.node
				if(!root) {
					switch(layer) {
						case PlayerPotLayer.Up: 
							root = this.potDefines.rootUp
							break 
						case PlayerPotLayer.Middle:
							root = this.potDefines.rootMiddle
							break 
						case PlayerPotLayer.Down:
							root = this.potDefines.rootDown
							break 
						default:
							root = this.potDefines.rootUp || this.potDefines.rootMiddle || this.potDefines.rootDown
							break
					}
				}
				if(!root) {
					kcore.log.error("cannot find layer root node layer = " + layer + " | " + PlayerPotLayer[layer])
					return false 
				}
				root.addChild(node)
			} break 
		}
		return true 
	}

	private potProxyNodes_:{
		node:cc.Node,
		pos:PlayerPotPos,
		layer?:PlayerPotLayer
	}[] = []
	setupPotProxy(proxyNode:cc.Node,pos:PlayerPotPos,layer?:PlayerPotLayer) {
		let idx = this.potProxyNodes_.findIndex(v=>v.pos == pos && v.layer == layer)
		if(idx >= 0) {
			this.potProxyNodes_.splice(idx,1)
		}
		this.potProxyNodes_.push({
			node:proxyNode,
			pos,
			layer
		})
	}

	onUserDataChanged() {
		for(let ext of this.exts_) {
			ext.com.onUserDataChanged()
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

	onRelease() {
		for(let ext of this.exts_) {
			ext.com.onPlayerRelease()
		}
		this.exts_.splice(0)
		for(let pot of this.pots_) {
			if(!pot.node || !pot.node.isValid) {
				continue 
			}
			switch(pot.type) {
				case PlayerPotType.Ref: {
					pot.node.active = false 
				} break 
				case PlayerPotType.Ref_NoReset: {

				} break 
				case PlayerPotType.AddChild: {
					pot.node.destroy()
					pot.node = null 
				} break 
			}
		}
		this.pots.splice(0)
	}


	removePotByPos(pos:PlayerPotPos) {
		let idx = this.pots_.findIndex(v=>v.pos == pos)
		if(idx >= 0) {
			return this.removePotIndex(idx)
		}
		return false 
	}

	removePotByNode(node:cc.Node) {
		let idx = this.pots_.findIndex(v=>v.node == node)
		if(idx >= 0) {
			return this.removePotIndex(idx)
		}
		return false 
	}

	removePotIndex(idx:number) {
		let pot = this.pots_[idx]
		if(!pot) {
			return false 
		}
		switch(pot.type) {
			case PlayerPotType.Ref: {
				pot.node.active = false 
			} break 
			case PlayerPotType.Ref_NoReset: {

			} break 
			case PlayerPotType.AddChild: {
				pot.node.destroy()
			}
		}
		this.pots_.splice(idx,1)
		return true 
	}

	getPotByPos(pos:PlayerPotPos) {
		return this.pots_.find(v=>v.pos == pos)?.node
	}

	filterPotByPos(pos:PlayerPotPos) {
		return this.pots_.filter(v=>v.pos == pos).map(v=>v.node)
	}

	onScoreChanged(cur:string,prev:string,changed?:string) {

	}
	
	onOnline() {

	}

	onTuoguan() {

	}

	onReady() {

	}

	onStatus(cur:number,prev:number) {
		
	}
}