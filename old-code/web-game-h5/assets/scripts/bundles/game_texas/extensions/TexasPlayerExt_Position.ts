import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg"
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg"
import PlayerExt_StatusBase, { PlayerExtStatusEffectRedefine, PlayerExtStatusRedefine } from "../../room/PlayerExtensions/PlayerExt_Status"
import { TexasDefine, TexasUserMsg } from "../TexasDefine"

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_Position")
export default class TexasPlayerExt_Position
	extends PlayerExt_StatusBase<TexasDefine.PositionType> {
	
	@PlayerExtStatusRedefine(TexasDefine.PositionType,TexasDefine.PositionType.D)
	defines = []
	@PlayerExtStatusEffectRedefine(TexasDefine.PositionType,TexasDefine.PositionType.D)
	effectDefines = []

	onInitPlayerExtension(): void {
		super.onInitPlayerExtension()
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,()=>{
				if(this.gameLayer.playingChairNos.includes(this.player.chairNo)) {
					let data:TexasUserMsg.tGameStartData = this.gameLayer.gameStartData
					let pss = data.users.filter(v=>v.chairNo == this.player.chairNo).map(v=>v.position)
					this.statuss = pss
				} else {
					this.status = null 
				}
			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				let data:TexasUserMsg.tSyncData = syncNT.syncData
				let pss = data.users.filter(v=>v.chairNo == this.player.chairNo).map(v=>v.position)
				this.statuss = pss
			}) 
	}
}