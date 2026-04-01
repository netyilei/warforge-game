import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg"
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg"
import PlayerExt_StatusBase, { PlayerExtStatusDefine, PlayerExtStatusEffectRedefine, PlayerExtStatusRedefine } from "../../room/PlayerExtensions/PlayerExt_Status"
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../TexasDefine"

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_BetStatus")
export default class TexasPlayerExt_BetStatus
	extends PlayerExt_StatusBase<TexasDefine.BetType> {
	
	@PlayerExtStatusRedefine(TexasDefine.BetType,TexasDefine.BetType.Bet)
	defines = []
	@PlayerExtStatusEffectRedefine(TexasDefine.BetType,TexasDefine.BetType.Bet)
	effectDefines = []

	onInitPlayerExtension(): void {
		super.onInitPlayerExtension()
		let ap = this.node.parent.getAnchorPoint()
		this.node.setAnchorPoint(ap)
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				this.status = null 
			})
			.listen(GSCommonMsg.BetTurn,(msg:GSCommonMsg.tBetTurnNT)=>{
				if(msg.chairNo == this.player.chairNo) {
					this.status = null 
				}
			})
			.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
				for(let bet of msg.bets) {
					if(bet.chairNo != this.player.chairNo) {
						continue 
					}
					this.status = bet.type
				}
			})
			.listen(TexasUserMsg.PhaseChange,(msg:TexasUserMsg.tPhaseChangeNT)=>{
				if(msg.phase != TexasGamePhase.Pre) {
					this.status = null 
				}
			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				let data:TexasUserMsg.tSyncData = syncNT.syncData
				if(syncNT.gameStartNT && data.pool) {
					let userType = data.pool.userTypes.find(v=>v.chairNo == this.player.chairNo)
					if(userType) {
						this.status = userType.phaseType
					}
				}
			}) 
	}
}