import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg"
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg"
import { BasePlayerExtension } from "../../room/BasePlayerExtension"
import { TexasClientDefine } from "../TexasClientDefine"
import { TexasDefine, TexasUserMsg } from "../TexasDefine"

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_Timer")
export default class TexasPlayerExt_Timer extends BasePlayerExtension {
	protected renderer_:krenderer.ITimer
	onInitPlayerExtension(): void {
		let skin = krenderer.atlas.getSkin(TexasClientDefine.Skin_TimerUser)
		this.renderer_ = krenderer.atlas.createRendererBySkin(skin)
		this.node.addChild(this.renderer_.node)

		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				this.renderer_.setTimer()
			})
			.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
				this.renderer_.setTimer()
			})
			.listen(GSCommonMsg.BetTurn,(msg:GSCommonMsg.tBetTurnNT)=>{
				if(this.player.chairNo == msg.chairNo) {
					this.renderer_.setTimer(msg.timeoutSec || 30)
				}
			})
			.listen(GSCommonMsg.GameResult,(msg:GSCommonMsg.tBetTurnNT)=>{
				this.renderer_.setTimer()
			})
			.listen(GSUserMsg.GameEnd,(msg:GSCommonMsg.tBetTurnNT)=>{
				this.renderer_.setTimer()
			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				let data:TexasUserMsg.tSyncData = syncNT.syncData
				if(data.betTurnNT && data.betTurnNT.chairNo == this.player.chairNo) {
					this.renderer_.setTimer(data.betTurnNT.timeoutSec || 30)
				}
			}) 
	}
}