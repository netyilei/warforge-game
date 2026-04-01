import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import { PlayerPotType } from "../../room/BasePlayer";
import { TexasDefine, TexasUserMsg } from "../TexasDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_FoldAniInLayer")
export default class TexasPlayerExt_FoldAniInLayer extends BasePlayerExtension {
	@property()
	nameAni:string = "ani_fold_card_fly"
	onInitPlayerExtension(): void {
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
				let selfPlayer = this.player
				for(let bet of msg.bets) {
					if(bet.chairNo == selfPlayer.chairNo && bet.type == TexasDefine.BetType.Abandon) {
						this.playAnimation()
					}
				}
			})
	}


	playAnimation() {
		let aniHead = krenderer.asset.ani.createAnimation(this.nameAni)
		this.node.addChild(aniHead.node)
		aniHead.playSeqs(krenderer.AniPlayType.Destroy)

		let target = aniHead.runtimes[0].items[0].target
		target.destroyAllChildren()

		let handCards = krenderer.atlas.createRenderer<krenderer.IHandCards>(krenderer.RType.HandCards)
		handCards.autoShowBack = true 
		handCards.autoFlipToShow = false 
		handCards.pushCards([
			{suit:0,value:0},
			{suit:0,value:0},
		])
		target.addChild(handCards.node)
	}
}