import { Card, CardArray, tCard, tCardArray } from "../../../../ServerDefines/CardDefine"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/renderer/RendererPokerHandCards")
export default class RendererPokerHandCards extends cc.Component implements krenderer.IHandCards {
	@property(cc.Node)
	nodeCards:cc.Node = null
	@property()
	moveAni:boolean = false 
	@property()
	moveAniDuration:number = 0.1
	@property()
	moveAniFadeOut:number = 2
	@property({tooltip:"两张牌之间的间隔百分比0~1"})
	intervalBetweenCardsPercent:number = 1
	@property({tooltip:"被选中后抬起高度百分比0~1"})
	selectHeightPercent:number = 0.5
	@property()
	dragOutHeightPercent:number = 1

	get type() {
		return krenderer.RType.HandCards 
	}

	useSkin(skin:krenderer.ISkin):boolean {
		return false 
	}
	useSkin2(skin:krenderer.ISkin):boolean {
		return false 
	}

	private cardSkin_:krenderer.ISkinCard
	onInitRenderer(cards:tCardArray | CardArray,cardSkin?:krenderer.ISkinCard) {
		this.cardSkin_ = cardSkin
		this.node.on(cc.Node.EventType.ANCHOR_CHANGED,()=>{
			this.refreshLayout()
		})
		krenderer.atlas.disp.addNode(this.node,null,this)
			.listen(krenderer.AtlasEvent.OnSkinChanged,(rtype:krenderer.RType)=>{
				if(rtype == krenderer.RType.Card || rtype == krenderer.RType.CardBack) {
					this.refreshLayout()
				}
			})
		this.touchDisp_ = kcore.disp()
		this.touchDisp_.link(this.node)
		this.powerFunc = (card)=>{
			return card.value 
		}
		this.sortFunc = (a,b)=>{
			return a.serialID - b.serialID
		}
		let arr = cards
		if(arr && typeof(arr) == "object") {
			this.pushCards(arr)
		}
	}

	protected cards_:krenderer.HandSingleCardInternal[] = []

	protected serialID_ = 0
	pushCards(cards:tCardArray | CardArray) {
		cards.forEach((card,idx)=>{
			let renderer = this.cardSkin_ ? 
				krenderer.atlas.createRendererBySkin<krenderer.ICard>(this.cardSkin_,card)
				:
				krenderer.atlas.createRenderer<krenderer.ICard>(krenderer.RType.Card,card)
			this.nodeCards.addChild(renderer.node)
			this.handleCreateCard(renderer)
			renderer.card = card 
			this.cards_.push({
				card:new Card(card),
				renderer,
				selected:false,
				serialID:this.serialID_ ++,
			})
		})
		this.refreshLayout()
	}

	pushCard(card:tCard) {
		let renderer = this.cardSkin_ ? 
			krenderer.atlas.createRendererBySkin<krenderer.ICard>(this.cardSkin_,card)
			:
			krenderer.atlas.createRenderer<krenderer.ICard>(krenderer.RType.Card,card)
		this.nodeCards.addChild(renderer.node)
		this.handleCreateCard(renderer)
		renderer.card = card 
		this.cards_.push({
			card:new Card(card),
			renderer,
			selected:false,
			serialID:this.serialID_ ++,
		})
		this.refreshLayout()
	}

	setCard(idx:number,card:tCard) {
		if(idx == this.cards_.length) {
			this.pushCard(card)
			return 
		}
		let info = this.cards_[idx]
		if(!info) {
			return 
		}
		info.card = new Card(card)
		info.renderer.card = card 
	}


	protected handleCreateCard(renderer:krenderer.ICard) {
		renderer.showBack = this.showBack
		renderer.autoShowBack = this.autoShowBack
		renderer.autoFlipToShow = this.autoFlipToShow
	}

	get length() {
		return this.cards_.length
	}

	removeAt(idx:number) {
		if(idx < 0 || idx >= this.cards_.length) {
			return false  
		}
		let info = this.cards_[idx]
		if(info == this.touchCard_) {
			this.cancelTouch()
		}
		info.renderer.node.destroy()
		this.cards_.splice(idx,1)
		this.refreshLayout()
		return true 
	}

	remove(card:tCard) {
		let idx = this.indexOf(card)
		if(idx < 0) {
			return false 
		}
		return this.removeAt(idx)
	}

	removeHandSingleCards(infos:krenderer.HandSingleCard[]) {
		let removeCount = 0
		for(let info of infos) {
			let idx = this.cards_.findIndex(v=>v.card.equal(info.card) && v.serialID == info.serialID)
			if(idx < 0) {
				continue 
			}
			let localInfo = this.cards_[idx]
			if(localInfo == this.touchCard_) {
				this.cancelTouch()
			}
			localInfo.renderer.node.destroy()
			this.cards_.splice(idx,1)
			removeCount ++ 
		}
		if(removeCount > 0) {
			this.refreshLayout()
		}
		return removeCount == infos.length
	}

	at(idx:number) {
		if(idx < 0 || idx >= this.cards_.length) {
			return null 
		}
		return this.cards_[idx]
	}
	
	indexOf(card:tCard) {
		return this.cards_.findIndex(v=>v.card.equal(card))
	}

	contains(card:tCard) {
		return this.indexOf(card) >= 0
	}

	containsArray(cards:tCardArray | CardArray) {
		let ret = {
			b:true,
		}
		cards.forEach((card)=>{
			if(!ret.b) {
				return
			}
			ret.b = this.contains(card)
		})
		return ret.b 
	}

	clear() {
		this.cancelTouch()
		this.nodeCards.destroyAllChildren()
		this.cards_.splice(0)
	}

	private sortFunc_:(a:krenderer.HandSingleCard,b:krenderer.HandSingleCard)=>number = null 
	get sortFunc() {
		return this.sortFunc_
	}
	set sortFunc(v) {
		this.sortFunc_ = v
	}

	private powerFunc_:(a:tCard)=>number = null 
	get powerFunc() {
		return this.powerFunc_
	}
	set powerFunc(v) {
		this.powerFunc_ = v
	}

	get defaultSortFunc() {
		return (a,b)=>{
			return a.card.suit != b.card.suit ? 
				a.card.suit - b.card.suit
				:
				(
					a.card.value != b.card.value ?
					a.card.value - b.card.value
					:
					a.serialID - b.serialID
				)
		}
	}

	refreshLayout(forceNoAni?:boolean) {
		let size = cc.size(0,0)
		let cardSize = this.cards_.length > 0 ? 
			this.cards_[0].renderer.node.getContentSize()
			:
			cc.size(0,0)
		size.height = cardSize.height
		let intervalWidth = this.intervalBetweenCardsPercent * cardSize.width
		if(this.cards_.length > 0) {
			size.width = (this.cards_.length - 1) * intervalWidth + cardSize.width
		}
		this.node.setContentSize(size)
		let ap = this.node.getAnchorPoint()
		let sx = -ap.x * size.width
		let sy = -ap.y * size.height
		for(let i = 0 ; i < this.cards_.length ; i ++) {
			let info = this.cards_[i]
			let cardAP = info.renderer.node.getAnchorPoint()
			let x = sx + (i * intervalWidth) + cardAP.x * cardSize.width
			let y = sy + cardAP.y * cardSize.height
			this.setCardPosition(info,cc.v2(x,y),forceNoAni)
		}
	}

	
	private touchDisp_:kcore.IEventDispatcher
	get touchDisp() {
		return this.touchDisp_
	}
	set touchDisp(v) {
		this.touchDisp_ = v
	}

	private touchEnabled_:boolean = false 
	get touchEnabled() {
		return this.touchEnabled_
	}
	set touchEnabled(v) {
		this.touchEnabled_ = v
	}

	private selectEnabled_:boolean = false 
	get selectEnabled() {
		return this.selectEnabled_
	}
	set selectEnabled(v) {
		this.selectEnabled_ = v
	}

	private singleSelect_:boolean = true 
	get singleSelect() {
		return this.singleSelect_
	}
	set singleSelect(v) {
		this.singleSelect_ = v
		this.unSelectAll()
	}
	
	private showBack_:boolean = false 
	get showBack() {
		return this.showBack_
	}
	set showBack(v) {
		this.showBack_ = v 
		for(let card of this.cards_) {
			card.renderer.showBack = v 
		}
	}

	private autoShowBack_:boolean = false 
	get autoShowBack() {
		return this.autoShowBack_
	}
	set autoShowBack(v) {
		this.autoShowBack_ = v
		for(let card of this.cards_) {
			card.renderer.autoShowBack = v 
		}
	}
	
	private autoFlipToShow_:boolean = false 
	get autoFlipToShow() {
		return this.autoFlipToShow_
	}
	set autoFlipToShow(v) {
		this.autoFlipToShow_ = v
		for(let card of this.cards_) {
			card.renderer.autoFlipToShow = v 
		}
	}


	protected touchInited_:boolean = false 
	protected prevTouch_:cc.Touch
	protected touchCard_:krenderer.HandSingleCard
	protected onTouchEnabled(v) {
		if(!v) {
			return 
		}
		if(this.touchInited_) {
			return 
		}
	}

	protected cancelTouch() {

	}

	setCardSelected(card:tCard,b:boolean) {

	}

	setCardsSelected(card:tCard,b:boolean) {

	}

	unSelectAll() {

	}

	get selects() { 
		return this.cards_.filter(v=>v.selected)
	}

	protected setCardPosition(info:krenderer.HandSingleCardInternal,pos:cc.Vec2,forceNoAni?:boolean) {
		info.targetPos = null 
		info.renderer.node.stopAllActions()
		if(!this.moveAni) {
			info.notFirstPos = true 
			info.renderer.node.position2 = pos 
			return 
		}
		if(!info.notFirstPos || forceNoAni) {
			info.notFirstPos = true 
			info.renderer.node.position2 = pos 
			return 
		}
		info.targetPos = pos 
		info.renderer.node.runAction(
			cc.sequence([
				cc.moveTo(this.moveAniDuration,pos).easing(cc.easeOut(2)),
				cc.callFunc(()=>{
					info.targetPos = null 
				})
			])
		)
	}
}