import _ = require("underscore")


export class Card {
	constructor(suit?:number | tCard,value?:number) {
		if(suit == null) {
			this.suit = 0
			this.value = 0
		} else {
			if(typeof(suit) == "number") {
				this.suit = suit
				this.value = value == null ? 0 : value 
			} else {
				this.suit = suit.suit == null ? 0 : suit.suit
				this.value = suit.value == null ? 0 : suit.value
			}
		}
		this.serial = 0
	}
	suit:number
	value:number
	serial:number

	get obj() {
		let ret:tCard = {
			suit:this.suit,
			value:this.value
		}
		return ret 
	}

	get data() {
		return this.suit * 1000 + this.value
	}

	equal(other:Card | tCard) {
		if(other instanceof Card) {
			return this.suit == other.suit && this.value == other.value && this.serial == other.serial
		}
		return this.suit == other.suit && this.value == other.value
	}

	clone() {
		return new Card(this)
	}
	
	static get None() {
		return new Card()
	}

	static obj(suit?:number | tCard,value?:number) {
		let ret:tCard = {
			suit:0,
			value:0,
		}
		if(suit == null) {
			ret.suit = 0
			ret.value = 0
		} else {
			if(typeof(suit) == "number") {
				ret.suit = suit
				ret.value = value == null ? 0 : value 
			} else {
				ret.suit = suit.suit == null ? 0 : suit.suit
				ret.value = suit.value == null ? 0 : suit.value
			}
		}
		return ret 
	}

	static fromData(data:number) {
		return new Card(Math.round(data / 1000),data % 1000)
	}
}

export type tCard = {
	suit:number,
	value:number,
}

export namespace tCard {
	export function equal(a:tCard,b:tCard) {
		return a.suit == b.suit && a.value == b.value
	}
	export function create(suit:number,value:number) {
		return <tCard>{
			suit,value
		}
	}
}

export class CardArray {
	constructor(cards?:CardArray | tCardArray) {
		if(cards) {
			if(cards instanceof CardArray) {
				this.cards_ = cards.cards
			} else {
				for(let card of cards) {
					this.push(card)
				}
			}
		}
	}
	private cards_:Card[] = []
	get cards() {
		return this.cards_.slice(0)
	}

	get refCards() {
		return this.cards_
	}

	get obj() {
		let ret:tCardArray = []
		for(let card of this.cards_) {
			ret.push(card.obj)
		}
		return ret 
	}

	get length() {
		return this.cards_.length
	}

	push(card:tCard) {
		this.cards_.push(new Card(card))
		return this 
	}

	unshift(card:tCard){
		this.cards_.unshift(new Card(card));
		return this;
	}
	reset(cards:tCard[]){
		this.cards_  = [];
		cards.forEach((card:tCard)=>{
			this.cards_.push(new Card(card));
		});
		return this;
	}
	findByIndex(index,func:(card:Card)=>boolean){
		for(let a = index;a<this.cards_.length;a++){
			if(func(this.cards_[a])){
				return this.cards_[a];
			}
		}
		return null;
	}
	pushArray(cards:tCardArray | CardArray) {
		if(cards instanceof CardArray) {
			for(let i = 0 ; i < cards.length ; i ++) {
				this.push(cards.at(i))
			}
		} else {
			for(let card of cards) {
				this.push(card)
			}
		}
		return this 
	}

	setCard(idx:number,card:tCard) {
		if(idx > this.cards.length) {
			return false 
		}
		this.cards_[idx] = new Card(card)
		return true 
	}

	popBack() {
		if(this.cards_.length == 0) {
			return null
		}
		let ret = this.cards_.pop()
		return ret 
	}

	popFront() {
		if(this.cards_.length == 0) {
			return null
		}
		let ret = this.cards_.shift()
		return ret 
	}

	sort(compareFn?: (a: Card, b: Card) => number) {
		this.cards_.sort(compareFn)
	}

	index(card:Card | tCard) {
		let idx = 0
		for(let c of this.cards_) {
			if(c.equal(card)) {
				return idx
			}
			idx ++
		}
		return -1
	}

	insert(idx:number,card:Card | tCard) {
		this.cards_.splice(idx,0,new Card(card))
		return this 
	}

	at(idx:number) {
		if(idx >= this.cards_.length) {
			return null
		}
		return this.cards_[idx]
	}

	slice(start?:number,end?:number) {
		return new CardArray(this.cards_.slice(start,end))
	}

	last() {
		if(this.cards_.length == 0) {
			return null 
		}
		return this.cards_[this.cards_.length - 1]
	}

	remove(idx:number) {
		if(idx >= this.cards_.length) {
			return null
		}
		return this.cards_.splice(idx,1)[0]
	}

	removeCard(card:Card | tCard,count?:number) {
		count = count || 1
		for(let i = 0 ; i < count ; i ++) {
			let idx = this.index(card)
			if(!this.remove(idx)) {
				return false 
			}
		}
		return true 
	}

	removeArray(cards:tCardArray | CardArray) {
		if(cards instanceof CardArray) {
			let count = 0
			for(let i = 0 ; i < cards.length ; i ++) {
				let idx = this.index(cards.at(i))
				if(idx < 0) {
					continue
				}
				count ++
				this.remove(idx)
			}
			return count
		} else {
			let count = 0
			for(let card of cards) {
				let idx = this.index(card)
				if(idx < 0) {
					continue
				}
				count ++
				this.remove(idx)
			}
			return count
		}
	}

	contains(card:Card | tCard) {
		let idx = 0
		for(let c of this.cards_) {
			if(c.equal(card)) {
				return true 
			}
			idx ++
		}
		return false 
	}

	containsArray(cards:tCardArray | CardArray) {
		let arr = this.cards_.slice()
		if(cards instanceof CardArray) {
			for(let i = 0 ; i < cards.length ; i ++) {
				let card = cards.at(i)
				let idx = arr.findIndex(v=>tCard.equal(v,card))
				if(idx < 0) {
					return false 
				}
				arr.splice(idx,1)
			}
			return true 
		} else {
			for(let card of cards) {
				let idx = arr.findIndex(v=>tCard.equal(v,card))
				if(idx < 0) {
					return false 
				}
				arr.splice(idx,1)
			}
			return true 
		}
	}

	swap(from:number,to:number) {
		let temp = this.cards_[to]
		this.cards_[to] = this.cards_[from]
		this.cards_[from] = temp 
	}

	clear() {
		this.cards_.splice(0)
	}
	clone() {
		return new CardArray(this)
	}

	find(func:(card:Card)=>boolean) {
		for(let c of this.cards_) {
			if(func(c)) {
				return c 
			}
		}
		return null
	}

	findAll(func:(card:Card)=>boolean) {
		let ret:Card[] = []
		for(let c of this.cards_) {
			if(func(c)) {
				ret.push(c)
			}
		}
		return ret
	}

	findIndex(func:(card:Card)=>boolean) {
		let idx = 0
		for(let c of this.cards_) {
			if(func(c)) {
				return idx
			}
			idx ++
		}
		return idx
	}

	getCount(func:(card:Card)=>boolean) {
		let count = 0
		for(let c of this.cards_) {
			if(func(c)) {
				count++
			}
		}
		return count
	}
	
	filter(func:(card:Card)=>boolean) {
		let arr = CardArray.empty
		for(let c of this.cards_) {
			if(func(c)) {
				arr.push(c)
			}
		}
		return arr 
	}

	each(func:(Card:Card)=>any) {
		for(let c of this.cards_) {
			func(c)
		}
	}

	forEach(func:(Card:Card,idx?:number)=>any) {
		let i = 0
		for(let c of this.cards_) {
			func(c,i++)
		}
	}

	getCounts() {
		let ret = new Map<number,number>()
		for(let card of this.cards_) {
			let data = card.data
			let n = ret.get(data)
			if(n == null) {
				n = 1
			} else {
				n ++
			}
			ret.set(data,n)
		}
		return ret 
	}
	
	getValueCounts() {
		let ret = new Map<number,number>()
		for(let card of this.cards_) {
			let data = card.value
			let n = ret.get(data)
			if(n == null) {
				n = 1
			} else {
				n ++
			}
			ret.set(data,n)
		}
		return ret 
	}

	getValueCards(value: number, count?: number) {
		let ret:tCardArray = []
		let cnt = 0
		for(let card of this.cards_) {
			if(card.value == value) {
				ret.push(card.obj)
				cnt ++
				if (count && cnt >= count) {
					return ret 
				}
			}
		}
		return ret 
	}

	static get empty() {
		return new CardArray()
	}

	static obj(cards:CardArray | tCardArray) {
		let arr:tCardArray = null
		if(cards instanceof CardArray) {
			arr = []
			for(let i = 0 ; i < cards.length ; i ++) {
				arr.push(cards.at(i).obj)
			}
		} else if(cards) {
			arr = []
			for(let card of cards) {
				arr.push(Card.obj(card))
			}
		}
		return arr
	}

}

export namespace CardArray {
	export function getCharValue(cards?:CardArray) {
	   if(cards == null) {
		   return "|"
	   }
	   let str = _.map(cards.refCards,v=>v.value).join("|")
	   return str 
   }
   
	export function filterToSet(cardsArray:CardArray[]) {
		let mutex = []
		let ret:CardArray[] = []
		for(let cards of cardsArray) {
			let str = getCharValue(cards)
			if(mutex[str]) {
				continue
			}
			mutex[str] = true 
			ret.push(cards)
		}
		return ret 
	}

	export function getZuHeCards(cards:CardArray,selCount:number,containsSame?:boolean) {
		let ret:CardArray[] = []
		if(containsSame) {
			_getZuHeCards(cards,0,cards.length,selCount,0,ret)
		} else {
			_getZuHeCards(cards,0,cards.length,selCount,1,ret)
		}
		ret = filterToSet(ret)
		return ret 
	}

	function _getZuHeCards(cards:CardArray,starti:number,endi:number,selCount:number,offset:number,ret:CardArray[]) {
		let len = endi - starti 
		if(len < selCount) {
			return false 
		}
		if(selCount == 1) {
			for(let i = starti ; i < endi ; i ++) {
				ret.push(new CardArray([cards.at(i)]))
			}
			return true 
		}
		for(let i = starti ; i < endi ; i ++) {
			let first = cards.at(i)
			let tempRet:CardArray[] = []
			if(_getZuHeCards(cards,i+offset,endi,selCount-1,offset,tempRet) == false) {
				break 
			}
			for(let l of tempRet) {
				//l.splice(0,0,first)
				l.push(first)
				ret.push(l)
				ret.reverse()
			}
		}
		return ret.length > 0
	}

}

export type tCardArray = tCard[]
