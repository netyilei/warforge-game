import _ = require("underscore")
import { Card, CardArray, tCardArray } from "../pp-base-define/CardDefine"
import { GameSet } from "../pp-base-define/GameSet"
import { Poker } from "../pp-base-define/PokerDefine"
import { TexasDefine, TexasGamePhase, TexasRule } from "./TexasDefine"
import { RoomDefine } from "../pp-base-define/RoomDefine"
import { knRoomRealtime } from "../pp-game-base/knRoomRealtime"
import { kdutils } from "kdweb-core/lib/utils"
import { GSCommonMsg } from "../pp-game-base/GSCommonMsg"
import { TexasPool, TexasPoolManager } from "./TexasPool"
import Decimal from "decimal.js"
import { TexasPower } from "./TexasPower"
import { GlobalUtils } from "../src/GlobalUtils"


export class TexasRealtime extends knRoomRealtime {
	constructor(roomID:number,gameSet:GameSet,lockID?:string) {
		super(roomID,gameSet,lockID)
		this.power = new TexasPower(gameSet)
		let iSets = this.gameSet_.iSets
		this.sb = iSets[TexasRule.Group6_SBlind] || 0
		if(this.gameSet_.checkRule(TexasRule.Group0,TexasRule.Group0_ANTE)) {
			this.ante = iSets[TexasRule.Group5_ANTE] || 0
		} else {
			this.ante = 0
		}
		
		if(this.gameSet_.checkRule(TexasRule.Group0,TexasRule.Group0_DoubleBB)) {
			this.bb = this.sb * 2
			this.sb = this.bb 
		} else {
			this.bb = this.sb * 2
		}
		this.buyinTimeout = 30000

		this.betTimeout = 30000

		this.minBuyin = iSets[TexasRule.Group7_MinBuyin]
		this.maxBuyin = iSets[TexasRule.Group8_MaxBuyin]
	}
	
	sb:number
	bb:number
	ante:number

	minBuyin:number 
	maxBuyin:number

	buyinTimeout:number

	betTimeout:number

	sbChairNo:number = -1
	positions:{
		chairNo:number,
		position:TexasDefine.PositionType,
	}[]

	curPhase:TexasGamePhase

	power:TexasPower

	cards = new CardArray()
	diCards:CardArray
	diEnabled:boolean 
	cardIndex = 0
	diShows:boolean[] = []

	curMaxValue:Decimal 
	curMaxChairNo:number

	curBetTurn:GSCommonMsg.tBetTurnNT

	pool:TexasPoolManager

	singleWinner:number 

	stepRecordData:TexasDefine.tGameStepRecordData

	
	curMinPot:GlobalUtils.tSelectPot
	curMin2Pot:GlobalUtils.tSelectPot
	curMaxPot:GlobalUtils.tSelectPot

	resetPools(playingChairNos:number[],stepRecordData:TexasDefine.tGameStepRecordData) {
		this.power = new TexasPower(this.gameSet_)
		this.pool = new TexasPoolManager(playingChairNos)

		this.stepRecordData = stepRecordData

		this.curMaxChairNo = -1
		this.curMaxValue = new Decimal(0)

		this.curPhase = null 
		this.diCards = null 
		this.diEnabled = false 

		this.cachePreDeals_ = []

		this.curMinPot = null 
		this.curMin2Pot = null 
		this.curMaxPot = null 
	}

	stepPool() {
		this.curMaxChairNo = -1
		this.curMaxValue = new Decimal(0)
		this.pool.stepPhase()
	}

	getUserTotalBet(chairNo:number) {
		return this.pool.getUserTotalValue(chairNo)
	}

	initCards() {
		this.cards.clear()
		let cards = new CardArray
		if(this.gameSet_.checkRule(TexasRule.Group1,TexasRule.Group1_Long)) {
			for(let i = Poker.Value.V1 ; i <= Poker.Value.K ; i ++) {
				for(let j = Poker.Suit.Begin ; j < Poker.Suit.End ; j ++) {
					cards.push({value:i,suit:j})
				}
			}
		} else {
			for(let i = Poker.Value.V6 ; i <= Poker.Value.K ; i ++) {
				for(let j = Poker.Suit.Begin ; j < Poker.Suit.End ; j ++) {
					cards.push({value:i,suit:j})
				}
			}
			for(let j = Poker.Suit.Begin ; j < Poker.Suit.End ; j ++) {
				cards.push({value:Poker.Value.V1,suit:j})
			}
		}
		this.cards.pushArray(_.shuffle(cards.refCards))
		this.cardIndex = 0
		this.diShows = []
	}

	private cachePreDeals_:{
		chairNo:number,
		cards:CardArray,
		cardType:number,
	}[] 
	get cachePreDeals() {
		return this.cachePreDeals_
	}
	preDeal() {
		this.cachePreDeals_ = []
		let diCards = this._dealDi()
		for(let chairNo of this.pool.playingChairNos) {
			let cards = this._dealToUser()
			this.cachePreDeals.push({
				chairNo,
				cards,
				cardType:this.power.analyseWithDiCards(cards,diCards)?.cardType || 0,
			})
		}
		this.cachePreDeals_.push({
			chairNo:-1,
			cards:diCards,
			cardType:0,
		})
	}
	
	private _dealToUser() {
		if(this.cardIndex >= this.cards.length - 1) {
			return null 
		}
		let ret = this.cards.slice(this.cardIndex,this.cardIndex + 2)
		this.cardIndex += 2
		return ret 
	}

	private _dealDi() {
		let ret = this.cards.slice(this.cardIndex,this.cardIndex + 5)
		this.cardIndex += 5
		this.diCards = ret 
		this.diShows = [false,false,false,false,false]
		return ret 
	}

	dealToUser(chairNo:number) {
		let cache = this.cachePreDeals_.find(v=>v.chairNo == chairNo)
		if(cache) {
			return cache.cards
		}
		return this._dealToUser()
	}

	dealDi() {
		let cache = this.cachePreDeals_.find(v=>v.chairNo == -1)
		if(cache) {
			return cache.cards
		}
		return this._dealDi()
	}

	/**
	 * 从大到小
	 * @param cards 
	 */
	sort(cards:CardArray) {
		this.power.sort(cards)
	}

	analyse(cards:CardArray) { 
		return this.power.analyseWithDiCards(cards,this.diCards)?.cardType || 0
	}

	setupStepData() {

	}
}

export enum TexasBuyinStatus {
	None,
	Need,
	Process,
}
export enum TexasUserPlayingStatus {
	Play,
	Allin,
	Giveup,
}
export class TexasUserData {
	userID:number
	chairNo:number
	cards:CardArray
	position:TexasDefine.PositionType

	endShows:boolean[] // 两张牌

	scoreChanged:Decimal
	scoreChangeDetails:{
		value:Decimal,
		type:TexasDefine.BetType,
	}[]

	playingStatus:TexasUserPlayingStatus

	/**
	 * 
	 * @param value 用来相加
	 * @param type 
	 */
	reportScore(value:Decimal,type:TexasDefine.BetType) {
		this.scoreChangeDetails.push({
			value,type,
		})
		this.scoreChanged = this.scoreChanged.add(value)
	}

	/**
	 * 
	 * @param value 必须是正数
	 * @param type 
	 * @param betNT 
	 */
	reportBet(value:Decimal,type:TexasDefine.BetType,betNT?:GSCommonMsg.tBetNT) {
		this.reportScore(value.neg(),type)
		if(betNT) {
			betNT.bets.push({
				chairNo:this.chairNo,
				value:value.toString(),
				type:type,
			})
		}
		let betType = this.realtime.pool.onBet(this.chairNo,value,type)
		if(betType != null) {
			let info = this.realtime.stepRecordData.phases.find(v=>v.phase == this.realtime.curPhase)
			if(!info) {
				info = {
					phase:this.realtime.curPhase,
					users:[]
				}
				this.realtime.stepRecordData.phases.push(info)
			}
			let user = info.users.find(v=>v.chairNo == this.chairNo)
			if(!user) {
				user = {
					chairNo:this.chairNo,
					value:"0",
					status:this.playingStatus,
				}
				info.users.push(user)
			}
			user.value = Decimal.add(user.value,value).toString()
			user.status = type == TexasDefine.BetType.Abandon ? TexasUserPlayingStatus.Giveup : (
				type == TexasDefine.BetType.Allin ? TexasUserPlayingStatus.Allin : TexasUserPlayingStatus.Play
			)

			this.realtime.pool.onUserType(this.chairNo,type)
		}
		return betType
	}


	private buyinStatus_ = TexasBuyinStatus.None
	get buyinStatus() {
		return this.buyinStatus_
	}
	set buyinStatus(v) {
		this.buyinStatus_ = v
		switch(v) {
			case TexasBuyinStatus.Need:{
				this.buyinTime = kdutils.getMillionSecond()
			} break 
			default:{
				this.buyinTime = 0
			}
		}
	}
	buyinTime:number

	realtime:TexasRealtime
	constructor(userID:number,chairNo:number,realtime:TexasRealtime) {
		this.userID = userID
		this.chairNo = chairNo
		this.realtime = realtime
	}

	juReset() {
		this.cards = new CardArray
		this.endShows = [false,false]
		this.position = null
		this.scoreChanged = new Decimal(0)
		this.scoreChangeDetails = []
		this.playingStatus = TexasUserPlayingStatus.Play
	}

	getShowCards() {
		let ret = CardArray.empty
		if(this.cards.length == 0) {
			return ret 
		}
		for(let i = 0 ; i < 2 ; i ++) {
			if(this.endShows[i]) {
				ret.push(this.cards.at(i))
			} else {
				ret.push(new Card())
			}
		}
		return ret 
	}
}
