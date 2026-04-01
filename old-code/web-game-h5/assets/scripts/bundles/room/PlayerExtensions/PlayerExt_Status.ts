import Decimal from 'decimaljs'
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { SrsUserMsg } from "../../../ServerDefines/SrsUserMsg";
import { BasePlayerExtension } from "../BasePlayerExtension";
import _ = require("underscore");

const { ccclass, property, menu } = cc._decorator

const ccPlayerExtStatusDefine = cc.Class({
	name:"ccPlayerExtStatusDefine",
	properties:{
		status:{
			default:0,
		},
		frame:{
			type:cc.SpriteFrame,
			default:null,
		},
		node:{
			type:cc.Node,
			default:null,
		}
	}
})

export type PlayerExtStatusDefine<T = number> = {
	status:T,
	frame:cc.SpriteFrame,
	node:cc.Node,
}

function getSubDict (obj, key) {
    return obj[key] || (obj[key] = {});
}

export function PlayerExtStatusRedefine(enumClazz:any,defaultValue:any) {
	return function(ctorProtoOrOptions, propName) {
		let ccPlayerExtStatusDefine = cc.Class({
			name:"ccPlayerExtStatusDefine_" + ctorProtoOrOptions.constructor.name + "_" + propName + "_" + enumClazz[0],
			properties:{
				status:{
					type:cc.Enum(enumClazz),
					default:defaultValue,
				},
				frame:{
					type:cc.SpriteFrame,
					default:null,
				},
				node:{
					type:cc.Node,
					default:null,
				}
			}
		})
		// 取出原来的property并替换掉
		let cache = getSubDict(ctorProtoOrOptions.constructor,"__ccclassCache__")
		let ccclassProto = getSubDict(cache, 'proto');
		let properties = getSubDict(ccclassProto, 'properties');
		properties[propName] = [ccPlayerExtStatusDefine]
	}
}
export function PlayerExtStatusEffectRedefine(enumClazz:any,defaultValue:any) {
	return function(ctorProtoOrOptions, propName) {
		let ccPlayerExtStatusEffectNodeDefine = cc.Class({
			name:"PlayerExtStatusEffectNodeDefine" + ctorProtoOrOptions.constructor.name + "_" + propName + "_" + enumClazz[0],
			properties:{
				status:{
					type:cc.Enum(enumClazz),
					default:defaultValue,
				},
				node:{
					type:cc.Node,
					default:null,
				}
			}
		})
		// 取出原来的property并替换掉
		let cache = getSubDict(ctorProtoOrOptions.constructor,"__ccclassCache__")
		let ccclassProto = getSubDict(cache, 'proto');
		let properties = getSubDict(ccclassProto, 'properties');
		properties[propName] = [ccPlayerExtStatusEffectNodeDefine]
	}
}

const ccPlayerExtStatusEffectNodeDefine = cc.Class({
	name:"ccPlayerExtStatusEffectNodeDefine",
	properties:{			
		status:{
			default:0,
		},
		node:{
			type:cc.Node,
			default:null,
		}
	}
})
type PlayerExtStatusEffectNodeDefine<T = number> = {
	status:T,
	node:cc.Node,
}

@ccclass
@menu("game/extension/PlayerExt_StatusBase")
export default class PlayerExt_StatusBase<
		StatusType = number,
		GameLayerClass extends kroom.IBaseGameLayer = kroom.IBaseGameLayer,
		PlayerClass extends kroom.IBasePlayer = kroom.IBasePlayer
	> 
	extends BasePlayerExtension<GameLayerClass,PlayerClass> {
	
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property(cc.Sprite)
	sprStatus:cc.Sprite = null
	@property({type:[ccPlayerExtStatusDefine],tooltip:"frame和node二选一"})
	defines:PlayerExtStatusDefine<StatusType>[] = []
	@property([ccPlayerExtStatusEffectNodeDefine])
	effectDefines:PlayerExtStatusEffectNodeDefine<StatusType>[] = []

	private statuss_:StatusType[] = []
	get status():StatusType {
		return this.statuss_[0]
	}
	set status(v) {
		this.statuss_ = [v]
		this.onUserDataChanged()
	}

	get statuss() {
		return this.statuss_
	}
	set statuss(v) {
		this.statuss_ = v.slice()
		this.onUserDataChanged()
	}
	
	onInitPlayerExtension(): void {
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				this.status = null 
				// if(this.gameLayer.playingChairNos.includes(this.player.chairNo)) {
				// 	this.nodeRoot.active = true 
				// } else {
				// 	this.nodeRoot.active = false 
				// }
			})
	}
	onUserDataChanged(): void {
		let b = false 
		let def = this.defines.find(v=>v.status == this.player.status)
		if(def) {
			if(def.frame) {
				if(this.sprStatus) {
					this.sprStatus.node.active = true 
					this.sprStatus.spriteFrame = def.frame
					b = true 
				}
			} else if(def.node) {
				this.defines.forEach(v=>v.node ? (v.node.active = v.node == def.node) : 0)
				if(this.sprStatus) {
					this.sprStatus.node.active = false 
				}
				b = true 
			}
		}
		this.effectDefines.forEach((v)=>{
			if(!v.node) {
				kcore.log.info("player status: effect node is null",v)
				return 
			}
			v.node.active = false 
		})
		this.effectDefines.forEach((v)=>{
			if(!v.node) {
				return 
			}
			v.node.active = v.node.active || this.statuss.includes(v.status)
		})
		this.nodeRoot.active = b || !!this.effectDefines.find(v=>v.node && v.node.active)
	}
}