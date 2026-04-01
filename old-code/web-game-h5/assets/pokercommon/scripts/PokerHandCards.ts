import { Display } from "../../scripts/core/ui/Display";
import { rcEventDispatcher } from "../../scripts/core/utils/EventDispatcher";
import { rcLog } from "../../scripts/core/utils/Log";
import { rcApis } from "../../scripts/core/utils/Utils";
import { CardArray, tCardArray, tCard, Card } from "../../scripts/ServerDefines/CardDefine";
import { Poker } from "../../scripts/ServerDefines/PokerDefine";
import { PokerCard } from "./PokerCard";


const { ccclass, property, menu } = cc._decorator;

export type EventFunc = (...datas)=>any

let dispName = "_wmgzpokerhandcards_eventdisp_"
@ccclass
@menu("pokercommon/PokerHandCards")
export class PokerHandCards extends cc.Component {
	@property(cc.Prefab)
	prefabCard:cc.Prefab = null

	@property({tooltip:"选中时的起跳高度"})
	selectHeightRadio = 0.2

	@property()
	lineFixedCount = 0

	@property()
	maxLineCount = 4

	@property()
	lineMaxWidth = 700
	
	@property({tooltip:"是否启用单行伸缩"})
	autoSpaceSelect = true 

	@property({tooltip:"单行伸缩选中权限"})
	cardSpaceXPower = 2

	@property()
	cardSpaceXMinRadio = 0.1

	@property()
	cardSpaceXMaxRadio = 0.8

	@property()
	cardSpaceYRadio = 0.8

	@property()
	cardSelectAni = true

	private cardAni_:boolean = true 
	get cardAni() {
		return this.cardAni_
	}
	set cardAni(v) {
		this.cardAni_ = v
	}

	get length() {
		return this.cardInfos_.length
	}
	
	private touchEnabled_ = false
	get touchEnabled() {
		return this.touchEnabled_
	}
	set touchEnabled(b) {
		this.touchEnabled_ = b 
		this.setTouchEnabled(b)
	}

	private allMaskVisible_:boolean = false 
	get allMaskVisible() {
		return this.allMaskVisible_
	}
	set allMaskVisible(v) {
		for(let info of this.cardInfos_) {
			info.com.maskVisible = v 
		}
	}

	private rootNode_:cc.Node = null
	kdsInit() {
		this.node.on(cc.Node.EventType.ANCHOR_CHANGED,rcApis.handler(this,this.onAnchorChanged))
		this.rootNode_ = new cc.Node()
		this.node.addChild(this.rootNode_)

		this.disp_.link(this.node)
		this.sortFunc_ = function(a,b) {
			return a.serial - b.serial
		}
	}

	private cardInfos_:PokerHandCards.CardInfo[] = []

	private sortFunc_:(a:PokerHandCards.CardInfo,b:PokerHandCards.CardInfo)=>number
	get sortFunc() {
		return this.sortFunc_
	}
	set sortFunc(v) {
		this.sortFunc_ = v 
	}
	sort() {
		this.layout()
	}
	private disp_ = new rcEventDispatcher
	listen(eventName:string,func:EventFunc) {
		this.disp_.listen(eventName,func)
	}

	setCards(cards:CardArray | tCardArray) {
		this.clear()
		this.addCards(cards)
	}

	addCard(card:tCard) {
		this.addCards([card])
	}

	private serial_ = 0
	addCards(cards:CardArray | tCardArray) {
		this.unselectAll()
		let arr:tCardArray = CardArray.obj(cards)
		for(let card of arr) {
			let com = this.createCardNode(card)
			this.cardInfos_.push({
				card:new Card(card),
				com:com,
				selEnabled:true,
				serial:this.serial_ ++,
			})
			if(this.allMaskVisible) {
				com.maskVisible = true 
			}
		}
		this.layout()
		this.disp_.dispatch(PokerHandCards.Event_CardsChange)
	}

	resetCards() {
		let cards = CardArray.empty
		for(let info of this.cardInfos_) {
			cards.push(info.card)
		}
		this.setCards(cards)
	}

	getCard(idx:number) {
		if(idx >= 0 && idx < this.cardInfos_.length) {
			let info = this.cardInfos_[idx]
			return info.card.clone()
		}
		return null
	}

	getCom(idx:number) {
		if(idx >= 0 && idx < this.cardInfos_.length) {
			let info = this.cardInfos_[idx]
			return info.com
		}
		return null
	}

	getCards() {
		let ret = CardArray.empty
		for(let info of this.cardInfos_) {
			ret.push(info.card.clone())
		}
		return ret 
	}

	getMainCards(mainCard:Card) {
		let ret = CardArray.empty
		for(let info of this.cardInfos_) {
			if(this.isMainCard(info.card,mainCard)) {
				ret.push(info.card.clone())
			}
		}
		return ret 
	}

	getMainCardCount(mainCard:Card) {
		let ret = 0
		for(let info of this.cardInfos_) {
			if(this.isMainCard(info.card,mainCard)) {
				ret ++
			}
		}
		return ret 
	}

	getSuitNormalCards(suit:Poker.Suit,mainCard:Card) {
		let ret = CardArray.empty
		for(let info of this.cardInfos_) {
			if(info.card.suit == suit && !this.isMainCard(info.card,mainCard)) {
				ret.push(info.card.clone())
			}
		}
		return ret 
	}

	getCardsByFilter(func:(card:Card)=>boolean) {
		let ret = CardArray.empty
		for(let info of this.cardInfos_) {
			if(func(info.card)) {
				ret.push(info.card.clone())
			}
		}
		return ret 
	}

	each(func:(card:Card)=>void) {
		for(let info of this.cardInfos_) {
			func(info.card)
		}
	}

	find(func:(card:Card)=>boolean) {
		for(let info of this.cardInfos_) {
			if(func(info.card)) {
				return info.card.clone()
			}
		}
		return null
	}

	findIndex(func:(card:Card)=>boolean) {
		let idx = 0
		for(let info of this.cardInfos_) {
			if(func(info.card)) {
				return idx
			}
			idx ++
		}
		return -1
	}

	
	isMainCard(card:tCard | Card,mainCard:Card) {
		if(card.suit == Poker.Suit.Joker) {
			return true 
		}
		if(card.value == 2) {
			return true 
		}
		if(card.value == mainCard.value) {
			return true 
		}
		return card.suit == mainCard.suit
	}


	clear() {
		this.rootNode_.destroyAllChildren()
		this.cardInfos_ = []
		this.disp_.dispatch(PokerHandCards.Event_CardsChange)
	}

	removeCards(cards:CardArray | tCardArray) {
		this.unselectAll()
		let arr:tCardArray = CardArray.obj(cards)
		let indices:number[] = []
		let count = 0
		for(let card of arr) {
			let idx = this.cardInfos_.findIndex((v)=>v.card.equal(card))
			if(idx >= 0) {
				let info = this.cardInfos_[idx]
				info.com.node.destroy()
				this.cardInfos_.splice(idx,1)
				count ++
			}
		}
		if(count > 0) {
			this.layout()
		}
		this.disp_.dispatch(PokerHandCards.Event_CardsChange)
	}

	removeCardsWithIndex(indices:number[]) {
		this.unselectAll()
		let count = 0
		for(let idx of indices) {
			if(idx < this.cardInfos_.length) {
				let info = this.cardInfos_[idx]
				info.com.node.destroy()
				this.cardInfos_.splice(idx,1)
				count ++
			}
		}
		if(count > 0) {
			this.layout()
		}
		this.disp_.dispatch(PokerHandCards.Event_CardsChange)
	}

	select(idx:number) {
		this.clearTouch()
		if(idx >= this.cardInfos_.length) {
			return false 
		}
		let info = this.cardInfos_[idx]
		if(info.com.selected) {
			return true 
		}
		info.com.selected = true 
		this.layout()
	}

	selectCards(cards:CardArray) {
		this.unselectAll()
		for(let info of this.cardInfos_) {
			if(cards.contains(info.card)) {
				info.com.selected = true 
			} else {
				info.com.selected = false 
			}
		}
		this.layout()
	}

	getSelected() {
		let rets:number[] = []
		let idx = 0
		for(let info of this.cardInfos_) {
			if(info.com.selected) {
				rets.push(idx)
			}
			idx ++
		}
		return rets
	}
	getSelectedCards() {
		let rets = CardArray.empty
		let idx = 0
		for(let info of this.cardInfos_) {
			if(info.com.selected) {
				rets.push(info.card.clone())
			}
			idx ++
		}
		return rets

	}
	getSelectedComs() {
		let rets:PokerCard[] = []
		let idx = 0
		for(let info of this.cardInfos_) {
			if(info.com.selected) {
				rets.push(info.com)
			}
			idx ++
		}
		return rets
	}

	unselect(idx:number,ignoreAni?:boolean) {
		this.clearTouch()
		if(idx >= this.cardInfos_.length) {
			return false 
		}
		let info = this.cardInfos_[idx]
		if(!info.com.selected) {
			return true 
		}
		info.com.selected = false 
		
		this.layout()
		this.disp_.dispatch(PokerHandCards.Event_SelectChange,PokerHandCards.SelectChangeType.UnSelect)
	}

	unselectAll(ignoreAni?:boolean) {
		this.clearTouch()
		let changed = false 
		for(let info of this.cardInfos_) {
			if(info.com.selected == true) {
				changed = true 
			}
			info.com.selected = false 
			info.com.onTouchEnd()
		}
		this.layout()
		if(changed) {
			//this.disp_.dispatch(PokerHandCards.Event_SelectChange,PokerHandCards.SelectChangeType.UnSelect)
		}
	}

	setSelectEnabled(cards?:CardArray | tCardArray) {
		this.clearTouch()
		if(cards == null) {
			for(let info of this.cardInfos_) {
				info.selEnabled = true 
				//info.com.touchEnabled = this.touchEnabled
				info.com.maskVisible = false  
			}
			return 
		}
		//this.unselectAll()
		let doLayout = false 
		let arr = CardArray.obj(cards)
		for(let info of this.cardInfos_) {
			if(arr.find(v=>info.card.equal(v))) {
				info.selEnabled = true 
				//info.com.touchEnabled = this.touchEnabled
				info.com.maskVisible = false  
			} else {
				info.selEnabled = false 
				//info.com.touchEnabled = false
				info.com.maskVisible = true  
				if(info.com.selected) {
					info.com.selected = false 
					doLayout = true 
				}
			}
		}
		if(doLayout) {
			this.layout()
		}
	}

	private touchBegin_ = false 
	private clearTouch() {
		this.touchBegin_ = false 
		for(let info of this.cardInfos_) {
			if(info.touchSelect) {
				if(info.selEnabled) {
					info.com.onTouchEnd()
				}
			}
			info.touchSelect = false 
		}
	}
	private setTouchEnabled(b) {
		// for(let info of this.cardInfos_) {
		// 	info.com.touchEnabled = info.selEnabled && b 
		// }
		this.node.targetOff(this)
		if(b) {
			let rt:{
				startPos?:cc.Vec2,
				fixedLineIndex?:number,
				firstIndex?:number,
				firstSelect?:boolean,
			} = {}
			let self = this
			let handleTouch = function(wpos:cc.Vec2,begin?:boolean) {
				if(begin) {
					self.touchBegin_ = true 
					rt.startPos = null
					rt.fixedLineIndex = null
					rt.firstIndex = null
					for(let info of self.cardInfos_) {
						info.touchSelect = false 
						if(!info.selEnabled) {
							continue
						}
						info.cacheBoundingBox = info.com.node.getBoundingBox()
						let thisBox = info.cacheBoundingBox.clone()
						
						if(info.com.selected) {
							thisBox.y -= (info.spos.y - info.opos.y)
							thisBox.height += (info.spos.y - info.opos.y)
						}
						info.cacheTouchRect = thisBox
					}
				} else {
					if(!self.touchBegin_) {
						return 
					}
				}
				let lpos = self.rootNode_.convertToNodeSpaceAR(wpos)
				if(rt.startPos == null) {
					rt.startPos = lpos 
				}
				let box = cc.Rect.fromMinMax(lpos,rt.startPos)
				if(box.width == 0) {
					box.width = 1
				} 
				if(box.height == 0) {
					box.height = 1
				}
				if(rt.fixedLineIndex == null) {
					let selected:number[] = []
					for(let i = 0 ; i < self.cardInfos_.length ; i ++) {
						let info = self.cardInfos_[i]
						if(!info.selEnabled) {
							continue
						}
						//let thisBox = info.com.node.getBoundingBox()
						let thisBox = info.cacheBoundingBox
						// if(info.com.selected) {
						// 	thisBox.y -= (info.spos.y - info.opos.y)
						// } else {
						// 	thisBox.y += (info.spos.y - info.opos.y)
						// }
						if(thisBox.intersects(box)) {
							selected.push(i)
						}
					}
					if(selected.length == 0) {
						return 
					}
					selected.sort((a,b)=>b-a)
					let i = selected[0]
					let info = self.cardInfos_[i]
					rt.fixedLineIndex = info.lineIdx
					rt.firstIndex = i
					info.touchSelect = true 
					info.com.onTouchStart()
				}
				let nextBox:cc.Rect = null
				for(let i = 0 ; i < self.cardInfos_.length ; i ++) {
					if(i == rt.firstIndex) {
						continue
					}
					let info = self.cardInfos_[i]
					if(info.lineIdx != rt.fixedLineIndex || !info.selEnabled) {
						continue
					}
					let thisBox = info.cacheTouchRect
					// let thisBox = info.com.node.getBoundingBox()
					// if(info.com.selected) {
					// 	thisBox.y -= (info.spos.y - info.opos.y)
					// 	thisBox.height += (info.spos.y - info.opos.y)
					// } else {
					// 	//thisBox.height += (info.spos.y - info.opos.y)
					// }
					if(i < (self.cardInfos_.length - 1)) {
						let nextInfo = self.cardInfos_[i+1]
						if(nextInfo.lineIdx == rt.fixedLineIndex && nextInfo.selEnabled) {
							//nextBox = nextInfo.com.node.getBoundingBox()
							nextBox = nextInfo.cacheBoundingBox
							// 如果有相交的情况出现
							if(thisBox.xMax > nextBox.x) {
								thisBox.width -= (thisBox.xMax - nextBox.x)
							}
						} else {
							nextBox = null
						}
					} else {
						nextBox = null
					}
					// if(i == 10) {
					// 	rcLog(box)
					// 	rcLog(thisBox)
					// }
					if(box.intersects(thisBox)) {
						if(!info.touchSelect) {
							info.touchSelect = true 
							info.com.onTouchStart()
						}
					} else {
						if(info.touchSelect) {
							info.touchSelect = false 
							info.com.onTouchEnd()
						}
					}
				}
			}

			let handleTouchEnd = function() {
				let dirty = false 
				for(let i = 0 ; i < self.cardInfos_.length ; i ++) {
					let info = self.cardInfos_[i]
					if(!info.touchSelect) {
						continue
					}
					info.com.selected = !info.com.selected
					info.com.onTouchEnd()
					dirty = true 
				}
				if(dirty) {
					self.layout()
					self.disp_.dispatch(PokerHandCards.Event_SelectChange,PokerHandCards.SelectChangeType.Touch,rt.firstSelect)
				}
			}
			this.node.on(cc.Node.EventType.TOUCH_START,function(touch:cc.Touch) {
				rt.firstSelect = true 
				for(let info of self.cardInfos_) {
					if(info.com.selected) {
						rt.firstSelect = false 
						break 
					}
				}
				handleTouch(touch.getLocation(),true)
			},this)
			this.node.on(cc.Node.EventType.TOUCH_MOVE,function(touch:cc.Touch) {
				handleTouch(touch.getLocation())

			},this)
			this.node.on(cc.Node.EventType.TOUCH_END,function(touch:cc.Touch) {
				handleTouch(touch.getLocation())
				handleTouchEnd()
			},this)
			this.node.on(cc.Node.EventType.TOUCH_CANCEL,function(touch:cc.Touch) {
				handleTouch(touch.getLocation())
				handleTouchEnd()
			},this)
		}

	}
	private setCardPosition(com:PokerCard,pos:cc.Vec2,ignoreAni?:boolean) {
		com.node.stopAllActions()
		if(!ignoreAni) {
			if((com.node.position2.sub(pos)).magSqr() < 1) {
				com.node.position2 = pos 
				return 
			}
		}
		if(ignoreAni || !this.cardAni) {
			//this.node.setPosition.apply(com.node,[pos])
			com.node.position2 = pos 
			//rcLog("after set pos = " + JSON.stringify(com.node.position2))
			return 
		}
		com.node.runAction(cc.sequence([
			cc.moveTo(0.1,pos).easing(cc.easeOut(2)),
			cc.callFunc(function() {
				//this.node.setPosition.apply(com.node,[pos])
			})
		]))
	}

	private createCardNode(card:tCard) {
		let node = kcore.display.instantiate(this.prefabCard)
		let com = node.getComponent(PokerCard)
		com.setCard(card)
		let self = this 
		com.listen(PokerCard.Event_Click,function() {
			let idx = self.cardInfos_.findIndex(v=>v.com == com)
			if(idx >= 0) {
				let info = self.cardInfos_[idx]
				if(info.com.selected) {
					self.unselect(idx)
				} else {
					self.select(idx)
				}
				self.disp_.dispatch(PokerHandCards.Event_SelectChange,PokerHandCards.SelectChangeType.Touch)
			}
		})
		//com.touchEnabled = this.touchEnabled
		this.rootNode_.addChild(node)
		return com 
	}

	private onAnchorChanged() {
		// let size = this.node.getContentSize()
		// let ap = this.node.getAnchorPoint()
		// let pos = cc.v2((ap.x - 0.5) * size.width,(0.5 - ap.y) * size.height)
		this.layout()
		//this.rootNode_.position2 = pos 
	}

	private layout() {
		if(this.cardInfos_.length == 0) {
			this.node.setContentSize(cc.size(0,0))
			//this.onAnchorChanged()
			return 
		}
		let ap = this.node.getAnchorPoint()

		this.cardInfos_.sort(this.sortFunc)
		let len = this.cardInfos_.length
		let lineCount = 1 
		let lineNodeCount = 0 

		lineNodeCount = this.lineFixedCount;

		lineCount = 0
		let tempCount = len
		while (tempCount > 0) { 
			//print("tempCount" .. tempCount)
			tempCount = tempCount - lineNodeCount
			lineCount = lineCount + 1
		} 
		if (lineCount == 0) { 
			lineCount = 1
		} 

		if(lineCount > this.maxLineCount) {
			//lineCount = this.maxLineCount
		}
		if (lineCount == 1) { 
			lineNodeCount = len 
		} 

		let firstCard = this.cardInfos_[0]
		let cardSize = firstCard.com.node.getContentSize()

		let useWidth = 0
		let useHeight = 0
		let useSpace = 0
		let maxWidth = cardSize.width + cardSize.width * this.cardSpaceXMaxRadio * (lineNodeCount - 1)
		let minWidth = cardSize.width + cardSize.width * this.cardSpaceXMinRadio * (lineNodeCount - 1)
		let autoSpaceEnable = true 
		if(!this.autoSpaceSelect) {
			autoSpaceEnable = false 
			if(this.lineMaxWidth > 0 && maxWidth > this.lineMaxWidth) {
				useWidth = this.lineMaxWidth
				if(lineNodeCount <= 1) {
					useSpace = 0
				} else {
					useSpace = (useWidth - cardSize.width) / (lineNodeCount - 1)
				}
			} else {
				useWidth = minWidth
				useSpace = this.cardSpaceXMinRadio * cardSize.width 
			}
			useWidth = minWidth
		} else {
			if (this.lineMaxWidth > 0 && maxWidth > this.lineMaxWidth) { 
				useWidth = this.lineMaxWidth
				if(lineNodeCount <= 1) {
					useSpace = 0
				} else {
					useSpace = (useWidth - cardSize.width) / (lineNodeCount - 1)
				}
			} else {
				autoSpaceEnable = false 
				useWidth = maxWidth 
				useSpace = this.cardSpaceXMaxRadio * cardSize.width 
			} 
		}
		//rcLog({maxWidth,minWidth})
		//rcLog({useWidth,useSpace})
		//rcLog({lineCount,lineNodeCount})
		let yRadio = this.cardSpaceYRadio
		if(lineCount > this.maxLineCount && lineCount > 1) {
			useHeight = cardSize.height + (this.maxLineCount - 1) * this.cardSpaceYRadio * cardSize.height
			yRadio = (useHeight - cardSize.height) / (cardSize.height * (lineCount - 1))
		} else {
			useHeight = cardSize.height + (lineCount - 1) * this.cardSpaceYRadio * cardSize.height
		}
		this.node.setContentSize(cc.size(useWidth,useHeight + cardSize.height * this.selectHeightRadio * 2))
		//this.onAnchorChanged()
		//rcLog(this.node.getContentSize())

		//rcLog("-----------")
		let powers = []
		let idx = 0
		for (let i = 0 ; i < lineCount ; i ++) { 
			let p = []
			powers.push(p)
			// 计算间隔权重
			let oldIdx = idx
			for(let j = 0 ; j < lineNodeCount ; j ++) { 
				let card:PokerCard
				if(idx < this.cardInfos_.length) {
					card = this.cardInfos_[idx].com
				}
				if(card) { 
					if (j > 0) { 
						let node = card.node 
						if (this.autoSpaceSelect && autoSpaceEnable) { 
							if (card.selected) { 
								PokerHandCards.combineSpaceAutoPer(p,j,1,this.cardSpaceXPower)
								if (j < (lineNodeCount - 1)) { 
									PokerHandCards.combineSpaceAutoPer(p,j+1,1,this.cardSpaceXPower)
								} 
							} else {
								PokerHandCards.combineSpaceAutoPer(p,j,1,1)
							} 
						} else {
							p[j] = 1
						} 
					} else {
						p[j] = 0
					} 
				} 
				idx ++
			} 
			// 归一
			if (p.length > 1) { 
				let sum = 0 
				let totalSpaceNormal = p.length - 1
				for(let v of p) {
					sum += v
				}
				for(let j = 0 ; j < p.length ; j++) {
					p[j] = p[j] / sum * totalSpaceNormal
				}
			} 

			//dump(p)
			//rcLog(JSON.stringify(p))
			// 排版
			idx = oldIdx
			let stepx = 0
			for(let j = 0 ; j < lineNodeCount ; j ++) { 
				let info:PokerHandCards.CardInfo
				let card:PokerCard
				if(idx < this.cardInfos_.length) {
					info = this.cardInfos_[idx]
					card = info.com
				}
				if (card) { 
					let node = card.node 
					let space = p[j] * useSpace
					stepx = stepx + space 
					// 左上角坐标
					let x = stepx  
					let y = useHeight - i * yRadio * cardSize.height
					//let ap = node.getAnchorPoint()
					// 基于(0,0)和自身ap的位置
					x = x + 0.5 * cardSize.width - ap.x * useWidth
					y = y - 0.5 * cardSize.height - ap.y * useHeight 
					//rcLog({x,y})
					let firstSetPosition = info.opos == null
					info.opos = cc.v2(x,y)
					info.spos = cc.v2(x,y + cardSize.height * this.selectHeightRadio)
					//rcLog(JSON.stringify(info.opos) + "-" + JSON.stringify(info.spos))
					if(card.selected) {
						if(firstSetPosition) {
							this.setCardPosition(card,info.spos,true)
						} else {
							this.setCardPosition(card,info.spos)
						}
					} else {
						if(firstSetPosition) {
							this.setCardPosition(card,info.opos,true)
						} else {
							this.setCardPosition(card,info.opos)
						}
					}
					info.lineIdx = i 
					info.subIdx = j 

					node.zIndex = idx
				} 
				idx ++
			} 
		} 
	}
}
export namespace PokerHandCards {
	export type CardInfo = {
		card:Card,
		com:PokerCard,
		opos?:cc.Vec2,
		spos?:cc.Vec2,
		serial?:number
		selEnabled:boolean,

		lineIdx?:number,
		subIdx?:number,
		size?:cc.Size,
		touchSelect?:boolean,

		cacheBoundingBox?:cc.Rect,
		cacheTouchRect?:cc.Rect,
	}
	
	export function combineSpaceAutoPer(p:number[],idx,dv,v) {
		let cv = idx < p.length ? p[idx] : dv
		v = (cv + v) / 2
		p[idx] = v
	}
	export const Event_SelectChange = "Event_SelectChanged"
	export enum SelectChangeType {
		Touch,
		UnSelect,
	}
	export const Event_CardsChange = "Event_CardsChange"
}