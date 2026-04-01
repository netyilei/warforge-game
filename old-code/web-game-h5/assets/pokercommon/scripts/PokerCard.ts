import { rcEventDispatcher } from "../../scripts/core/utils/EventDispatcher";
import { rcApis } from "../../scripts/core/utils/Utils";
import { Card, tCard } from "../../scripts/ServerDefines/CardDefine";
import { Poker } from "../../scripts/ServerDefines/PokerDefine";
import { EventFunc } from "./PokerHandCards";


const ccWMGZPokerSuit = cc.Class({
	name:"ccWMGZPokerSuit",
	properties: {
		suit: {
			type:cc.Enum(Poker.Suit),
			default:Poker.Suit.CaoHua,
		},
		frame: {
			type:cc.SpriteFrame,
			default:null
		}
	}
})
type WMGZPokerSuitType = {
	suit:Poker.Suit,
	frame:cc.SpriteFrame,
}


const ccWMGZPokerSuitExtra = cc.Class({
	name:"ccWMGZPokerSuitExtra",
	properties:{
		suit: {
			default:-1,
		},
		frame: {
			type:cc.SpriteFrame,
			default:null
		}
	}
})
type WMGZPokerSuitExtra = {
	suit:number,
	frame:cc.SpriteFrame,
}

const ccWMGZPokerFull = cc.Class({
	name:"ccWMGZPokerFull",
	properties: {
		suit: {
			type:cc.Enum(Poker.Suit),
			default:Poker.Suit.CaoHua,
		},
		value: {
			type:cc.Enum(Poker.Value),
			default:Poker.Value.V1,
		},
		frame: {
			type:cc.SpriteFrame,
			default:null
		}
	}
})
type WMGZPokerFullType = {
	suit:Poker.Suit,
	value:Poker.Value,
	frame:cc.SpriteFrame,
}
const ccWMPokerAtlasSuitDefine = cc.Class({
	name:"ccWMPokerAtlasSuitDefine",
	properties:{
		suit: {
			type:Poker.Suit,
			default:Poker.Suit.HeiTao,
		},
		valueFmt: {
			default:"{0}"
		},
	}
})
type WMPokerAtlasSuitDefine = {
	suit:Poker.Suit
	valueFmt:string,
}
const ccWMPokerAtlasDefine = cc.Class({
	name:"ccWMPokerAtlasDefine",
	properties:{
		atlas: {
			type:cc.SpriteAtlas,
			default:null,
		},
		suits: {
			type:[ccWMPokerAtlasSuitDefine],
			default:[],
		}
	}
})
type WMPokerAtlasDefine = {
	atlas:cc.SpriteAtlas,
	suits:WMPokerAtlasSuitDefine[],
}
const { ccclass, property, menu } = cc._decorator;

let dispName = "_PokerCard_eventdisp_"
@ccclass
@menu("pokercommon/PokerCard")
export class PokerCard extends cc.Component {

	@property(cc.Sprite)
	sprValue:cc.Sprite = null
	@property(cc.Sprite)
	sprSmallSuit:cc.Sprite = null
	@property(cc.Sprite)
	sprBigSuit:cc.Sprite = null
	@property(cc.Sprite)
	sprJoker:cc.Sprite = null
	@property(cc.Sprite)
	sprJokerLogo:cc.Sprite = null 

	@property(cc.Sprite)
	sprMask:cc.Sprite = null
	@property(cc.SpriteFrame)
	frameCardBg:cc.SpriteFrame = null 
	@property(cc.SpriteFrame)
	frameCardBack:cc.SpriteFrame = null 

	@property([cc.SpriteFrame])
	frameBlacks:cc.SpriteFrame[] = []
	@property([cc.SpriteFrame])
	frameReds:cc.SpriteFrame[] = []
	@property([cc.SpriteFrame])
	frameJokers:cc.SpriteFrame[] = []
	@property(cc.SpriteFrame)
	frameAD:cc.SpriteFrame = null
	@property([ccWMGZPokerSuit])
	suitSmallDefines:WMGZPokerSuitType[] = []
	@property([ccWMGZPokerSuit])	
	suitBigDefines:WMGZPokerSuitType[] = []
	@property([ccWMGZPokerSuitExtra])
	suitSmallExtraDefines:WMGZPokerSuitExtra[] = []
	@property([ccWMGZPokerSuitExtra])
	suitBigExtraDefines:WMGZPokerSuitExtra[] = []

	@property([ccWMGZPokerFull])
	suitFullDefines:WMGZPokerFullType[] = []
	@property(ccWMPokerAtlasDefine)
	atlasDefine:WMPokerAtlasDefine = null

	kdsInit() {
		this.sprMask.node.active = true 
		this.maskVisible = false 
	}
	start() {
		this.disp_.link(this.node)
	}

	private card_:Card = new Card(0,0);
	get card() {
		return this.card_.clone()
	}

	private maskAni_ = true 
	get maskAni() {
		return this.maskAni_
	}
	set maskAni(v)  {
		this.maskAni_ = v 
	}
	get mask() {
		return this.sprMask
	}

	get maskVisible() {
		return this.sprMask.node.active && this.sprMask.node.opacity == 255
	}
	set maskVisible(b) {
		this.sprMask.node.stopAllActions()
		//this.sprMask.node.active = b 
		this.sprMask.node.opacity = b ? 255 : 0
	}

	private selected_ = false 
	get selected() {
		return this.selected_
	}
	set selected(v) {
		this.selected_ = v 
	}

	private customData_:any = null 
	get customData() {
		return this.customData_
	}
	set customData(v) {
		this.customData_ = v
	}

	private touchEnabled_ = false
	get touchEnabled() {
		return this.touchEnabled_
	}
	set touchEnabled(b) {
		this.touchEnabled_ = b 
		this.setTouchEnabled(b)
	}
	
	setCard(card:Card | tCard) {
		this.card_ = new Card(card)
		let fullDef = this.suitFullDefines.find(v=>this.card_.equal(v))
		if(fullDef) {
			this.sprValue.node.active = false 
			this.sprJoker.node.active = false
			this.sprJokerLogo.node.active = false 
			this.sprBigSuit.node.active = false 
			this.sprSmallSuit.node.active = false 
			this.getComponent(cc.Sprite).spriteFrame = fullDef.frame
			return 
		}
		if(this.atlasDefine && this.atlasDefine.atlas && this.atlasDefine.suits.length > 0) {
			let suitDefine = this.atlasDefine.suits.find(v=>v.suit == this.card_.suit)
			if(suitDefine) {
				let str = rcApis.stringformat(suitDefine.valueFmt,this.card_.value.toString())
				let frame = this.atlasDefine.atlas.getSpriteFrame(str)
				if(frame) {
					this.sprValue.node.active = false 
					this.sprJoker.node.active = false
					this.sprJokerLogo.node.active = false 
					this.sprBigSuit.node.active = false 
					this.sprSmallSuit.node.active = false 
					this.getComponent(cc.Sprite).spriteFrame = frame
					return 
				}
			}
		}
		if(this.card_.suit == 0 || this.card_.value == 0) {
			this.sprValue.node.active = false 
			this.sprJoker.node.active = false
			this.sprJokerLogo.node.active = false 
			this.sprBigSuit.node.active = false 
			this.sprSmallSuit.node.active = false 

			this.getComponent(cc.Sprite).spriteFrame = this.frameCardBack
			return 
		}
		this.getComponent(cc.Sprite).spriteFrame = this.frameCardBg
		if(this.card_.suit == Poker.Suit.Joker) {
			this.sprValue.node.active = false 
			this.sprJoker.node.active = true 
			this.sprJokerLogo.node.active = true 
			this.sprBigSuit.node.active = false 
			this.sprSmallSuit.node.active = false 

			this.sprJoker.spriteFrame = 
				this.card_.value == Poker.Value.SJoker ?
				this.frameJokers[0] :
				this.frameJokers[1]
			this.sprJokerLogo.spriteFrame = 
				this.card_.value == Poker.Value.SJoker ?
				this.frameJokers[2] :
				this.frameJokers[3]
			return 
		}
		this.sprBigSuit.node.active = true 
		this.sprSmallSuit.node.active = true 
		
		this.sprValue.node.active = true 
		this.sprJoker.node.active = false 
		this.sprJokerLogo.node.active = false 
		if(this.card_.suit == Poker.Suit.HeiTao || this.card_.suit == Poker.Suit.CaoHua) {
			this.sprValue.spriteFrame = this.frameBlacks[this.card_.value - 1]
		} else {
			this.sprValue.spriteFrame = this.frameReds[this.card_.value - 1]
		}
		let sInfo = this.suitSmallDefines.find(v=>v.suit == this.card_.suit) || this.suitSmallExtraDefines.find(v=>v.suit == this.card_.suit)
		let bInfo = this.suitBigDefines.find(v=>v.suit == this.card_.suit) || this.suitBigExtraDefines.find(v=>v.suit == this.card_.suit)
		
		if(sInfo) {
			this.sprSmallSuit.spriteFrame = sInfo.frame
		} else {
			this.sprSmallSuit.spriteFrame = null
		}
		if(bInfo) {
			this.sprBigSuit.spriteFrame = bInfo.frame
		} else {
			this.sprBigSuit.spriteFrame = null
		}
	}

	private disp_ = new rcEventDispatcher
	listen(eventName:string,func:EventFunc) {
		this.disp_.listen(eventName,func)
	}

	private setTouchEnabled(b:boolean) {
		this.node.targetOff(this)
		if(b) {
			let self = this
			this.node.on(cc.Node.EventType.TOUCH_START,function() {
				self.disp_.dispatch(PokerCard.Event_TouchStart,this)
				self.onTouchStart()
			},this)
			this.node.on(cc.Node.EventType.TOUCH_END,function() {
				self.disp_.dispatch(PokerCard.Event_TouchEnd,this)
				self.onTouchEnd()
			},this)
			this.node.on(cc.Node.EventType.TOUCH_CANCEL,function() {
				self.onTouchEnd()
			},this)
			this.node.on(cc.Node.EventType.TOUCH_END,function() {
				self.disp_.dispatch(PokerCard.Event_Click,this)
			},this)
		}

	}
	onTouchStart() {
		if(this.maskAni) {
			if(this.sprMask) {
				this.sprMask.node.active = true 
				this.sprMask.node.runAction(cc.fadeIn(0.1).easing(cc.easeOut(2)))
			}
		} else {
			if(this.sprMask) {
				this.sprMask.node.active = false 
			}
		}
	}
	onTouchEnd() {
		if(this.maskAni) {
			if(this.sprMask) {
				this.sprMask.node.active = true 
				this.sprMask.node.runAction(cc.fadeOut(0.1).easing(cc.easeIn(2)))
			}
		} else {
			if(this.sprMask) {
				this.sprMask.node.active = false 
			}
		}

	}

	private flags_:{
		tag:string,
		spr:cc.Sprite,
		ap:cc.Vec2,
		offset:cc.Vec2,
	}[] = []
	addFlag(opt:{
		tag?:string,
		ap?:cc.Vec2,
		offset?:cc.Vec2,
		frame:cc.SpriteFrame,
	}) {
		opt.ap = opt.ap || cc.v2(1,1)
		opt.offset = opt.offset || cc.v2()
		opt.tag = opt.tag || "noname"

		let node = new cc.Node()
		let spr = node.addComponent(cc.Sprite)
		spr.sizeMode = cc.Sprite.SizeMode.TRIMMED
		spr.type = cc.Sprite.Type.SIMPLE
		spr.spriteFrame = opt.frame 
		this.node.addChild(node)
		this.flags_.push({
			tag:opt.tag,
			spr:spr,
			ap:opt.ap,
			offset:opt.offset,
		})
		this.layoutFlags()
		return spr 
	}

	getFlag(tag:string) {
		let info = this.flags_.find(v=>v.tag == tag)
		return info ? info.spr : null 
	}

	clearFlags() {
		for(let info of this.flags_) {
			info.spr.node.destroy()
		} 
		this.flags_.splice(0)
	}

	removeFlag(tag:string) {
		let idx = this.flags_.findIndex(v=>v.tag == tag)
		if(idx >= 0) {
			let info = this.flags_[idx]
			info.spr.node.destroy()
			this.flags_.splice(idx,1)
		}
	}

	layoutFlags() {
		let size = this.node.getContentSize()
		let ap = this.node.getAnchorPoint()
		let ox = -size.width * ap.x 
		let oy = -size.height * ap.y 
		for(let info of this.flags_) {
			let flagSize = info.spr.node.getContentSize()

			let x = info.ap.x * (size.width - flagSize.width) + ox + flagSize.width * 0.5 + info.offset.x 
			let y = info.ap.y * (size.height - flagSize.height) + oy + flagSize.height * 0.5 + info.offset.y 
			info.spr.node.position2 = cc.v2(x,y)
		}
	}
}

export namespace PokerCard {
	export const Event_TouchStart = "Event_TouchStart"
	export const Event_TouchEnd = "Event_TouchEnd"
	export const Event_Click = "Event_Click"
}

let valueMap = {
	// 红桃
	201:12,
	202:13,
	203:1,
	204:2,
	205:3,
	206:4,
	207:5,
	208:6,
	209:7,
	210:8,
	211:9,
	212:10,
	213:11,
	
	// 草花
	401:25,
	402:26,
	403:14,
	404:15,
	405:16,
	406:17,
	407:18,
	408:19,
	409:20,
	410:21,
	411:22,
	412:23,
	413:24,

	// 黑桃
	101:38,
	102:39,
	103:27,
	104:28,
	105:29,
	106:30,
	107:31,
	108:32,
	109:33,
	110:34,
	111:35,
	112:36,
	113:37,

	// 方片
	301:51,
	302:52,
	303:40,
	304:41,
	305:42,
	306:43,
	307:44,
	308:45,
	309:46,
	310:47,
	311:48,
	312:49,
	313:50,

	// joker
	514:53,
	515:54,
}