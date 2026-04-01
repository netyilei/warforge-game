
import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import { PlayerPotType } from "../../room/BasePlayer";
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../TexasDefine";
import { BaseGameLayerExtension } from "../../room/BaseGameLayerExtension";
import { tCard } from "../../../ServerDefines/CardDefine";
import Decimal from 'decimaljs'
const { ccclass, property, menu } = cc._decorator

let emptyDiCards = [
	tCard.create(0,0),
	tCard.create(0,0),
	tCard.create(0,0),
	tCard.create(0,0),
	tCard.create(0,0)
]
@ccclass
@menu("game/texas/TexasGameLayerExt_PublicCards")
export default class TexasGameLayerExt_PublicCards extends BaseGameLayerExtension {
	protected handCards_:krenderer.IHandCards
	onInitLayerExtension(): void {
		this.handCards_ = krenderer.atlas.createRenderer(krenderer.RType.HandCards)
		this.handCards_.autoShowBack = true 
		this.handCards_.autoFlipToShow = true 
		this.node.addChild(this.handCards_.node)


		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				this.handCards_.clear()
			})
			.listen(TexasUserMsg.PhaseChange,(msg:TexasUserMsg.tPhaseChangeNT)=>{
				if(msg.phase == TexasGamePhase.Flop) {
					this.handCards_.clear()
					this.handCards_.pushCards(emptyDiCards)
				}
			})
			.listen(GSCommonMsg.Deal,(msg:GSCommonMsg.tDealNT)=>{
				let playDeal = false 
				for(let deal of msg.deals) {
					if(deal.type == TexasDefine.DealType.UserShow || deal.type == TexasDefine.DealType.ResultShow) {
						if(krenderer.asset.audio) {
							krenderer.asset.audio.play(TexasClientDefine.AUDIO_SHOWCARD)
						}
					} else  {
						playDeal = true 
					}
					if(deal.chairNo != -1) {
						continue 
					}
					switch(deal.type) {
						case TexasDefine.DealType.Di:{
							this.handCards_.clear()
							this.handCards_.pushCards(emptyDiCards)
						} break 
						case TexasDefine.DealType.Flop:{
							for(let i = 0 ; i < deal.cards.length ; i ++) {
								this.handCards_.setCard(i,deal.cards[i])
							}
						} break 
						case TexasDefine.DealType.Turn: {
							this.handCards_.setCard(3,deal.cards[0])
						} break 
						case TexasDefine.DealType.River:{
							this.handCards_.setCard(4,deal.cards[0])
						} break 
					}
				}
				if(playDeal) {
					if(krenderer.asset.audio) {
						krenderer.asset.audio.play(TexasClientDefine.AUDIO_DEAL)
					}
				}
			})
			.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{

			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				this.handCards_.clear()
				if(syncNT.gameStartNT) {
					let data:TexasUserMsg.tSyncData = syncNT.syncData
					let board = data.users.find(v=>v.chairNo == -1)
					if(board) {
						this.handCards_.pushCards(emptyDiCards)
						for(let i = 0 ; i < board.cards.length ; i ++) {
							let card = board.cards[i]
							this.handCards_.setCard(i,card)
						}
					}
				}
			}) 
	}
	onUserDataChanged(): void {
	}
}