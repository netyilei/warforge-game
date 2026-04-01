import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import { PlayerPotType } from "../../room/BasePlayer";
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../TexasDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_HandCardBack")
export default class TexasPlayerExt_HandCardBack extends BasePlayerExtension {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property(cc.Node)
	nodeCard1:cc.Node = null
	@property(cc.Node)
	nodeCard2:cc.Node = null

	private cards_:krenderer.ICard[]
	private originRots_:number[] = []
	private originPos2s_:cc.Vec2[] = []
	onInitPlayerExtension(): void {
		this.originRots_ = [this.nodeCard1.rotation,this.nodeCard2.rotation]
		this.originPos2s_ = [this.nodeCard1.position2,this.nodeCard2.position2]
		this.cards_ = [
			krenderer.atlas.createRenderer(krenderer.RType.Card),
			krenderer.atlas.createRenderer(krenderer.RType.Card),
		]
		for(let card of this.cards_) {
			card.showBack = true
			card.showBack = true
		}
		this.nodeCard1.addChild(this.cards_[0].node)
		this.nodeCard2.addChild(this.cards_[1].node)

		this.nodeRoot.active = false 
		this.gameLayer.dispMsg.addNode(this.node,null,this)
		.listen(GSUserMsg.GameStart,()=>{
			if(this.gameLayer.playingChairNos.includes(this.player.chairNo)) {
				this.nodeRoot.active = false 
			} else {
				this.nodeRoot.active = false
			}
		})
		.listen(GSCommonMsg.Deal,(msg:GSCommonMsg.tDealNT)=>{
			for(let deal of msg.deals) {
				switch(deal.type) {
					case TexasDefine.DealType.Di:{
						if(deal.chairNo == this.player.chairNo) {
							if(deal.chairNo != this.gameLayer.selfChairNo) {
								this.nodeRoot.active = true 
								this.playAction()
							}
						}
					} break 
					case TexasDefine.DealType.UserShow:
					case TexasDefine.DealType.Allin:{
						if(deal.chairNo == this.player.chairNo) {
							this.nodeRoot.active = false 
						}
					} break 
					case TexasDefine.DealType.ResultShow:{
						if(deal.chairNo == this.player.chairNo) {
							this.nodeRoot.active = false 
						}
					} break 
					default:{
					} break 
				}
			}
			// 收起筹码
		})
		.listen(GSCommonMsg.Bet,(betNT:GSCommonMsg.tBetNT)=>{
			for(let bet of betNT.bets) {
				if(bet.chairNo == this.player.chairNo && bet.type == TexasDefine.BetType.Abandon) {
					this.nodeRoot.active = false 
				}
			}
		})
		.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{

		})
		.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
			let data:TexasUserMsg.tSyncData = syncNT.syncData
			let user = data.users.find(v=>v.chairNo == this.player.chairNo)
			if(user) {
				if(data.phase != null && data.phase >= TexasGamePhase.BB) {
					if(user.showCards) {
						this.nodeRoot.active = false
					} else {
						this.nodeRoot.active = true
						this.playAction()
					}
				}
			}
		}) 
	}

	playAction() {
		this.nodeCard1.stopAllActions()
		this.nodeCard2.stopAllActions()

		let time = 0.2
		this.nodeCard1.rotation = 0
		this.nodeCard2.rotation = 0
		this.nodeCard1.position2 = cc.v2(this.originPos2s_[0].x,this.originPos2s_[0].y+20)
		this.nodeCard2.position2 = cc.v2(this.originPos2s_[1].x,this.originPos2s_[1].y+20)

		this.nodeCard1.runAction(cc.sequence([
			cc.moveTo(time,this.originPos2s_[0]).easing(cc.easeCubicActionOut()),
			cc.rotateTo(time,this.originRots_[0]).easing(cc.easeCubicActionOut()),
		]))
		this.nodeCard2.runAction(cc.sequence([
			cc.moveTo(time,this.originPos2s_[1]).easing(cc.easeCubicActionOut()),
			cc.rotateTo(time,this.originRots_[1]).easing(cc.easeCubicActionOut()),
		]))

	}
	onUserDataChanged(): void {
	
	}
}