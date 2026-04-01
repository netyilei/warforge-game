import { Card, CardArray, tCard } from "../../../ServerDefines/CardDefine"
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg"
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg"
import PlayerExt_StatusBase, { PlayerExtStatusDefine, PlayerExtStatusEffectRedefine, PlayerExtStatusRedefine } from "../../room/PlayerExtensions/PlayerExt_Status"
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../TexasDefine"
import TexasGameLayer from "../TexasGameLayer"

const { ccclass, property, menu } = cc._decorator
let emptyDiCards = [
	tCard.create(0,0),
	tCard.create(0,0),
	tCard.create(0,0),
	tCard.create(0,0),
	tCard.create(0,0)
]
@ccclass
@menu("game/texas/TexasPlayerExt_CardPowerStatus")
export default class TexasPlayerExt_CardPowerStatus
	extends PlayerExt_StatusBase<TexasDefine.CardType,TexasGameLayer> {
	
	@PlayerExtStatusRedefine(TexasDefine.CardType,TexasDefine.CardType.High)
	defines = []
	@PlayerExtStatusEffectRedefine(TexasDefine.CardType,TexasDefine.CardType.High)
	effectDefines = []

	private cards_:CardArray
	private publicCards_:CardArray
	private fold_ = false 
	onInitPlayerExtension(): void {
		super.onInitPlayerExtension()
		this.cards_ = CardArray.empty
		this.publicCards_ = CardArray.empty
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				this.status = null 
				this.cards_ = CardArray.empty
				this.publicCards_ = CardArray.empty
				this.fold_ = false 
			})
			.listen(TexasUserMsg.PhaseChange,(msg:TexasUserMsg.tPhaseChangeNT)=>{
				if(msg.phase == TexasGamePhase.Flop) {
					this.publicCards_ = new CardArray(emptyDiCards)
				}
			})
			.listen(GSCommonMsg.Deal,(msg:GSCommonMsg.tDealNT)=>{
				if(this.fold_) {
					return 
				}
				let changed = false 
				for(let deal of msg.deals) {
					if(deal.chairNo == this.player.chairNo) {
						this.cards_.pushArray(deal.cards)
						changed = true 
						continue 
					}
					switch(deal.type) {
						case TexasDefine.DealType.Flop:{
							for(let i = 0 ; i < deal.cards.length ; i ++) {
								this.publicCards_.setCard(i,deal.cards[i])
							}
							changed = true 
						} break 
						case TexasDefine.DealType.Turn: {
							this.publicCards_.setCard(3,deal.cards[0])
							changed = true 
						} break 
						case TexasDefine.DealType.River: {
							this.publicCards_.setCard(4,deal.cards[0])
							changed = true 
						} break 
					}
				}
				if(!changed) {
					return 
				}
				let ret = this.gameLayer.power.analyseWithDiCards(this.cards_,this.publicCards_)
				if(!ret) {
					this.status = null 
				} else {
					this.status = TexasDefine.getCardType(ret.cardType)
				}
			})
			.listen(GSCommonMsg.Bet,(betNT:GSCommonMsg.tBetNT)=>{
				for(let bet of betNT.bets) {
					if(bet.chairNo == this.player.chairNo && bet.chairNo != this.gameLayer.selfChairNo) {
						if(bet.type == TexasDefine.BetType.Abandon) {
							this.status = null 
							this.fold_ = true 
						}
					}
				}
			})
			.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{
				for(let user of resultNT.users) {
					if(user.chairNo == this.player.chairNo && user.cards) {
						this.cards_.clear()
						this.cards_.pushArray(user.cards)
						let ret = this.gameLayer.power.analyseWithDiCards(this.cards_,this.publicCards_)
						if(!ret) {
							this.status = null 
						} else {
							this.status = TexasDefine.getCardType(ret.cardType)
						}
					}
				}
			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				let data:TexasUserMsg.tSyncData = syncNT.syncData
				this.publicCards_.clear()
				this.cards_.clear()
				if(syncNT.gameStartNT) {
					let chairNo = this.player.chairNo
					let board = data.users.find(v=>v.chairNo == -1)
					let user = data.users.find(v=>v.chairNo == chairNo)
					if(board) {
						this.publicCards_.pushArray(board.cards || [])
					}
					let userType = data.pool.userTypes.find(v=>v.chairNo == chairNo)
					if(!userType || userType.lastType == TexasDefine.BetType.Abandon) {
						if(chairNo != this.gameLayer.selfChairNo) {
							this.status = null 
							this.fold_ = true 
							return 
						}
					}
					if(user) {
						this.cards_.pushArray(user.cards || [])
					}
					let ret = this.gameLayer.power.analyseWithDiCards(this.cards_,this.publicCards_)
					if(!ret) {
						this.status = null 
					} else {
						this.status = TexasDefine.getCardType(ret.cardType)
					}
				}
			}) 
	}
}