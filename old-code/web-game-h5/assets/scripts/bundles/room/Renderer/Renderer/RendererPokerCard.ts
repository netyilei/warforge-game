import { tCard } from "../../../../ServerDefines/CardDefine";


const { ccclass, property, executeInEditMode, menu } = cc._decorator

enum CardLevel {
	None,
	Small,
	Big,
	Special,
}

const ccRendererPokerCardValueSpriteDefine = cc.Class({
	name:"ccRendererPokerCardValueSpriteDefine",
	properties:{
		spr:{
			type:cc.Sprite,
			default:null,
		},
		level:{
			type:cc.Enum(CardLevel),
			default:CardLevel.None,
		}
	}
})
type RendererPokerCardValueSpriteDefine = {
	spr:cc.Sprite,
	level:CardLevel
}
const ccRendererPokerCardSuitSpriteDefine = cc.Class({
	name:"ccRendererPokerCardSuitSpriteDefine",
	properties:{
		spr:{
			type:cc.Sprite,
			default:null,
		},
		level:{
			type:cc.Enum(CardLevel),
			default:CardLevel.None,
		}
	}
})
type RendererPokerCardSuitSpriteDefine = {
	spr:cc.Sprite,
	level:CardLevel
}
@ccclass
@executeInEditMode
@menu("game/renderer/RendererPokerCard")
export default class RendererPokerCard extends cc.Component implements krenderer.ICard {
	@property(cc.Node)
	nodeFollowSize:cc.Node = null
	@property({tooltip:"向左下位移"})
	followOffset00 = cc.v2(0,0)
	@property({tooltip:"向右上位移"})
	followOffset11 = cc.v2(0,0)
	@property()
	followScaleEnabled = true 
	
	@property(cc.Node)
	nodeFlipRoot:cc.Node = null
	@property(cc.Sprite)
	sprBoard:cc.Sprite = null
	@property(cc.Node)
	nodeFace:cc.Node = null
	@property([ccRendererPokerCardValueSpriteDefine])
	valueSprDefines:RendererPokerCardValueSpriteDefine[] = []
	@property([ccRendererPokerCardSuitSpriteDefine])
	suitSprDefines:RendererPokerCardSuitSpriteDefine[] = []

	@property()
	flipAniDuration = 0.1

	get type() {
		return krenderer.RType.Card
	}

	protected skin_:krenderer.ISkinCard
	useSkin(skin:krenderer.ISkinCard):boolean {
		this.skin_ = skin 
		this.refreshRenderer()
		return true 
	}
	protected skinBack_:krenderer.ISkinCardBack
	useSkin2(skin:krenderer.ISkinCardBack):boolean {
		this.skinBack_ = skin
		this.refreshRenderer()
		return true 
	}

	private card_:tCard = null 
	get card() {
		return this.card_
	}
	set card(v) {
		this.card_ = {suit:v.suit,value:v.value}
		this.refreshRenderer()
		if(this.autoFlipToShow && this.card_.suit != 0) {
			this.flipXToShow()
		}
	}
	
	get suit() {
		return this.card_?.suit
	}
	set suit(v) {
		this.card_ ? (this.card_.suit = v) : (this.card_ = {suit:v,value:0})
		if(this.autoShowBack && this.card_.suit == 0) {
			this.showBack = true 
		} else {
			this.refreshRenderer()
		}
		if(this.autoFlipToShow && this.card_.suit != 0) {
			this.flipXToShow()
		}
	}
	get value() {
		return this.card_?.value
	}
	set value(v) {
		this.card_ ? (this.card_.value = v) : (this.card_ = {suit:0,value:v})
		if(this.autoShowBack && this.card_.suit == 0) {
			this.showBack = true 
		} else {
			this.refreshRenderer()
		}
		if(this.autoFlipToShow && this.card_.suit != 0) {
			this.flipXToShow()
		}
	}

	private showBack_:boolean = false 
	get showBack() {
		return this.showBack_
	}
	set showBack(v) {
		// let change = this.showBack_ == v 
		this.showBack_ = v
		// if(change) {
			this.refreshRenderer()
		// }
	}

	private autoShowBack_:boolean = false 
	get autoShowBack() {
		return this.autoShowBack_
	}
	set autoShowBack(v) {
		this.autoShowBack_ = v
		if(!this.card_ || this.card_.suit == 0) {
			this.showBack = true 
		}
	}
	
	private autoFlipToShow_:boolean = false 
	get autoFlipToShow() {
		return this.autoFlipToShow_
	}
	set autoFlipToShow(v) {
		this.autoFlipToShow_ = v
	}

	onInitRenderer(...params): any {
		this.node.on(cc.Node.EventType.ANCHOR_CHANGED,()=>{
			this.updateSize()
		})
		this.touchDisp_ = kcore.disp()
		this.touchDisp_.link(this.node)
		if(params.length == 0) {
			this.card = tCard.create(0,0)
		} else {
			let obj = params[0]
			if(typeof(obj) == "boolean") {
				this.showBack = obj 
			} else if(typeof(obj) == "object" && obj.suit != null) {
				this.card = tCard.create(obj.suit,obj.value || 0)
				this.showBack = !!params[1]
			} else if(typeof(obj) == "number") {
				this.card = tCard.create(params[0],params[1] || 0)
				this.showBack = !!params[2]
			}
		}
	}

	refreshRenderer() {
		if(!this.skin_) {
			return
		}
		if(this.showBack) {
			this.nodeFace.active = false 
			this.sprBoard.spriteFrame = this.skinBack_ ? this.skinBack_.back : this.skin_.back
		} else {
			this.nodeFace.active = true 
			let suit = this.suit 
			let value = this.value 
			for(let valueDefine of this.valueSprDefines) {
				let values = this.skin_.valueFrames.find(v=>v.level == valueDefine.level && v.suits.includes(suit))?.values
				if(!values) {
					valueDefine.spr.node.opacity = 0
					continue 
				}
				let frame = values.find(v=>v.value == value)?.frame
				if(frame) {
					valueDefine.spr.spriteFrame = frame 
					valueDefine.spr.node.opacity = 255
				} else {
					valueDefine.spr.node.opacity = 0
				}
			}
			for(let suitDefine of this.suitSprDefines) {
				let frame = this.skin_.suitFrames.find(v=>v.suit == suit && v.level == suitDefine.level)?.frame
				if(frame) {
					suitDefine.spr.spriteFrame = frame 
					suitDefine.spr.node.opacity = 255
				} else {
					suitDefine.spr.node.opacity = 0
				}
			}
			let setupFace = false 
			if(this.skin_.specialCardFaces) {
				let specialFace = this.skin_.specialCardFaces.find(v=>v.suit == suit)
				if(specialFace && specialFace.frame) {
					this.sprBoard.spriteFrame = specialFace.frame
					setupFace = true
				}
			}
			if(!setupFace) {
				this.sprBoard.spriteFrame = this.skin_.face
			}
		}
		this.updateSize()
	}
	protected update(dt: number): void {
		if(CC_EDITOR) {
			this.updateSize()
		}
	}

	protected updateSize() {
		if(this.nodeFollowSize) {
			let followSize = this.nodeFollowSize.getContentSize()
			if(this.followScaleEnabled) {
				followSize.width *= this.nodeFollowSize.scaleX 
				followSize.height *= this.nodeFollowSize.scaleY 
			}
			let ap = this.node.getAnchorPoint()
			let newSize = cc.size(
				followSize.width - this.followOffset00.x + this.followOffset11.x,
				followSize.height - this.followOffset00.y + this.followOffset11.y
			)
			let followAp = this.nodeFollowSize.getAnchorPoint()
			this.node.setContentSize(newSize)

			// let cxOffset = followSize.width * (0.5 - followAp.x) - newSize.width  * (0.5 - followAp.x) 
			// let cyOffset = followSize.height * (0.5 - followAp.y) - newSize.height  * (0.5 - followAp.y)
			// let followPos = cc.v2(
			// 	(0.5 - ap.x) * newSize.width - (0.5 - followAp.x) * followSize.width - cxOffset,
			// 	(0.5 - ap.y) * newSize.height - (0.5 - followAp.y) * followSize.height - cyOffset,
			// )

			this.nodeFollowSize.setPosition(
				(1 - ap.x - followAp.x) * newSize.width - 2 * (0.5 - followAp.x) * followSize.width,
				(1 - ap.y - followAp.y) * newSize.height - 2 * (0.5 - followAp.y) * followSize.height,
			)
		}
	}

	flipXToBack(func?:Function) {
		if(!this.nodeFlipRoot) {
			return false
		}
		this.nodeFlipRoot.scaleX = 1
		this.nodeFlipRoot.stopAllActions()
		this.nodeFlipRoot.runAction(cc.sequence([
			cc.scaleTo(this.flipAniDuration,0,1),
			cc.callFunc(()=>{
				this.showBack = true
			}),
			cc.scaleTo(this.flipAniDuration,1,1),
			cc.callFunc(()=>{
				if(func) {
					func()
				}
			})
		]))
		return true 
	}
	flipXToShow(func?:Function) {
		if(!this.nodeFlipRoot) {
			return false
		}
		this.showBack = true 
		this.nodeFlipRoot.scaleX = 1
		this.nodeFlipRoot.stopAllActions()
		this.nodeFlipRoot.runAction(cc.sequence([
			cc.scaleTo(this.flipAniDuration,0,1),
			cc.callFunc(()=>{
				this.showBack = false 
			}),
			cc.scaleTo(this.flipAniDuration,1,1),
			cc.callFunc(()=>{
				if(func) {
					func()
				}
			})
		]))
		return true 
	}
	
	private touchEnabled_:boolean = false 
	get touchEnabled() {
		return this.touchEnabled_
	}
	set touchEnabled(v) {
		this.touchEnabled_ = v
		if(!v) {
			if(this.prevTouch_) {
				this.onTouchEnd(this.prevTouch_,true)
			}
			this.prevTouch_ = null 
		}
		this.onTouchEnabled(v)
	}

	private touchDisp_:kcore.IEventDispatcher
	get touchDisp() {
		return this.touchDisp_
	}
	protected touchInited_:boolean = false 
	protected prevTouch_:cc.Touch
	protected onTouchEnabled(v) {
		if(!v) {
			return 
		}
		if(this.touchInited_) {
			return 
		}
		let self = this 
		this.node.on(cc.Node.EventType.TOUCH_START,(touch:cc.Touch)=>{
			if(self.prevTouch_ && self.prevTouch_.getID() != touch.getID()) {
				return 
			}
			self.prevTouch_ = touch 
			self.touchDisp.dispatch(krenderer.CardEvent.TouchStart,self,touch)
		})
		this.node.on(cc.Node.EventType.TOUCH_MOVE,(touch:cc.Touch)=>{
			if(self.prevTouch_.getID() != touch.getID()) {
				return 
			}
			self.prevTouch_ = touch 
			self.touchDisp.dispatch(krenderer.CardEvent.TouchMove,self,touch)
		})
		let funcEnd = (touch:cc.Touch)=>{
			self.onTouchEnd()
		}
		this.node.on(cc.Node.EventType.TOUCH_END,funcEnd)
		this.node.on(cc.Node.EventType.TOUCH_CANCEL,funcEnd)
	}
	protected onTouchEnd(touch?:cc.Touch,forceEnd?:boolean) {
		if(this.prevTouch_.getID() != touch.getID()) {
			return 
		}
		this.prevTouch_ = null 
		if(!forceEnd) {
			if(this.node.parent) {
				let localPos = this.node.parent.convertToNodeSpaceAR(touch.getLocation())
				if(this.node.getBoundingBox().contains(localPos)) {
					this.touchDisp.dispatch(krenderer.CardEvent.Click,this)
				}
			}
		}
		this.touchDisp.dispatch(krenderer.CardEvent.TouchEnd,this,touch)
	}
}