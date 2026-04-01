import _ = require("underscore")
import { CardArray } from "../../ServerDefines/CardDefine"
import { GameSet } from "../../ServerDefines/GameSet"
import { Poker } from "../../ServerDefines/PokerDefine"
import { TexasDefine, TexasRule } from "./TexasDefine"


export class TexasPower {
	constructor(gameSet:GameSet) {
		this.gameSet_ = gameSet
		if(this.gameSet_.checkRule(TexasRule.Group1,TexasRule.Group1_Long)) {
			this.initWithLong()
		} else {
			this.initWithShort()
		}
	}

	private gameSet_:GameSet
	
	typePowers = new Map<TexasDefine.CardType,number>()
	cardPowers = new Map<Poker.Value,number>()

	initWithLong() {
		this.typePowers.set(TexasDefine.CardType.High,			0x00010000)
		this.typePowers.set(TexasDefine.CardType.Pair,			0x00020000)
		this.typePowers.set(TexasDefine.CardType.DoublePair,	0x00030000)
		this.typePowers.set(TexasDefine.CardType.Three,			0x00040000)
		this.typePowers.set(TexasDefine.CardType.Straight,		0x00050000)
		this.typePowers.set(TexasDefine.CardType.Flush,			0x00060000)
		this.typePowers.set(TexasDefine.CardType.FullHouse,		0x00070000)
		this.typePowers.set(TexasDefine.CardType.Four,			0x00080000)
		this.typePowers.set(TexasDefine.CardType.StraightFlush,	0x00090000)
		this.initCardPower()
	}

	initWithShort() {
		this.typePowers.set(TexasDefine.CardType.High,			0x00010000)
		this.typePowers.set(TexasDefine.CardType.Pair,			0x00020000)
		this.typePowers.set(TexasDefine.CardType.DoublePair,	0x00030000)
		this.typePowers.set(TexasDefine.CardType.Three,			0x00040000)
		this.typePowers.set(TexasDefine.CardType.Straight,		0x00050000)
		this.typePowers.set(TexasDefine.CardType.FullHouse,		0x00060000)
		this.typePowers.set(TexasDefine.CardType.Flush,			0x00070000)
		this.typePowers.set(TexasDefine.CardType.Four,			0x00080000)
		this.typePowers.set(TexasDefine.CardType.StraightFlush,	0x00090000)
		this.initCardPower()
	}

	private initCardPower() {
		this.cardPowers.set(Poker.Value.V2,		2)
		this.cardPowers.set(Poker.Value.V3,		3)
		this.cardPowers.set(Poker.Value.V4,		4)
		this.cardPowers.set(Poker.Value.V5,		5)
		this.cardPowers.set(Poker.Value.V6,		6)
		this.cardPowers.set(Poker.Value.V7,		7)
		this.cardPowers.set(Poker.Value.V8,		8)
		this.cardPowers.set(Poker.Value.V9,		9)
		this.cardPowers.set(Poker.Value.V10,	10)
		this.cardPowers.set(Poker.Value.J,		11)
		this.cardPowers.set(Poker.Value.Q,		12)
		this.cardPowers.set(Poker.Value.K,		13)
		this.cardPowers.set(Poker.Value.V1,		14)
	}

	/**
	 * 从大到小
	 * @param cards 
	 */
	sort(cards:CardArray) {
		cards.sort((a,b)=>this.cardPowers.get(b.value) - this.cardPowers.get(a.value))
	}

	analyse(cards:CardArray) {
		cards = cards.clone()
		for(let i = cards.length - 1 ; i >= 0 ; i --) {
			let card = cards.at(i)
			if(card.suit == 0) {
				cards.remove(i)
			}
		}
		let typeCount = 0
		let pairValues:number[] = []
		let tripleValue:number = -1
		let fourValue:number = -1
		this.sort(cards)
		let prevValue = -1
		let valueCount = 0
		let highPower = 0
		let highCount = 0
		let prevSuit = null 
		for(let i = 0 ; i <= cards.length ; i ++) {
			let card = cards.at(i)
			if(!card || prevValue < 0 || prevValue != card.value) {
				if(prevValue >= 0) {
					switch(valueCount) {
						case 2:{
							pairValues.push(prevValue)
							typeCount ++ 
						} break 
						case 3:{
							tripleValue = prevValue
							typeCount ++ 
						} break 
						case 4:{
							fourValue = prevValue
							typeCount ++ 
						} break 
						default:{
							highPower = highPower << 4
							highPower |= this.cardPowers.get(prevValue)
						} break 
					}
				}
				if(card) {
					prevValue = card.value 
					valueCount = 1
				}
			} else {
				valueCount ++
			}
			if(!card) {
				break 
			}
			if(prevSuit == null) {
				prevSuit = card.suit
			} else if(prevSuit != card.suit) {
				prevSuit = -1
			}
		}
		if(typeCount == 0) {
			// 顺子 同花 ？
			let straight = false 
			let straightPower = 0
			if(cards.length == 5) {
				if(cards.at(0).value - cards.at(4).value == 4) {
					straight = true 
					straightPower = this.cardPowers.get(cards.at(0).value)
				} else if(cards.at(0).value == Poker.Value.V1 
						&& cards.at(1).value - cards.at(4).value == 3
						&& cards.at(1).value == Poker.Value.V5) {
					straight = true
					straightPower = 1
				} else if(this.gameSet_.checkRule(TexasRule.Group1,TexasRule.Group1_Short)) {
					// A 9 8 7 6
					if(cards.at(0).value == Poker.Value.V1 
					&& cards.at(1).value - cards.at(4).value == 3
					&& cards.at(1).value == Poker.Value.V9) {
						straight = true
						straightPower = 1
					}
				}
			}
			// 同花
			if(prevSuit >= 0) {
				if(straight) {
					// 同花顺
					return this.makeCardType(TexasDefine.CardType.StraightFlush,straightPower)
				} else {
					// 同花
					return this.makeCardType(TexasDefine.CardType.Flush,highPower)
				}
			} else {
				if(straight) {
					// 顺子
					return this.makeCardType(TexasDefine.CardType.Straight,straightPower)
				}
			}
			return this.makeCardType(TexasDefine.CardType.High,highPower)
		}
		if(typeCount == 1) {
			// 一对 三条 四条
			if(pairValues.length > 0) {
				let power = 0
				_.each(pairValues,(v,i)=>(power |= 
					(this.cardPowers.get(v) << ((4-i) * 4))
				))
				power |= highPower
				return this.makeCardType(TexasDefine.CardType.Pair,power)
			} else if(tripleValue >= 0) {
				return this.makeCardType(TexasDefine.CardType.Three,(this.cardPowers.get(tripleValue) << 16) | highPower)
			} else if(fourValue >= 0) {
				return this.makeCardType(TexasDefine.CardType.Four,(this.cardPowers.get(fourValue) << 16) | highPower)
			}
		} else if(typeCount == 2) {
			if(pairValues.length > 0) {
				if(tripleValue >= 0) {
					// 葫芦
					return this.makeCardType(TexasDefine.CardType.FullHouse,
						(this.cardPowers.get(tripleValue) << 16) | (this.cardPowers.get(pairValues[0]) << 12)
					)
				} else {
					// 两对
					return this.makeCardType(TexasDefine.CardType.DoublePair,
						(this.cardPowers.get(pairValues[0]) << 16) | (this.cardPowers.get(pairValues[1]) << 12) | highPower
					)
				}
			}
		}
	}

	analyseWithDiCards(handCards:CardArray,diCards:CardArray) {
		let all = handCards.clone().pushArray(diCards)
		if(all.length < 5) {
			return null
		}
		let cardss = CardArray.getZuHeCards(all,5,false)
		let maxCardType = 0
		let maxCardArray:CardArray
		let idx = 0
		for(let cards of cardss) {
			let cardType = this.analyse(cards)
			if(cardType > maxCardType) {
				maxCardType = cardType
				maxCardArray = cards
			}
			idx++
		}
		return maxCardType ? {
			cardType:maxCardType,
			cards:maxCardArray,
		} : null
	}
	

	makeCardType(cardType:number,power:number) {
		return TexasDefine.makeCardType(cardType,this.typePowers.get(cardType),power)
	}

}