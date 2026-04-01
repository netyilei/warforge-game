import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import PlayerExt_Score from "../../room/PlayerExtensions/PlayerExt_Score";
import { PlayerPotPos } from "../../room/BasePlayer";
import { TexasClientDefine } from "../TexasClientDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_ScorePool")
export default class TexasPlayerExt_ScorePool extends PlayerExt_Score {
	
	onInitPlayerExtension(): void {
		super.onInitPlayerExtension()
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
				for(let bet of msg.bets) {
					if(bet.chairNo != this.player.chairNo) {
						continue 
					}
					if(new Decimal(bet.value || "0").greaterThan(0)) {
						let nodePool = this.player.getPotByPos(PlayerPotPos.Pool)
						let aniNode = this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Middle) || this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Top)
						this.gameLayer.dispMsg.dispatch(TexasClientDefine.Event_FlyChip,this.node,nodePool,aniNode,1)
					}
				}
			})
	}
	onUserDataChanged(): void {
		super.onUserDataChanged()
	}
}