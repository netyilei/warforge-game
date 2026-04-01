import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import { PlayerPotType } from "../../room/BasePlayer";
import { TexasDefine, TexasUserMsg } from "../TexasDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_HandCards")
export default class TexasPlayerExt_HandCards extends BasePlayerExtension {
	protected handCards_:krenderer.IHandCards
	onInitPlayerExtension(): void {
		this.handCards_ = krenderer.atlas.createRenderer(krenderer.RType.HandCards)
		this.handCards_.node.active = false 
		this.handCards_.autoShowBack = true 
		this.handCards_.autoFlipToShow = true 
		this.node.addChild(this.handCards_.node)
		// this.player.addPot(this.handCards_.node,TexasClientDefine.PlayerPotPos.HandCards,PlayerPotType.AddChild)


		let funcCheckIsSelfPlaying = ()=>{
			let selfPlayer = this.gameLayer.selfPlayer
			return selfPlayer && selfPlayer.chairNo == this.player.chairNo && this.gameLayer.playingChairNos.includes(selfPlayer.chairNo)
		}

		this.gameLayer.dispMsg.addNode(this.node,null,this)
		.listen(GSUserMsg.GameStart,()=>{
			this.handCards_.clear()
			this.handCards_.node.active = funcCheckIsSelfPlaying()
		})
		.listen(GSCommonMsg.Deal,(msg:GSCommonMsg.tDealNT)=>{
			for(let deal of msg.deals) {
				switch(deal.type) {
					case TexasDefine.DealType.UserShow:
					case TexasDefine.DealType.Allin:{
						if(deal.chairNo == this.player.chairNo) {
							this.handCards_.node.active = true 
							for(let i = 0 ; i < deal.cards.length ; i ++) {
								this.handCards_.setCard(i,deal.cards[i])
							}
						}
					} break 
					case TexasDefine.DealType.ResultShow:{
						if(deal.chairNo == this.player.chairNo) {
							this.handCards_.node.active = true 
							for(let i = 0 ; i < deal.cards.length ; i ++) {
								this.handCards_.setCard(i,deal.cards[i])
							}
						}
					} break 
					default:{
						if(deal.chairNo == this.player.chairNo) {
							this.handCards_.pushCards(deal.cards)
						}
					} break 
				}
			}
			// 收起筹码
		})
		.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{

		})
		.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
			let data:TexasUserMsg.tSyncData = syncNT.syncData
			let user = data.users.find(v=>v.chairNo == this.player.chairNo)
			if(user) {
				this.handCards_.clear()
				if(user.cards) {
					this.handCards_.pushCards(user.cards)
				}
			}
		}) 
	}
	onUserDataChanged(): void {
	
	}
}