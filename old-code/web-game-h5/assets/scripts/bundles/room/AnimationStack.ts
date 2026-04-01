

const { ccclass, property, menu } = cc._decorator

const ccAnimationStackAniDefine = cc.Class({
	name:"ccAnimationStackAniDefine",
	properties:{
		name:{
			default:"name",
		},
		desc:{
			default:"描述",
		},
		prefab:{
			type:cc.Prefab,
			default:null,
		}
	}
})
type AnimationStackAniDefine = {
	name:string,
	desc:string,
	prefab:cc.Prefab
}

const ccAnimationStackEmojiDefine = cc.Class({
	name:"ccAnimationStackEmojiDefine",
	properties:{
		index:{
			tooltip:"索引",
			default:-1,
		},
		desc:{
			default:"描述",
		},
		prefab:{
			type:cc.Prefab,
			default:null,
		},
		frame:{
			tooltip:"静态图片",
			type:cc.SpriteFrame,
			default:null,
		}
	}
})
type AnimationStackEmojiDefine = {
	index:number,
	desc:string,
	prefab:cc.Prefab,
	frame:cc.SpriteFrame
}
@ccclass
@menu("game/AnimationStack")
export default class AnimationStack extends cc.Component implements krenderer.IAniStack {
	@property([ccAnimationStackAniDefine])
	aniDefines:AnimationStackAniDefine[] = []
	@property([ccAnimationStackEmojiDefine])
	emojiDefines:AnimationStackEmojiDefine[] = []
	@property([ccAnimationStackEmojiDefine])
	toEmojiDefines:AnimationStackEmojiDefine[] = []
	protected onLoad(): void {
		this.aniDefines = this.aniDefines.filter(v=>v.prefab)
		this.emojiDefines = this.emojiDefines.filter(v=>v.prefab)
		this.toEmojiDefines = this.toEmojiDefines.filter(v=>v.prefab)
	}
	createAnimation(name: string): krenderer.IAniControl {
		let def = this.aniDefines.find(v=>v.name == name)
		if(!def || !def.prefab) {
			return null 
		}
		let node = kcore.display.instantiate(def.prefab)
		let com:krenderer.IAniControl = kcore.utils.getComponentByMethod(node,"comid_IAniControl")
		if(!com) {
			node.destroy()
			return null 
		}
		return com 
	}
	createEmoji(index: number): krenderer.IAniControl {
		let def = this.emojiDefines.find(v=>v.index == index)
		if(!def || !def.prefab) {
			return null
		}
		let node = kcore.display.instantiate(def.prefab)
		let com:krenderer.IAniControl = kcore.utils.getComponentByMethod(node,"comid_IAniControl")
		if(!com) {
			node.destroy()
			return null 
		}
		return com 
	}
	createToEmoji(index: number): krenderer.IAniControl {
		let def = this.toEmojiDefines.find(v=>v.index == index)
		if(!def || !def.prefab) {
			return null 
		}
		let node = kcore.display.instantiate(def.prefab)
	
		let com:krenderer.IAniControl = kcore.utils.getComponentByMethod(node,"comid_IAniControl")
		if(!com) {
			console.log("没有控件被销毁了")
			node.destroy()
			return null 
		}
		return com 
	}
	
	getEmojiDefine(index: number): krenderer.IAniEmojiDefine {
		return this.emojiDefines.find(v=>v.index == index)
	}
	getToEmojiDefine(index: number): krenderer.IAniEmojiDefine {
		return this.toEmojiDefines.find(v=>v.index == index)
	}
	getAllEmojiDefines(): krenderer.IAniEmojiDefine[] {
		return this.emojiDefines.slice()
	}
	getAllToEmojiDefines(): krenderer.IAniEmojiDefine[] {
		return this.toEmojiDefines.slice()
	}
	playToEmoji(index: number,opt:{
		fromNode:cc.Node,
		toNode:cc.Node,
		parent:cc.Node,
		duration?:number,
	}) {
		let com = this.createToEmoji(index)
		if(!com) {
			return null 
		}
		opt.parent.addChild(com.node)
		let fpos = kcore.utils.convertPositionST(opt.fromNode,opt.parent,cc.v2())
		let tpos = kcore.utils.convertPositionST(opt.toNode,opt.parent,cc.v2())

		com.node.position2 = fpos 

		com.playStatus(krenderer.AniStatus.Move,krenderer.AniPlayType.Loop)
		com.node.runAction(cc.sequence([
			cc.moveTo(opt.duration || 0.5,tpos).easing(cc.easeOut(2)),
			cc.callFunc(()=>{
				com.playStatus(krenderer.AniStatus.End,krenderer.AniPlayType.Destroy)
			})
		]))
		return com 
	}
	playEmoji(index: number, opt: { node: cc.Node; parent: cc.Node; delaySec?: number }): krenderer.IAniControl {
		let com = this.createEmoji(index)
		if(!com) {
			return null 
		}
		opt.parent.addChild(com.node)
		let fpos = kcore.utils.convertPositionST(opt.node,opt.parent,cc.v2())
		com.node.position2 = fpos 
		com.playStatus(krenderer.AniStatus.Idle,krenderer.AniPlayType.Loop)
		com.node.runAction(cc.sequence([
			cc.delayTime(opt.delaySec || 2),
			cc.destroySelf()
		]))
		return com 
	}
}