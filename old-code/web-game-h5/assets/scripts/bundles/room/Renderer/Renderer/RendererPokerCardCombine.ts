import { tCard } from "../../../../ServerDefines/CardDefine";
import RendererPokerCard from "./RendererPokerCard";


const { ccclass, property, executeInEditMode, menu } = cc._decorator

const ccRendererPokerCardCombineSkinMap = cc.Class({
	name:"ccRendererPokerCardCombineSkinMap",
	properties:{
		skinName:{
			type:cc.String,
			default:"",
		},
		card:{
			type:RendererPokerCard,
			default:null,
		}
	}
})
type RendererPokerCardCombineSkinMap = {
	skinName:string,
	card:RendererPokerCard,
}
@ccclass
@executeInEditMode
@menu("game/renderer/RendererPokerCardCombine")
export default class RendererPokerCardCombine extends cc.Component implements krenderer.ICard {
	@property([ccRendererPokerCardCombineSkinMap])
	skinMaps:RendererPokerCardCombineSkinMap[] = []
	get type() {
		return krenderer.RType.Card
	}

	protected skin_:krenderer.ISkinCard
	useSkin(skin:krenderer.ISkinCard):boolean {
		this.skin_ = skin 
		let mapInfo = this.skinMaps.find(v=>v.skinName == skin.node.name)
		if(!mapInfo) {
			kcore.log.error("RendererPokerCardCombine.useSkin no skin map for skin ",skin.node.name)
			return false 
		}
		if(this.activeRenderer_ != mapInfo.card) {
			mapInfo.card.node.opacity = 255
			mapInfo.card.touchEnabled = this.touchEnabled_
			if(this.activeRenderer_) {
				this.activeRenderer_.touchEnabled = false 
				this.activeRenderer_.node.opacity = 0
			}
			this.activeRenderer_ = mapInfo.card
		}
		this.refreshRenderer()
		return true 
	}
	protected skinBack_:krenderer.ISkinCardBack
	useSkin2(skin:krenderer.ISkinCardBack):boolean {
		this.skinBack_ = skin
		this.refreshRenderer()
		return true 
	}

	private activeRenderer_:RendererPokerCard = null
	get flipAniDuration() {
		return this.activeRenderer_ && this.activeRenderer_.flipAniDuration || 0.1
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
		for(let mapInfo of this.skinMaps) {
			mapInfo.card.showBack = v 
		}
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
		for(let mapInfo of this.skinMaps) {
			mapInfo.card.autoShowBack = v 
		}
	}
	
	private autoFlipToShow_:boolean = false 
	get autoFlipToShow() {
		return this.autoFlipToShow_
	}
	set autoFlipToShow(v) {
		this.autoFlipToShow_ = v
		for(let mapInfo of this.skinMaps) {
			mapInfo.card.autoFlipToShow = v 
		}
	}

	onInitRenderer(...params): any {
		this.node.on(cc.Node.EventType.ANCHOR_CHANGED,()=>{
			this.updateSize()
		})
		this.touchDisp_ = kcore.disp()
		this.touchDisp_.link(this.node)
		for(let mapInfo of this.skinMaps) {
			mapInfo.card.onInitRenderer(...params)
			mapInfo.card.touchDisp.addChild(this.touchDisp_)
			mapInfo.card.node.on(cc.Node.EventType.ANCHOR_CHANGED,()=>{
				if(this.activeRenderer_ == mapInfo.card) {
					this.updateSize()
				}
			})
			mapInfo.card.node.on(cc.Node.EventType.SIZE_CHANGED,()=>{
				if(this.activeRenderer_ == mapInfo.card) {
					this.updateSize()
				}
			})
			mapInfo.card.node.opacity = 0
		}
		if(params.length == 0) {
			this.card = tCard.create(0,0)
		} else {
			let obj = params[0]
			if(typeof(obj) == "boolean") {
				this.card = tCard.create(0,0)
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
		if(!this.activeRenderer_) {
			let skinMap = this.skinMaps.find(v=>v.skinName == this.skin_.node.name)
			if(!skinMap) {
				return 
			}
			this.activeRenderer_ = skinMap.card
		}
		this.activeRenderer_.useSkin(this.skin_)
		this.activeRenderer_.useSkin2(this.skinBack_)
		this.activeRenderer_.card = this.card_
		this.updateSize()
	}
	protected update(dt: number): void {
		if(CC_EDITOR) {
			this.updateSize()
		}
	}

	protected updateSize() {
		if(this.activeRenderer_) {
			let followSize = this.activeRenderer_.node.getContentSize()
			let ap = this.node.getAnchorPoint()
			let newSize = cc.size(
				followSize.width,
				followSize.height
			)
			let followAp = this.activeRenderer_.node.getAnchorPoint()
			this.node.setContentSize(newSize)

			// let cxOffset = followSize.width * (0.5 - followAp.x) - newSize.width  * (0.5 - followAp.x) 
			// let cyOffset = followSize.height * (0.5 - followAp.y) - newSize.height  * (0.5 - followAp.y)
			// let followPos = cc.v2(
			// 	(0.5 - ap.x) * newSize.width - (0.5 - followAp.x) * followSize.width - cxOffset,
			// 	(0.5 - ap.y) * newSize.height - (0.5 - followAp.y) * followSize.height - cyOffset,
			// )

			this.activeRenderer_.node.setPosition(
				(1 - ap.x - followAp.x) * newSize.width - 2 * (0.5 - followAp.x) * followSize.width,
				(1 - ap.y - followAp.y) * newSize.height - 2 * (0.5 - followAp.y) * followSize.height,
			)
		}
	}

	flipXToBack(func?:Function) {
		if(this.activeRenderer_) {
			return this.activeRenderer_.flipXToBack(func)
		}
		return false
	}
	flipXToShow(func?:Function) {
		if(this.activeRenderer_) {
			return this.activeRenderer_.flipXToShow(func)
		}
		return false
	}
	
	private touchEnabled_:boolean = false 
	get touchEnabled() {
		return this.touchEnabled_
	}
	set touchEnabled(v) {
		this.touchEnabled_ = v
		if(this.activeRenderer_) {
			this.activeRenderer_.touchEnabled = v
		}
	}

	private touchDisp_:kcore.IEventDispatcher
	get touchDisp() {
		return this.touchDisp_
	}
}