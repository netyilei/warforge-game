import { kdutils } from "kdweb-core/lib/utils";
import { GSRpcMethods } from "../pp-base-define/GSRpcMethods";
import { GSUserMsg } from "../pp-base-define/GSUserMsg";
import { RoomDefine } from "../pp-base-define/RoomDefine";
import { GSCommonMsg } from "../pp-game-base/GSCommonMsg";
import { knRoomRealtime } from "../pp-game-base/knRoomRealtime";
import { knYieldRoomBase } from "../pp-game-base/knYieldRoomBase";
import { TexasDefine, TexasGamePhase, TexasRule, TexasUserMsg } from "./TexasDefine";
import { TexasBuyinStatus, TexasRealtime, TexasUserData, TexasUserPlayingStatus } from "./TexasRealtime";
import { CardArray, tCard } from "../pp-base-define/CardDefine";
import Decimal from "decimal.js";
import { DBDefine } from "../pp-base-define/DBDefine";
import { TimeDate } from "../src/TimeDate";
import { GlobalUtils } from "../src/GlobalUtils";
import { UserPlayAction } from "../src/UserPlayAction";
import { kds } from "../pp-base-define/GlobalMethods";
import { ItemDefine } from "../pp-base-define/ItemDefine";
import { PromoteRelationUtils } from "../src/PromoteRelationUtils";


export class TexasRoom extends knYieldRoomBase {
	
	handleInit(params?:GSRpcMethods.tCreateRoomExtensionParams): void {
		super.handleInit(params)
		this.realtime_ = new TexasRealtime(this.roomID,this.gameSet,this.lockID)

		
		let valueIndex:number 
		let itemID:string
		switch(this.d.payMainType) {
			case RoomDefine.PayType.Item:{
				itemID = String(this.d.payIndex)
			} break 
			case RoomDefine.PayType.Club:{
				valueIndex = this.d.payIndex
			} break 
		}
		if(this.roomData.groupID || this.roomData.matchID) {
			this.server.Room_RobotSupport(this.roomID,{
				roomID:this.roomID,
				clubID:this.clubID,
				groupID:this.roomData.groupID,
				itemID,
				valueIndex,
				minValue:this.d.minBuyin,
				maxValue:this.d.maxBuyin,
			})
		}
	}

	async handleInitUserScore(user: knRoomRealtime.UserData, params: GSRpcMethods.tUserEnterReq): Promise<boolean> {
		return true 
	}

	getUserEnterWhileGameStart(): boolean {
		return true 
	}
	getMinPlayingUserCount() {
		return 2 
	}
	getMaxPlayingUserCount(): number {
		return 8
	}

	getUserData<T = TexasUserData>(chairNo) {
		return super.getUserData<T>(chairNo)
	}
	
	getRoundEndAutoCheck() {
		let ret:{
			waterTimeoutSec?:number,
			juCount?:number,
		} = {
			waterTimeoutSec:this.gameSet.iSets[TexasRule.Group4_LastSeconds],
			juCount:this.gameSet.getJuCount()
		}
		return ret
	}
	getWatchEnabled() {
		return true 
	}
	getWatchMaxCount() {
		return 100
	}
	getDefaultWatchEnter() {
		return true 
	}
	/**
	 * 局间是否可以不准备
	 * @returns 
	 */
	getGameWaitNoReadyEnabled() {
		return true 
	}

	changePhase(phase:TexasGamePhase) {
		this.log("change phase to " + TexasGamePhase[phase])
		if(this.d.curPhase == phase) {
			return 
		}
		this.d.curPhase = phase
		this.sendToAllUser(TexasUserMsg.PhaseChange,<TexasUserMsg.tPhaseChangeNT>{
			phase:this.d.curPhase
		})
		this.server.Room_CurrentGameStepRecord(this.roomID,this.stepRecordData)
	}

	private betTurnNT_:GSCommonMsg.tBetTurnNT
	get stepRecordData():TexasDefine.tGameStepRecordData {
		return this.stepRecordData_
	}
	set stepRecordData(v) {
		this.stepRecordData_ = v
	}
	async step_Playing() {
		let playingChairNos = this.getValidReadyChairNos()

		await this.updateEnabledPots()

		let minChairNo = -1
		let min2ChairNo = -1
		let maxChairNo = -1
		let potEnabled = false 

		let curMinPot:GlobalUtils.tSelectPot
		let curMin2Pot:GlobalUtils.tSelectPot
		let curMaxPot:GlobalUtils.tSelectPot
		{
			let ratePowerKeys = [
				"minValueCardPower",
				"min2ValueCardPower",
				"normalValueCardPower",
				"maxValueCardPower",
			]
			for(let pot of this.enabledPots) {
				if(!pot.active) {
					continue 
				}
				let ps = ratePowerKeys.reduce((prev,cur)=>(prev + (pot.pot.rates[cur] || 0)),0)
				if(ps > 0) {
					let rand = kdutils.intRandom(0,ps)
					for(let ki = 0 ; ki < ratePowerKeys.length; ki++) {
						let key = ratePowerKeys[ki]
						let p = pot.pot.rates[key] || 0
						ps -= p
						if(p <= 0) {
							continue 
						}
						if(rand >= ps) {
							switch(ki) {
								case 0:{
									if(!curMinPot || pot.randPercent > curMinPot.randPercent) {
										curMinPot = pot
									}
								} break 
								case 1:{
									if(!curMin2Pot || pot.randPercent > curMin2Pot.randPercent) {
										curMin2Pot = pot
									}
								} break 
								case 2:{
								} break 
								case 3:{
									if(!curMaxPot || pot.randPercent > curMaxPot.randPercent) {
										curMaxPot = pot
									}
								} break 
							}
						}
					}
				}
			}
			if(curMinPot) {
				minChairNo = this.getUserByUserID(curMinPot.userID)?.chairNo
				this.log("pot: minChairNo = " + minChairNo + " userID = " + curMinPot.userID + " pot =",curMinPot)
				potEnabled = true 
			}
			if(curMin2Pot) {
				if(playingChairNos.length == 2 && !curMinPot) {
					minChairNo = this.getUserByUserID(curMin2Pot.userID)?.chairNo
					curMinPot = curMin2Pot
					this.log("pot: min2ChairNo to minChairNo = " + minChairNo + " userID = " + curMin2Pot.userID + " pot =",curMin2Pot)
					curMin2Pot = null 
				} else {
					min2ChairNo = this.getUserByUserID(curMin2Pot.userID)?.chairNo
					this.log("pot: min2ChairNo = " + min2ChairNo + " userID = " + curMin2Pot.userID + " pot =",curMin2Pot)
				}
				potEnabled = true 
			}
			if(curMaxPot) {
				maxChairNo = this.getUserByUserID(curMaxPot.userID)?.chairNo
				this.log("pot: maxChairNo = " + maxChairNo + " userID = " + curMaxPot.userID + " pot =",curMaxPot)
				potEnabled = true 
			}
		}


		this.betTurnNT_ = null 

		this.d.initCards()
		this.stepRecordData = {
			users:[],
			phases:[],
			cards:[],
			results:[],
		}
		
		this.d.positions = []
		this.d.sbChairNo = this.stepChairNo(this.d.sbChairNo,playingChairNos)
		this.log("playingChairNos",playingChairNos,"sitChairNos",this.getSitChairNos(),"sb = " + this.d.sbChairNo)
		this.d.resetPools(playingChairNos,this.stepRecordData)
		this.d.curMinPot = curMinPot
		this.d.curMin2Pot = curMin2Pot
		this.d.curMaxPot = curMaxPot

		if(potEnabled) {
			this.d.preDeal()
			let caches = this.d.cachePreDeals
			caches.sort((a,b)=>(b.cardType - a.cardType))
			if(maxChairNo >= 0) {
				let selfIdx = caches.findIndex(v=>v.chairNo == maxChairNo)
				if(selfIdx != 0) {
					let tempCards = caches[selfIdx].cards
					let tempCardType = caches[selfIdx].cardType

					caches[selfIdx].cards = caches[0].cards
					caches[selfIdx].cardType = caches[0].cardType

					caches[0].cards = tempCards
					caches[0].cardType = tempCardType
				}
				this.log("pot: maxChairNo swap to first",maxChairNo)
			}
			if(minChairNo >= 0) {
				let selfIdx = caches.findIndex(v=>v.chairNo == minChairNo)
				if(selfIdx != caches.length - 1) {
					let tempCards = caches[selfIdx].cards
					let tempCardType = caches[selfIdx].cardType
					caches[selfIdx].cards = caches[caches.length - 1].cards
					caches[selfIdx].cardType = caches[caches.length - 1].cardType
					caches[caches.length - 1].cards = tempCards
					caches[caches.length - 1].cardType = tempCardType
				}
				this.log("pot: minChairNo swap to last",minChairNo)
			}
			if(min2ChairNo >= 0 && caches.length > 2) {
				let selfIdx = caches.findIndex(v=>v.chairNo == min2ChairNo)
				if(selfIdx != caches.length - 2) {
					let tempCards = caches[selfIdx].cards
					let tempCardType = caches[selfIdx].cardType
					caches[selfIdx].cards = caches[caches.length - 2].cards
					caches[selfIdx].cardType = caches[caches.length - 2].cardType
					caches[caches.length - 2].cards = tempCards
					caches[caches.length - 2].cardType = tempCardType
				}
				this.log("pot: min2ChairNo swap to last-1",min2ChairNo)
			}
		}
		// 确定位置 小盲 大盲 D 枪
		switch(playingChairNos.length) {
			case 2:{
				let firstChairNo = this.d.sbChairNo
				let other = playingChairNos.find(v=>v != firstChairNo)
				this.d.positions.push({
					chairNo:firstChairNo,
					position:TexasDefine.PositionType.SB,
				})
				this.d.positions.push({
					chairNo:firstChairNo,
					position:TexasDefine.PositionType.Gun,
				})
				this.d.positions.push({
					chairNo:other,
					position:TexasDefine.PositionType.BB,
				})
				this.d.positions.push({
					chairNo:other,
					position:TexasDefine.PositionType.D,
				})
			} break;
			//
			case 3:{
				let sbChairNo = this.d.sbChairNo
				let bbChairNo = this.stepChairNo(this.d.sbChairNo,playingChairNos)
				let gChairNo = this.stepChairNo(bbChairNo,playingChairNos)
				this.d.positions.push({
					chairNo:sbChairNo,
					position:TexasDefine.PositionType.SB,
				})
				this.d.positions.push({
					chairNo:bbChairNo,
					position:TexasDefine.PositionType.BB,
				})
				this.d.positions.push({
					chairNo:gChairNo,
					position:TexasDefine.PositionType.Gun,
				})
				this.d.positions.push({
					chairNo:gChairNo,
					position:TexasDefine.PositionType.D,
				})
			} break 
			default:{
				let sbChairNo = this.d.sbChairNo
				let bbChairNo = this.stepChairNo(this.d.sbChairNo,playingChairNos)
				let gChairNo = this.stepChairNo(bbChairNo,playingChairNos)
				let dChairNo = this.stepReverseChairNo(sbChairNo,playingChairNos)
				this.d.positions.push({
					chairNo:sbChairNo,
					position:TexasDefine.PositionType.SB,
				})
				this.d.positions.push({
					chairNo:bbChairNo,
					position:TexasDefine.PositionType.BB,
				})
				this.d.positions.push({
					chairNo:gChairNo,
					position:TexasDefine.PositionType.Gun,
				})
				this.d.positions.push({
					chairNo:dChairNo,
					position:TexasDefine.PositionType.D,
				})
			} break 
		}
		// 记录行为
		for(let chairNo of playingChairNos) {
			let user = this.getUser(chairNo)
			await UserPlayAction.record(this.gameData.gameID,user.userID,TexasDefine.PlayAction_JuCount,1)

			let positions = this.d.positions.filter(v=>v.chairNo == chairNo)
			let stepUser = {
				userID:user.userID,
				chairNo,
				positions:positions.map(v=>v.position)
			}
			this.d.stepRecordData.users.push(stepUser)
		}

		this.sendGameStart(playingChairNos,<TexasUserMsg.tGameStartData>{
			users:this.d.positions
		})

		for(let chairNo of playingChairNos) {
			let user = this.getUser(chairNo)
			let data = <TexasUserData>user.extData
			data.juReset()
			let position = this.d.positions.find(v=>v.chairNo == chairNo)
			if(position) {
				data.position = position.position
			}
		}
		await this.yieldTimeout(1)
		this.d.stepPool()
		// 底注  
		{
			this.changePhase(TexasGamePhase.Ante)
			let betNT:GSCommonMsg.tBetNT = {
				bets:[]
			}
			for(let chairNo of playingChairNos) {
				let user = this.getUser(chairNo)
				let data = <TexasUserData>user.extData
				if(this.d.ante > 0) {
					this.reportScore(chairNo,new Decimal(-this.d.ante))
					data.reportBet(new Decimal(this.d.ante),TexasDefine.BetType.Ante,betNT)
				}
			}
			if(betNT.bets.length > 0) {
				this.sendToAllUser(GSCommonMsg.Bet,betNT)
				await this.yieldTimeout(1)
				this.d.stepPool()
			}
		}
		// 补盲
		let ju0CountChairNos:number[] = []
		let bumangInfos:{
			chairNo:number,
			value:Decimal
		}[] = []
		if(this.matchID) {

		} else {
			for(let chairNo of playingChairNos) {
				let user = this.getUser(chairNo)
				if(user.juCount == 1) {
					ju0CountChairNos.push(chairNo)
				}
			}
		}
		{
			this.changePhase(TexasGamePhase.BB)
			let betNT:GSCommonMsg.tBetNT = {
				bets:[]
			}
			
			// 补盲
			if(playingChairNos.length - ju0CountChairNos.length >= 2) {
				for(let chairNo of ju0CountChairNos) {
					let user = this.getUser(chairNo)
					let data = <TexasUserData>user.extData
					this.reportScore(chairNo,new Decimal(-this.d.bb))
					data.reportBet(new Decimal(this.d.bb),TexasDefine.BetType.FB,betNT)
					bumangInfos.push({
						chairNo,
						value:new Decimal(this.d.bb)
					})
				}
			}
			if(betNT.bets.length > 0) {
				this.sendToAllUser(GSCommonMsg.Bet,betNT)
				await this.yieldTimeout(1)
				// this.d.stepPool()
			}
		}

		let straddleEnabled = this.gameSet.checkRule(TexasRule.Group0,TexasRule.Group0_Straddle) && playingChairNos.length >= 3
		if(straddleEnabled && playingChairNos.length < 3) {
			straddleEnabled = false 
		}
		// 大小盲
		{
			this.changePhase(TexasGamePhase.BB)

			let gunChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.Gun).chairNo
			let betNT:GSCommonMsg.tBetNT = {
				bets:[]
			}
			let chairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.SB).chairNo
			let data = this.getUserData(chairNo)
			{
				let buInfo = bumangInfos.find(v=>v.chairNo == chairNo)
				let last = Decimal(this.d.sb).sub(buInfo ? buInfo.value : "0")
				if(last.greaterThan(0)) {
					this.reportScore(chairNo,last.neg())
					data.reportBet(last,TexasDefine.BetType.SB,betNT)
				}
			}
			// if(!ju0CountChairNos.includes(chairNo)) {
			// 	// 补盲的小盲 不再补	
			// 	this.reportScore(chairNo,new Decimal(-this.d.sb))
			// 	data.reportBet(new Decimal(this.d.sb),TexasDefine.BetType.SB,betNT)
			// }
			

			chairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.BB).chairNo
			data = this.getUserData(chairNo)
			{
				let buInfo = bumangInfos.find(v=>v.chairNo == chairNo)
				let last = Decimal(this.d.bb).sub(buInfo ? buInfo.value : "0")
				if(last.greaterThan(0)) {
					this.reportScore(chairNo,last.neg())
					data.reportBet(last,TexasDefine.BetType.BB,betNT)
				}
			}
			// if(!ju0CountChairNos.includes(chairNo)){
			// 	// 补盲的大盲 不再补	
			// 	this.reportScore(chairNo,new Decimal(-this.d.bb))
			// 	data.reportBet(new Decimal(this.d.bb),TexasDefine.BetType.BB,betNT)
			// }
			

			// 抓位，枪口下大盲
			if(straddleEnabled) {
				chairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.Gun).chairNo
				data = this.getUserData(chairNo)
				
				{
					let buInfo = bumangInfos.find(v=>v.chairNo == chairNo)
					let last = Decimal(this.d.bb).sub(buInfo ? buInfo.value : "0")
					if(last.greaterThan(0)) {
						this.reportScore(chairNo,last.neg())
						data.reportBet(last,TexasDefine.BetType.Straddle,betNT)
					}
				}
			}

			this.sendToAllUser(GSCommonMsg.Bet,betNT)
		}
		await this.yieldTimeout(1)


		this.d.singleWinner = -1
		let phase = -1 // 0 翻前 1 翻后 2 转牌 3 河牌
		{
			let lastChairNos = playingChairNos.slice()
			let betEnabledChairNos = lastChairNos.slice()
			let allinStatus = false 
			while(phase <= 2) {
				phase++
				if(phase > 0) {
					await this.yieldTimeout(0.5)
				}
				this.changePhase(TexasGamePhase.Pre + phase)

				if(lastChairNos.length <= 1) {
					break 
				}
				this.d.curMaxChairNo = -1
				this.d.curMaxValue = new Decimal(0)
				let phaseTimes = 0 // 进行的第几圈
				let seqs:number[] = []
				if(!allinStatus) {
					let allinCount = 0
					for(let chairNo of lastChairNos) {
						if(this.getUserData(chairNo).playingStatus == TexasUserPlayingStatus.Allin) {
							allinCount ++
						}
					}
					if(allinCount + 1 >= lastChairNos.length) {
						allinStatus = true 
						this.log("enter allin status")
						let dealNT:GSCommonMsg.tDealNT = {
							deals:[]
						}
						for(let chairNo of lastChairNos) {
							let data = this.getUserData(chairNo)
							dealNT.deals.push({
								chairNo,
								cards:data.cards.obj,
								type:TexasDefine.DealType.Allin
							})
						}
						this.sendToAllUser(GSCommonMsg.Deal,dealNT)
						await this.yieldTimeout(0.5)
					}
				}
				if(!allinStatus && betEnabledChairNos.length <= 1) {
					this.log("!allinStatus && betEnabledChairNos.length <= 1")
					break 
				}
				switch(phase) {
					case 0:{
						this.d.dealDi()
						
						this.d.curMaxChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.BB).chairNo
						this.d.curMaxValue = new Decimal(this.d.bb)
						
						if(straddleEnabled) {
							let curChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.Gun).chairNo
							seqs = this.getSeqs(betEnabledChairNos,curChairNo,true)
							// 枪口最后一个说话
							seqs.splice(0,1)
							seqs.push(curChairNo)
						} else {
							let curChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.Gun).chairNo
							seqs = this.getSeqs(betEnabledChairNos,curChairNo,true)
						}

						{
							let curChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.SB).chairNo
							let dealSeqs = this.getSeqs(betEnabledChairNos,curChairNo,true)

							let watchDealNT:GSCommonMsg.tDealNT = {
								deals:[]
							}
							let recordDealNT:GSCommonMsg.tDealNT = {
								deals:[]
							}
							let robots:number[] = []
							for(let chairNo of dealSeqs) {
								let user = this.getUser(chairNo)
								let data:TexasUserData = user.extData
								if(user.robot) {
									robots.push(chairNo)
								}
								let cards = this.d.dealToUser(chairNo)
								data.cards.pushArray(cards)

								recordDealNT.deals.push({
									chairNo,
									type:TexasDefine.DealType.Di,
									cards:cards.obj,
								})
								watchDealNT.deals.push({
									chairNo,
									type:TexasDefine.DealType.Di,
									cards:[tCard.create(0,0),tCard.create(0,0)]
								})

								this.d.stepRecordData.cards.push({
									chairNo,
									cards:[tCard.create(0,0),tCard.create(0,0)]
								})
							}
							let robotNT = robots.length > 0 ? kdutils.clone(recordDealNT) : null 
							if(robotNT) {
								robotNT.deals.push({
									chairNo:-1,
									type:TexasDefine.DealType.Di,
									cards:this.d.diCards.obj,
								})
							}
							for(let chairNo of dealSeqs) {
								if(robots.includes(chairNo)) {
									this.sendToUser(chairNo,GSCommonMsg.Deal,robotNT)
									continue 
								}
								let dealNT = kdutils.clone(recordDealNT)
								for(let deal of dealNT.deals) {
									if(deal.chairNo != chairNo) {
										for(let i = 0 ; i < deal.cards.length ; i ++) {
											deal.cards[i] = tCard.create(0,0)
										}
									}
								}
								this.sendToUser(chairNo,GSCommonMsg.Deal,dealNT)
							}
							this.sendToAllNotPlayUser(GSCommonMsg.Deal,watchDealNT)
							this.recordFupanMsg(GSCommonMsg.Deal,watchDealNT)
							// this.recordFupanMsg(GSCommonMsg.Deal,recordDealNT)
						}
						
					} break 
					case 1:{
						this.d.stepPool()
						let stepDiCards = this.d.stepRecordData.cards.find(v=>v.chairNo == -1)
						if(!stepDiCards) {
							stepDiCards = {
								chairNo:-1,
								cards:[],
							}
							this.d.stepRecordData.cards.push(stepDiCards)
						}

						let curChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.SB).chairNo
						seqs = this.getSeqs(betEnabledChairNos,curChairNo,true)
						this.log("seqs = " + seqs,"this.d.positions = ",this.d.positions,"betEnabledChairNos = ",betEnabledChairNos,"curChairNo = ",curChairNo)
						this.d.diEnabled = true 
						let dealNT:GSCommonMsg.tDealNT = {
							deals:[{
								chairNo:-1,
								type:TexasDefine.DealType.Flop,
								cards:[],
							}]
						}
						for(let i = 0 ; i < 3 ; i ++) {
							this.d.diShows[i] = true 
							let card = this.d.diCards.at(i).obj
							dealNT.deals[0].cards.push(card)

							stepDiCards.cards.push(card)
						}

						this.sendToAllUser(GSCommonMsg.Deal,dealNT)

						// 记录行为
						for(let chairNo of seqs) {
							let user = this.getUser(chairNo)
							await UserPlayAction.record(this.gameData.gameID,user.userID,TexasDefine.PlayAction_PreEnter,1)
						}
						await this.yieldTimeout(1)
					} break 
					case 2:{
						this.d.stepPool()
						let stepDiCards = this.d.stepRecordData.cards.find(v=>v.chairNo == -1)

						let curChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.SB).chairNo
						seqs = this.getSeqs(betEnabledChairNos,curChairNo,true)
						
						let dealNT:GSCommonMsg.tDealNT = {
							deals:[{
								chairNo:-1,
								type:TexasDefine.DealType.Turn,
								cards:[],
							}]
						}
						this.d.diShows[3] = true 
						let card = this.d.diCards.at(3).obj
						dealNT.deals[0].cards.push(card)
						stepDiCards.cards.push(card)

						this.sendToAllUser(GSCommonMsg.Deal,dealNT)
						await this.yieldTimeout(1)
					} break 
					case 3:{
						this.d.stepPool()
						let stepDiCards = this.d.stepRecordData.cards.find(v=>v.chairNo == -1)

						let curChairNo = this.d.positions.find(v=>v.position == TexasDefine.PositionType.SB).chairNo
						seqs = this.getSeqs(betEnabledChairNos,curChairNo,true)
						
						let dealNT:GSCommonMsg.tDealNT = {
							deals:[{
								chairNo:-1,
								type:TexasDefine.DealType.River,
								cards:[],
							}]
						}
						this.d.diShows[4] = true 
						let card = this.d.diCards.at(4).obj
						dealNT.deals[0].cards.push(card)
						stepDiCards.cards.push(card)

						this.sendToAllUser(GSCommonMsg.Deal,dealNT)
						await this.yieldTimeout(1)
					} break
				}

				if(allinStatus) {
					this.log("allin status skip phase")
					continue 
				}

				let idx = 0
				let startChairNo = seqs[idx]
				let caches = seqs.map(v=>{
					return {
						chairNo:v,
						value:this.d.pool.getUserCurPhaseTotalValue(v),
						giveup:false,
						allin:false,
					}
				})
				this.log("caches",JSON.stringify(caches,null,4))
				this.log("pool",JSON.stringify(this.d.pool.toSync(),null,4))

				// 跳过抓位
				// if(phase == 0 && straddleEnabled) {
				// 	idx ++
				// }
				while(true) {
					if(lastChairNos.length == 1) {
						break 
					}
					let chairNo = seqs[idx]
					let user = this.getUser(chairNo)
					let data = this.getUserData(chairNo)
					let cache = caches.find(v=>v.chairNo == chairNo)
					let curTotal = cache.value
					let betTurn:GSCommonMsg.tBetTurnNT = {
						chairNo,
						prevChairNo:-1,
						prevValue:curTotal.toString(),
						maxValue:this.d.curMaxValue.toString(),
						timeoutSec:this.d.betTimeout / 1000
					}
					this.sendToAllUser(GSCommonMsg.BetTurn,betTurn)
					this.betTurnNT_ = betTurn
					let waitNT:GSCommonMsg.tWaitNT = {
						users:[{
							chairNo:chairNo,
							timeoutSec:betTurn.timeoutSec,
						}]
					}
					this.sendToAllUser(GSCommonMsg.Wait,waitNT)
					this.d.curBetTurn = betTurn
					let startTime:number = kdutils.getMillionSecond()
					let timeout = betTurn.timeoutSec * 1000
					//timeout = -1
					let giveup = false 
					let betValue = new Decimal(0)
					let allin = false 
					while(true) {
						if(timeout > 0 && kdutils.getMillionSecond() - startTime >= timeout) {
							// 弃牌
							giveup = true 
							break 
						}
						let msg = await this.yieldWaitMsg(chairNo,GSCommonMsg.Bet,0.1)
						if(!msg) {
							continue 
						}
						let betReq:GSCommonMsg.tBetReq = msg.jsonObj
						let betReqValue = GlobalUtils.newDecimal(betReq.value)
						if(betReqValue) {
							betReqValue = GlobalUtils.roundDown(betReqValue)
						} else {
							betReq.value = null 
						}
						let valid = false 
						let error = false 
						do {
							if(!betReq.value || betReq.type == TexasDefine.BetType.Abandon) {
								this.log("user give up chairNo = " + chairNo)
								break 
							}
							if(betReqValue.lessThanOrEqualTo(0) && betReq.type != TexasDefine.BetType.Check) {
								this.log("user give up 2 chairNo = " + chairNo)
								break 
							}
							if(betEnabledChairNos.length == 1 && betReq.type == TexasDefine.BetType.Raise) {
								betReqValue = Decimal.sub(this.d.curMaxValue,curTotal)
								betReq.type = betReqValue.greaterThan(0) ? TexasDefine.BetType.Call : TexasDefine.BetType.Check
							} 
							if(betReqValue.greaterThan(user.score)) {
								this.log("last score not enough chairNo = " + chairNo,betReq)
								error = true 
								break 
							}
							// if(user.score.sub(betReqValue).lessThan(0)) {
							// 	error = true 
							// 	this.log("invalid last score chairNo = " + chairNo,betReq)
							// 	break 
							// }
							if(betReqValue.eq(user.score) || betReq.type == TexasDefine.BetType.Allin) {
								allin = true 
								betReqValue = new Decimal(user.score)
								cache.allin = true 
							} else {
								if(betReqValue.add(curTotal).lessThan(this.d.curMaxValue)) {
									this.log("invalid call score chairNo = " + chairNo,betReq)
									error = true 
									break 
								}
							}
							valid = true 
						} while (false);
						if(!valid) {
							// 弃牌
							if(error) {
								this.sendErrorToUser(chairNo,99,"下注错误",true)
							}
							giveup = true 
							break
						} else {
							betValue = betReqValue
						}
						break 
					} // wait user bet 
					
					let betNT:GSCommonMsg.tBetNT = {
						bets:[]
					}
					if(giveup) {
						let lastIdx = lastChairNos.indexOf(chairNo)
						lastChairNos.splice(lastIdx,1)
						let enabledIdx = betEnabledChairNos.indexOf(chairNo)
						betEnabledChairNos.splice(enabledIdx,1)

						data.playingStatus = TexasUserPlayingStatus.Giveup

						cache.giveup = true 
						this.d.pool.onBet(chairNo,new Decimal(0),TexasDefine.BetType.Abandon)
						data.reportBet(new Decimal(0),TexasDefine.BetType.Abandon,betNT)
					} else {
						cache.value = cache.value.add(betValue)

						let betType:TexasDefine.BetType
						if(allin) {
							betType = data.reportBet(betValue,TexasDefine.BetType.Allin,betNT)
							if(betValue.add(curTotal).greaterThan(this.d.curMaxValue)) {
								this.d.curMaxChairNo = chairNo
								this.d.curMaxValue = betValue.add(curTotal)
							}
							let enabledIdx = betEnabledChairNos.indexOf(chairNo)
							betEnabledChairNos.splice(enabledIdx,1)
							data.playingStatus = TexasUserPlayingStatus.Allin
							cache.allin = true 
						} else {
							if(this.d.curMaxChairNo >= 0) {
								if(betValue.add(curTotal).greaterThan(this.d.curMaxValue)) {
									this.d.curMaxChairNo = chairNo
									this.d.curMaxValue = betValue.add(curTotal)
									betType = data.reportBet(betValue,TexasDefine.BetType.Raise,betNT)
								} else {
									betType = data.reportBet(betValue,betValue.eq(0) ? TexasDefine.BetType.Check : TexasDefine.BetType.Call,betNT)
								}
							} else {
								betType = data.reportBet(betValue,betValue.eq(0) ? TexasDefine.BetType.Check : TexasDefine.BetType.Bet,betNT)
								this.d.curMaxChairNo = chairNo
								this.d.curMaxValue = betValue
							}
						}
						if(betType == null) {
							this.logError("bet error chairNo = " + chairNo + " bet = " + betValue + " pool = \n" + JSON.stringify(this.d.pool.toSync(),null,4))
							this.logError("onBet call params ",{
								chairNo,betValue:betValue.toString(),type:TexasDefine.BetType[betNT.bets[0].type],
							})
							this.setupRoundEnd(RoomDefine.RemoveType.Error)
							return 
						}
						this.reportScore(chairNo,-betValue)
					}
					this.sendToAllUser(GSCommonMsg.Bet,betNT)
					// 检查所有人都要跟平
					// 找下一个bet的人
					let nextIdx = -1
					for(let i = 0 ; i < seqs.length - 1 ; i ++) {
						let tempIdx = (idx + i + 1) % seqs.length
						let chairNo = seqs[tempIdx]
						this.log("check next tempIdx = " + tempIdx + " chairNo = " + chairNo)
						if(chairNo == startChairNo) {
							phaseTimes ++
						}
						let data = this.getUserData(chairNo)
						if(data.playingStatus == TexasUserPlayingStatus.Giveup) {
							continue 
						}
						if(data.playingStatus == TexasUserPlayingStatus.Allin) {
							continue 
						}
						// 第一圈一定会走完
						if(phaseTimes <= 0) {
							nextIdx = tempIdx
							this.log("next confirm")
							break 
						}
						// // 翻前大盲一定要说话
						// if(phase == 0 && phaseTimes == 0 && data.position == TexasDefine.PositionType.BB) {
						// 	nextIdx = tempIdx
						// 	break 
						// }
						// // 翻前抓位一定要说话
						// if(straddleEnabled) {
						// 	if(phase == 0 && phaseTimes == 1 && data.position == TexasDefine.PositionType.Gun) {
						// 		nextIdx = tempIdx
						// 		break
						// 	}
						// }
						let cache = caches.find(v=>v.chairNo == chairNo)
						if(cache.value.lessThan(this.d.curMaxValue)) {
							nextIdx = tempIdx
							this.log("next confirm value = " + cache.value + " max = " + this.d.curMaxValue)
							break 
						}
					}
					if(nextIdx == -1) {
						this.log("next idx == -1 go next phase")
						this.log("caches",JSON.stringify(caches,null,4))
						this.log("pool",JSON.stringify(this.d.pool.toSync(),null,4))
						this.log("",{
							curMaxChairNo:this.d.curMaxChairNo,
							curMaxValue:this.d.curMaxValue,
						})
						// let lastPool = this.d.pool.stacks[this.d.pool.stacks.length - 1]
						break 
					}
					idx = nextIdx
				} // for seq
			} // while true phase
		} // blank 
		this.setRoomStatus(knRoomRealtime.Status.Result)
	}

	async step_Result() {
		this.betTurnNT_ = null 
		// 开牌比牌
		// 一个池一个池处理
		await this.yieldTimeout(0.5)
		let playingChairNos = this.getPlayingChairNos()
		let scores = new Map<number,Decimal>()
		let onlySelfWinScores = new Map<number,Decimal>()
		let selfTotalBet = new Map<number,Decimal>()
		let lastCount = 0
		let allin = false 
		let totalValue = new Decimal(0)
		// 最后收一次底池
		this.d.stepPool()
		
		let lastChairNos:number[] = []
		for(let chairNo of playingChairNos) {
			let data = this.getUserData(chairNo)
			if(data.playingStatus != TexasUserPlayingStatus.Giveup) {
				lastChairNos.push(chairNo)
			}
			
			let total = this.d.getUserTotalBet(chairNo)
			this.log("chairNo = " + chairNo + " total = " + total)
			scores.set(chairNo,new Decimal(0))
			onlySelfWinScores.set(chairNo,new Decimal(0))
			selfTotalBet.set(chairNo,new Decimal(total))
			totalValue = totalValue.add(total)

			this.d.stepRecordData.results.push({
				chairNo,
				scoreChanged:total.neg().toString()
			})
		}
		this.log("di cards = ",this.d.diCards ? this.d.diCards.obj : [])
		if(lastChairNos.length == 1) {
			let winner = lastChairNos[0]
			scores.set(winner,scores.get(winner).add(totalValue))
			this.log("last chairNo = " + winner + " is winner")
		} else {
			this.changePhase(TexasGamePhase.Show)
			let dealNT:GSCommonMsg.tDealNT = {
				deals:[]
			}
			for(let chairNo of playingChairNos) {
				let data = this.getUserData(chairNo)
				if(data.playingStatus == TexasUserPlayingStatus.Play || data.playingStatus == TexasUserPlayingStatus.Allin) {
					dealNT.deals.push({
						chairNo:chairNo,
						cards:data.cards.obj,
						type:TexasDefine.DealType.ResultShow
					})
					data.endShows[0] = data.endShows[1] = true 
					this.log("user cards chairNo = " + chairNo + " cards = ",data.cards.obj)
				} else if(data.endShows[0] || data.endShows[1]) {
					dealNT.deals.push({
						chairNo:chairNo,
						cards:[
							data.endShows[0] ? data.cards.at(0) : tCard.create(0,0),
							data.endShows[1] ? data.cards.at(1) : tCard.create(0,0),
						],
						type:TexasDefine.DealType.UserShow
					})
				}

				let deal = dealNT.deals.find(v=>v.chairNo == chairNo)
				if(deal){
					let stepCards = this.d.stepRecordData.cards.find(v=>v.chairNo == chairNo) 
					if(!stepCards) {
						stepCards = {
							chairNo,
							cards:[]
						}
						this.d.stepRecordData.cards.push(stepCards)
					}
					stepCards.cards[0] = deal.cards[0]
					stepCards.cards[1] = deal.cards[1]
				}
			}
			this.sendToAllUser(GSCommonMsg.Deal,dealNT)

			let cardTypes:{
				chairNo:number,
				type:number,
				cards:CardArray
			}[] = []
			for(let chairNo of playingChairNos) {
				let data = this.getUserData(chairNo)
				if(data.playingStatus == TexasUserPlayingStatus.Giveup) {
					cardTypes.push({
						chairNo,
						type:0,
						cards:data.cards,
					})
					this.log("chairNo = " + chairNo + " giveup cardType = 0")
				} else {
					if(data.playingStatus == TexasUserPlayingStatus.Allin) {
						allin = true 
					}
					let cardType = this.d.analyse(data.cards)
					cardTypes.push({
						chairNo,
						type:cardType,
						cards:data.cards,
					})
					lastCount ++

					let mainType = TexasDefine.getCardType(cardType)
					let power = TexasDefine.getCardPower(cardType)
					let typePower = TexasDefine.getCardTypePower(cardType)
					this.log("chairNo = " + chairNo + " allin = " + allin + " cardType = " + new Decimal(cardType).toHex(),{mainType,power:new Decimal(power).toHex(),typePower})
				}
			}

			let poolUsers = this.d.pool.totalPool.users.map(v=>{
				return {
					chairNo:v.chairNo,
					value:new Decimal(v.value),
					cardType:cardTypes.find(k=>k.chairNo == v.chairNo).type
				}
			})
			let pools:{
				users:{
					chairNo:number,
					value:Decimal,
					cardType:number,
				}[]
			}[] = []
			// 将总注从小到大排列
			poolUsers.sort((a,b)=>a.value.sub(b.value).toNumber())

			// 建立边池
			let curValue:Decimal
			let stepValue = new Decimal(0)
			for(let i = 0 ; i < poolUsers.length ; i ++) {
				let user = poolUsers[i]
				if(user.value.lessThanOrEqualTo(0)) {
					continue 
				}
				if(pools.length == 0) {
					pools.push({users:[user]})
					continue 
				}
				// 雨露均沾
				for(let pool of pools) {
					let first = pool.users[0]
					pool.users.push({
						chairNo:user.chairNo,
						value:first.value,
						cardType:user.cardType,
					})
					user.value = user.value.sub(first.value)
				}
				if(user.value.greaterThan(0)) {
					pools.push({users:[user]})
				}
			}
			// 依次结算
			let pIdx = 0
			for(let pool of pools) {
				pool.users.sort((a,b)=>b.cardType - a.cardType)
				let winnerType = pool.users[0].cardType
				let winners = pool.users.filter(v=>v.cardType == winnerType).map(v=>v.chairNo)
				let totalValue = pool.users.reduce((n,v)=>n.add(v.value),new Decimal(0))
				this.log("start pool idx = " + pIdx,JSON.stringify(pool,null,4))
				let winnerValue = GlobalUtils.roundDown(totalValue.div(winners.length))
				if(!winnerValue.mul(winners.length).eq(totalValue)) {
					let earnValue = totalValue.sub(winnerValue.mul(winners.length))
					this.log("platform earn value = " + earnValue)
					this.server.dbRoom.insert(DBDefine.tableExtValueEarn,<RoomDefine.ExtValueEarn>{
						roomID:this.roomID,
						roomData:this.roomData,
				
						value:earnValue.toString(),
						itemID:this.d.payMainType == RoomDefine.PayType.Item ? String(this.d.payIndex) : null,
						valueIndex:this.d.payMainType == RoomDefine.PayType.Club ? this.d.payIndex : null,
						data:{
							winners,
							winnerValue:winnerValue.toString(),
							totalValue:totalValue.toString()
						},
				
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					})
				}
				for(let chairNo of winners) {
					scores.set(chairNo,scores.get(chairNo).add(winnerValue))
					this.log("pool idx = " + pIdx + " winner = " + chairNo + " score = " + winnerValue)
				}
				if(pool.users.length == 1) {
					let chairNo = winners[0]
					onlySelfWinScores.set(chairNo,onlySelfWinScores.get(chairNo).add(winnerValue))
				}
				pIdx++
			}
		}
		let resultNT:GSCommonMsg.tGameResultNT = {
			users:[]
		}

		let itemID = this.d.payMainType == RoomDefine.PayType.Item ? String(this.d.payIndex) : null
		scores.forEach((value,chairNo)=>{
			let user = this.getUser(chairNo)
			if(value.greaterThan(0)) {
				let realWinValue = value.sub(selfTotalBet.get(chairNo))
				this.log("result: real win chairNo = " + chairNo + " value = " + realWinValue)
				if(realWinValue.greaterThan(0)) {
					let water = this.handleCalcWater(realWinValue)
					if(water && water.greaterThan(0)) {
						this.reportScore(chairNo,value)
						this.reportFee(chairNo,water)
						if(itemID) {
							PromoteRelationUtils.addBalance(user.userID,itemID,{
								exceptionValue:realWinValue.toString(),
								water:water.toString(),
								win:realWinValue.toString(),
							},"roomID:" + this.roomID)
						}
					} else {
						this.reportScore(chairNo,value)
						this.reportFee(chairNo,0)
						if(itemID) {
							PromoteRelationUtils.addBalance(user.userID,itemID,{
								exceptionValue:value.toString(),
								win:realWinValue.toString(),
								water:"0",
							},"roomID:" + this.roomID)
						}
					}

					if(this.d.curMaxPot?.userID == user.userID) {
						GlobalUtils.addPotValue(this.d.curMaxPot.pot.potID,realWinValue)
					}
				} else {
					this.reportScore(chairNo,value)
				}
				// let rate = this.gameSet.getWinnerRate()
				// if(rate > 0 && rate < 100) {
				// 	let realWinValue = value.sub(selfTotalBet.get(chairNo))
				// 	this.log("result: real win chairNo = " + chairNo + " value = " + realWinValue)
				// 	if(realWinValue.greaterThan(0)) {
				// 		let fee = GlobalUtils.roundUp(realWinValue.mul(rate).div(100))
				// 		// let realValue = value.sub(fee)
				// 		this.reportScore(chairNo,value)
				// 		this.reportFee(chairNo,fee)
				// 	} else {
				// 		let fee = 0
				// 		// let realValue = value.sub(fee)
				// 		this.reportScore(chairNo,value)
				// 		this.reportFee(chairNo,fee)
				// 	}
				// } else {
				// 	this.reportScore(chairNo,value)
				// }
				UserPlayAction.record(this.gameData.gameID,user.userID,TexasDefine.PlayAction_WinCount,1)
				
				let stepResult = this.d.stepRecordData.results.find(v=>v.chairNo == chairNo)
				stepResult.scoreChanged = Decimal.add(stepResult.scoreChanged,value).toString()
			} else {
				// this.reportScore(chairNo,value)
				value = selfTotalBet.get(chairNo).neg()
				if(value.lessThan(0)) {
					if(this.d.curMinPot?.userID == user.userID) {
						GlobalUtils.addPotValue(this.d.curMinPot.pot.potID,value)
					} else if(this.d.curMin2Pot?.userID == user.userID) {
						GlobalUtils.addPotValue(this.d.curMin2Pot.pot.potID,value)
					}
					if(itemID) {
						PromoteRelationUtils.addBalance(user.userID,itemID,{
							exceptionValue:value.toString(),
							lose:value.toString(),
						},"roomID:" + this.roomID)
					}
				}
			}
			let data:TexasUserData = user.extData
			resultNT.users.push({
				chairNo:chairNo,
				userID:user.userID,
				score:user.score.toString(),
				scoreChanged:value.toString(),
				cards:data.getShowCards().obj,
			})
			this.log("result: chairNo = " + data.chairNo + " userID = " + user.userID + " change = " + value)
		})
		this.sendToAllUser(GSCommonMsg.GameResult,resultNT)

		this.server.Room_CurrentGameStepRecord(this.roomID,this.stepRecordData)
		await this.yieldTimeout(4)
		this.setRoomStatus(knRoomRealtime.Status.JuEnd)
	}

	async step_JuEnd() {
		for(let user of this.users) {
			if(this.isChainNoWatcher(user.chairNo)) {
				continue 
			}
			if(this.matchID) {
				continue 
			}
			let data:TexasUserData = user.extData
			if(data.buyinStatus == TexasBuyinStatus.None) {
				if(!this.isValidScore(user.score)) {
					data.buyinStatus = TexasBuyinStatus.Need
					this.sendBuyinToUser(data.chairNo)
				}
			}
		}
		return await super.step_JuEnd()
	}


	get d():TexasRealtime {
		return <TexasRealtime>this.realtime_
	}

	getBuyinNT(chairNo:number) {
		let nt:GSCommonMsg.tBuyinOrStandNT = {
			chairNo:chairNo,
			timeoutSec:this.d.buyinTimeout / 1000,

			minValue:String(this.d.minBuyin),
			maxValue:String(this.d.maxBuyin),

			minNeed:String(this.d.bb + this.d.ante)
		}
		return nt 
	}
	sendBuyinToUser(chairNo:number) {
		this.sendToAllUser(GSCommonMsg.BuyinOrStand,this.getBuyinNT(chairNo))
	}
	
	handleMessage(chairNo: number, msgName: string, jsonObj: any): void {
		let user = this.getUser(chairNo)
		switch(msgName) {
			case GSCommonMsg.Buyin:{
				if(this.isReadyToDestroy)  {
					return 
				}
				let data:TexasUserData = user.extData
				let t:GSCommonMsg.tBuyinReq = jsonObj
				let b = false 
				let isWatch = this.isChainNoWatcher(chairNo)
				let score = GlobalUtils.newDecimal(t.score)
				if(score) {
					score = GlobalUtils.roundDown(score)
				}
				let newChairNo:number 
				let oldChairNo:number
				do {
					
					if(this.isValidScore(user.score)) {
						break 
					}
					if(!score || score.lessThan(this.d.minBuyin)) {
						break 
					}
					if(this.d.maxBuyin > 0 && score.greaterThan(this.d.maxBuyin)) {
						break 
					}

					if(isWatch) {
						let count = this.getSitChairNosCount()
						if(count >= this.getMaxPlayingUserCount()) {
							break 
						}
						if(t.toChairNo == null) {
							break 
						}
						if(t.toChairNo < 0 || t.toChairNo > this.getMaxPlayingUserCount()) {
							break 
						}
						let sitUser = this.getUser(t.toChairNo)
						if(sitUser) {
							break 
						}
						this.setUserSitdown(chairNo,true,t.toChairNo)
						newChairNo = t.toChairNo
						oldChairNo = chairNo
						
					}
					b = true 
				} while(false);
				if(!b) {
					this.setUserSitdown(user.chairNo,false)
					this.sendToUser(user.chairNo,GSCommonMsg.Buyin,<GSCommonMsg.tBuyinRes>{
						b:false
					})
					return 
				}
				if(data.buyinStatus != TexasBuyinStatus.Need) {
					return 
				}
				data.buyinStatus = TexasBuyinStatus.Process
				this.lockUser(user.chairNo,(async ()=>{
					let b = await this.processBuyin(user.chairNo,score)
					if(!b) {
						this.setUserSitdown(user.chairNo,false)
					}
				})())
			} break 
			case GSCommonMsg.BuyinCancel:{
				let data:TexasUserData = user.extData
				if(data.buyinStatus!= TexasBuyinStatus.Need) {
					return
				}
				let isWatch = this.isChainNoWatcher(chairNo)
				if(!isWatch){
					this.setUserSitdown(user.chairNo,false)
				}
				this.sendToAllUser(GSCommonMsg.BuyinCancel,<GSCommonMsg.tBuyinCancelRes>{chairNo})
			} break
			case GSUserMsg.UserExit:{
				if(!user ) {
					return
				}
				if(this.matchID) {
					return 
				}
				this.handleSelfExit(user);
				
			} break
			case GSUserMsg.UserStandUp:{
				if(!user ) {
					return
				}
				if(this.matchID) {
					return 
				}
				if(this.groupID || this.matchID) {
					this.handleSelfExit(user);
				} else {
					let isWatch = this.isChainNoWatcher(user.chairNo)
					if(isWatch){
						// this.sendErrorToUser(user.chairNo,99,"已在旁观中");
						return
					}
					if(this.handleUserCanExit(user,false)){
						this.setUserSitdown(user,false)
					}else{
						user.readyToStandUp = true;
						// this.sendErrorToUser(user.chairNo,99,"在游戏中无法站起，本局解除站起");
					}
				}
			} break
			// case GSCommonMsg.BuyinOrStand:{

			// } break 
		}
		super.handleMessage(chairNo,msgName,jsonObj)
	}

	handleLaterUpdate(): void {
		let time = kdutils.getMillionSecond()
		let chairNos = this.getPlayingChairNos()
		for(let chairNo of chairNos) {
			let data = this.getUserData(chairNo)
			if(data.buyinStatus == TexasBuyinStatus.Need) {
				if(time - data.buyinTime >= this.d.buyinTimeout) {
					//this.userExitByChairNo(chairNo)
					//支付超时 直接站起来
					this.setUserSitdown(chairNo,false)
				}
			}
		}
	}

	async processBuyin(chairNo:number,score:Decimal) {
		let user = this.getUser(chairNo)
		let data:TexasUserData = user.extData
		let b = false 
		do {
			let bLockValid = false 
			try {
				switch(this.d.payMainType) {
					case RoomDefine.PayType.Item:{
						if(this.matchID && this.isMatchLockID) {
							let count = await this.server.centerRpc.callException(kds.item.getUserLockItemCount,user.userID,this.lockID,String(this.d.payIndex))
							score = new Decimal(count || 0)
							bLockValid = score.greaterThanOrEqualTo(this.d.bb)
						} else {
							bLockValid = await this.server.centerRpc.callException(
								kds.item.lockItem,user.loginData.userID,this.d.lockID,String(this.d.payIndex),score.toString(),
									ItemDefine.SerialType.Buyin)
						}
					} break 
					case RoomDefine.PayType.Club:{
						bLockValid = await this.server.centerRpc.callException(
							kds.club.account.lockValue,this.clubID,user.loginData.userID,this.d.lockID,this.d.payIndex,score.toString(),
							ItemDefine.SerialType.Club)
					} break 
					case RoomDefine.PayType.Match:{
						this.logError("match buyin not support yet")
					} break 
				}
			} catch (error) {
				this.logError("error in buyin userID = " + user.loginData.userID + " chairNo = " + user.chairNo,error)
			}
			if(!bLockValid) {
				break 
			}
			b = true 
		} while (false);
		if(!b) {
			this.sendToUser(chairNo,GSCommonMsg.Buyin,<GSCommonMsg.tBuyinRes>{
				b:false,
			})
		} else {
			data.buyinStatus = this.isValidScore(user.score) ? TexasBuyinStatus.Need : TexasBuyinStatus.None
			this.sendToUser(chairNo,GSCommonMsg.Buyin,<GSCommonMsg.tBuyinRes>{
				b:true,
			})
			this.reportCharge(chairNo,score)
		}
		return b 
	}

	isValidScore(score:Decimal) {
		return score.greaterThanOrEqualTo(this.d.bb + this.d.ante)
	}

	handleAfterUserEnter(user:knRoomRealtime.UserData) {
		if(this.groupID) {
			let data = this.getUserData(user.chairNo)
			if(!this.isChainNoWatcher(data.chairNo)) {
				return 
			}
			if(data.buyinStatus != TexasBuyinStatus.Need) {
				return 
			}
			let toChairNo = this.selectPlayChairNo()
			if(toChairNo < 0) {
				this.doUserExit(user,true)
				this.log("auto sitdown failed toChairNo = " + toChairNo + " userID = " + user.userID)
				return 
			}
			data.buyinStatus = TexasBuyinStatus.Process

			this.setUserSitdown(user.chairNo,true,toChairNo)

			this.log("start auto buyin chairNo = " + user.chairNo + " userID = " + user.userID + " minBuyIn = " + this.d.minBuyin)
			this.lockUser(user.chairNo,(async ()=>{
				let b = await this.processBuyin(user.chairNo,new Decimal(this.d.minBuyin))
				if(!b) {
					this.doUserExit(user,true)
					this.log("auto sitdown failed buyin failed userID = " + user.userID)
				}
			})())
		} else if(this.matchID) {
			let data = this.getUserData(user.chairNo)
			if(!this.isChainNoWatcher(data.chairNo)) {
				return 
			}
			if(data.buyinStatus != TexasBuyinStatus.Need) {
				return 
			}
			let toChairNo = this.selectPlayChairNo()
			if(toChairNo < 0) {
				this.doUserExit(user,true)
				this.log("auto sitdown failed toChairNo = " + toChairNo + " userID = " + user.userID)
				return 
			}
			data.buyinStatus = TexasBuyinStatus.Process

			this.setUserSitdown(user.chairNo,true,toChairNo)

			this.log("start auto buyin chairNo = " + user.chairNo + " userID = " + user.userID + " minBuyIn = " + this.d.minBuyin)
			this.lockUser(user.chairNo,(async ()=>{
				let b = await this.processBuyin(user.chairNo,new Decimal(this.d.minBuyin))
				if(!b) {
					this.doUserExit(user,true)
					this.log("auto sitdown failed buyin failed userID = " + user.userID)
				}
			})())
		}

	}

	handleUserExit(user: knRoomRealtime.UserData): void {
		// switch(this.d.payMainType) {
		// 	case RoomDefine.PayType.Item:{
		// 		this.server.centerRpc.callException(
		// 			kds.item.unlockUser,user.loginData.userID,this.d.lockID,ItemDefine.SerialType.Game)
		// 	} break 
		// 	case RoomDefine.PayType.Club:{
		// 		this.server.centerRpc.callException(
		// 			kds.club.account.unlockUser,this.clubID,user.loginData.userID,this.d.lockID,ItemDefine.SerialType.Game)
		// 	} break 
		// }
	}
	handleUserCanExit(user:knRoomRealtime.UserData,force?:boolean){
		let isWait =  super.handleUserCanExit(user,force)
		if(force || isWait){
			return true;
		}
		let isWatch = this.isChainNoWatcher(user.chairNo)

		if(isWatch){
			// 观战游戏内随时退出
			return true;
		}
		// 没有参与游戏立即退出
		if(!this.getPlayingChairNos().includes(user.chairNo)) {
			return true 
		}
		return false;
	}

	handleCreateUserData(user:knRoomRealtime.UserData) {
		let data = new TexasUserData(user.userID,user.chairNo,this.d)
		data.buyinStatus = TexasBuyinStatus.Need
		return data 
	}

	handleSyncGameData(chairNo: number) {
		let user = this.getUser(chairNo)
		let data:TexasUserData = user.extData
		let ret:TexasUserMsg.tSyncData = {
			users:this.getPlayingChairNos().map(v=>{
				let data = this.getUserData(v)
				let cards = data ? data.cards?.obj : []
				if(chairNo != v && cards.length > 0) {
					for(let i = 0 ; i < cards.length ; i ++) {
						cards[i] = tCard.create(0,0)
					}
				}
				return {
					chairNo:v,
					cards:cards,
					position:data.position,
				}
			}),
			phase:this.d.curPhase,
			betTurnNT:this.betTurnNT_,
			buyin:data.buyinStatus != TexasBuyinStatus.None ? this.getBuyinNT(chairNo) : null,
			pool:this.d.pool ? this.d.pool.toSync() : null,
		}
		if(this.d.diCards && this.d.diCards.length > 0) {
			if(user.robot) {
				ret.users.push({
					chairNo:-1,
					cards:this.d.diCards.obj,
					position:null,
				})
			} else if(this.d.diEnabled) {
				let diCards = CardArray.empty
				for(let i = 0 ; i < this.d.diCards.length ; i ++) {
					if(this.d.diShows[i]) {
						diCards.push(this.d.diCards.at(i))
					} else {
						diCards.push(tCard.create(0,0))
					}
				}
				ret.users.push({
					chairNo:-1,
					cards:diCards.obj,
					position:null,
				})
			}
		}
		return ret 
	}
	
	handleUserSitdown(user:knRoomRealtime.UserData) {
		let data:TexasUserData = user.extData
		data.chairNo = user.chairNo
	}

	handleUserStandup(user:knRoomRealtime.UserData) {
		let data:TexasUserData = user.extData
		data.chairNo = user.chairNo
		if(user){
			Promise.all(user.locks)
			.then(()=>{
				user.locks.splice(0)
				if(this.matchID && this.startParams.lockID) {
					return 
				}
				switch(this.d.payMainType) {
					case RoomDefine.PayType.Item:{
						this.server.centerRpc.call(
							"kds.item.unlockUser",user.loginData.userID,this.d.lockID)
					} break 
					case RoomDefine.PayType.Club:{
						this.server.centerRpc.call(
							"kds.club.account.unlockUser",this.clubID,user.loginData.userID,this.d.lockID)
					} break 
				}
			})
		}

	}

	getValidReadyChairNos() {
		let playingChairNos:number[] = []
		for(let user of this.users) {
			if(!user.ready || this.isChainNoWatcher(user.chairNo)) {
				continue 
			}
			let data = <TexasUserData>user.extData
			if(data.buyinStatus != TexasBuyinStatus.None) {
				continue 
			}
			playingChairNos.push(user.chairNo)
		}
		return playingChairNos
	}
	
	getUserReadyEnabled(user: knRoomRealtime.UserData): boolean {
		let data:TexasUserData = user.extData
		return data.buyinStatus == TexasBuyinStatus.None	
	}

	stepChairNo(fromChairNo:number,chairNos:number[],containsSelf?:boolean) {
		let sitChairNos = this.getSitChairNos().sort()
		if(containsSelf) {
			if(chairNos.includes(fromChairNo)) {
				return fromChairNo
			}
		}
		let curChairNo = fromChairNo
		let curIdx = sitChairNos.indexOf(fromChairNo)
		for(let i = 0 ; i < sitChairNos.length ; i ++) {
			curIdx = (curIdx + 1) % sitChairNos.length
			curChairNo = sitChairNos[curIdx]
			if(curChairNo == fromChairNo) {
				return -1
			}
			if(chairNos.includes(curChairNo)) {
				return curChairNo
			}
		}
		return -1
	}
	getSeqs(chairNos:number[],startChairNo:number,containsStart?:boolean) {
		if(chairNos.length == 0) {
			return []
		}
		chairNos = chairNos.slice().sort()
		let idx = -1
		do {
			idx = chairNos.indexOf(startChairNo)
			startChairNo = (startChairNo+1)%this.getMaxPlayingUserCount();
		}while(idx < 0)
			
		if(idx < 0) {
			return []
		}
		let ret:number[] = []
		let starti = containsStart ? 0 : 1
		for(let i = starti ; i < chairNos.length ; i ++) {
			ret.push(chairNos[(i + idx) % chairNos.length])
		}
		return ret 
	}
	stepReverseChairNo(fromChairNo:number,chairNos:number[],containsSelf?:boolean) {
		let playingChairNos = this.getPlayingChairNos().sort()
		if(containsSelf) {
			if(chairNos.includes(fromChairNo)) {
				return fromChairNo
			}
		}
		let curChairNo = fromChairNo
		let curIdx = playingChairNos.indexOf(fromChairNo)
		for(let i = 0 ; i < playingChairNos.length ; i ++) {
			curIdx = curIdx - 1
			if(curIdx < 0) {
				curIdx = playingChairNos.length - 1
			}
			curChairNo = playingChairNos[curIdx]
			if(curChairNo == fromChairNo) {
				return -1
			}
			if(chairNos.includes(curChairNo)) {
				return curChairNo
			}
		}
		return -1
	}
	//主动退出
	handleSelfExit(user:knRoomRealtime.UserData){
		if(!this.doUserExit(user,false)){
			// this.sendErrorToUser(user.chairNo,99,"在游戏中无法退出，本局解除退出");
		}
	}
}