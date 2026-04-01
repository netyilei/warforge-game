import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg"
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg"
import PlayerExt_StatusBase, { PlayerExtStatusDefine, PlayerExtStatusEffectRedefine, PlayerExtStatusRedefine } from "../../room/PlayerExtensions/PlayerExt_Status"
import { TexasClientDefine } from "../TexasClientDefine"
import { TexasDefine, TexasUserMsg } from "../TexasDefine"

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_PlayingStatus")
export default class TexasPlayerExt_PlayingStatus
	extends PlayerExt_StatusBase<TexasClientDefine.PlayingStatus> {
	
	@PlayerExtStatusRedefine(TexasClientDefine.PlayingStatus,TexasClientDefine.PlayingStatus.None)
	defines = []
	@PlayerExtStatusEffectRedefine(TexasClientDefine.PlayingStatus,TexasClientDefine.PlayingStatus.None)
	effectDefines = []

	onInitPlayerExtension(): void {
		super.onInitPlayerExtension()
		this.status = TexasClientDefine.PlayingStatus.None
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				this.status = this.gameLayer.playingChairNos.includes(this.player.chairNo) ? TexasClientDefine.PlayingStatus.Play : TexasClientDefine.PlayingStatus.None
			})
			.listen(GSUserMsg.UserSitdown,(msg:GSUserMsg.tUserSitdownNT)=>{
				if(msg.chairNo == this.player.chairNo) {
					this.status = TexasClientDefine.PlayingStatus.Play
				}
			})
			.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
				for(let bet of msg.bets) {
					if(bet.chairNo != this.player.chairNo) {
						continue 
					}
					if(bet.type == TexasDefine.BetType.Abandon) {
						this.status = TexasClientDefine.PlayingStatus.Giveup
					} else if(bet.type == TexasDefine.BetType.Allin) {
						this.status = TexasClientDefine.PlayingStatus.Allin
					}
				}
			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				let data:TexasUserMsg.tSyncData = syncNT.syncData
				this.status = null 
				if(syncNT.gameStartNT && data.pool) {
					let playing = this.gameLayer.playingChairNos.includes(this.player.chairNo)
					if(!playing) {
						this.status = TexasClientDefine.PlayingStatus.None
						return 
					}
					let userType = data.pool.userTypes.find(v=>v.chairNo == this.player.chairNo)
					if(userType) {
						if(userType.lastType == TexasDefine.BetType.Abandon) {
							this.status = TexasClientDefine.PlayingStatus.Giveup
						} else if(userType.lastType == TexasDefine.BetType.Allin) {
							this.status = TexasClientDefine.PlayingStatus.Allin
						} else {
							this.status = null
						}
					} else {
						this.status = null
					}
				}
			}) 
	}
}