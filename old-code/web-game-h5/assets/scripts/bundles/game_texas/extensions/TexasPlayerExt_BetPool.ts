
import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import TexasGameLayer from "../TexasGameLayer";
import TexasPlayer from "../TexasPlayer";
import { TexasDefine, TexasUserMsg } from "../TexasDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_BetPool")
export default class TexasPlayerExt_BetPool extends BasePlayerExtension<TexasGameLayer,TexasPlayer> {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property(cc.Node)
	nodeAllInEffect:cc.Node = null
	@property(cc.Label)
	lblPool:cc.Label = null
	onInitPlayerExtension(): void {
		this.nodeRoot.active = false 
		// this.node.setAnchorPoint(this.node.parent.getAnchorPoint())
		this.gameLayer.dispMsg.addNode(this.node,null,this)
		.listen(GSUserMsg.GameStart,()=>{
			this.lblPool.string = "0"
			this.refreshActive()
		})
		.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
			for(let bet of msg.bets) {
				if(bet.chairNo != this.player.chairNo) {
					continue 
				}
				this.lblPool.string = Decimal.add(this.lblPool.string,bet.value).toString()
				if(krenderer.asset.audio) {
					switch(bet.type) {
						case TexasDefine.BetType.Allin:{
							krenderer.asset.audio.play(TexasClientDefine.AUDIO_ALLIN)
							krenderer.asset.audio.play(TexasClientDefine.AUDIO_ALLIN_STATUS)
						} break 
						case TexasDefine.BetType.Abandon:{
							krenderer.asset.audio.play(TexasClientDefine.AUDIO_FOLD)
						} break 
						case TexasDefine.BetType.Raise:{
							krenderer.asset.audio.play(TexasClientDefine.AUDIO_RAISE)
						} break
						default:{
							let value = new Decimal(bet.value || 0)
							if(value.lessThanOrEqualTo(0)) {
								krenderer.asset.audio.play(TexasClientDefine.AUDIO_CHECK)
							} else {
								krenderer.asset.audio.play(TexasClientDefine.AUDIO_BET)
							}
						} break 
					}
				}
			}
			this.refreshActive()
		})
		.listen(TexasUserMsg.PhaseChange,(msg:TexasUserMsg.tPhaseChangeNT)=>{
			if(TexasClientDefine.flyChipPhases.includes(msg.phase)) {
				this.lblPool.string = "0"
				this.refreshActive()
			}
		})
		.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{

		})
		.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
			let data:TexasUserMsg.tSyncData = syncNT.syncData
			if(syncNT.gameStartNT && data.pool) {
				let user = data.users.find(v=>v.chairNo == this.player.chairNo)
				if(user) {
					let pool = data.pool
					let total = new Decimal(0)
					for(let i = pool.phasePoolStartIdx ; i < pool.stacks.length ; i ++) {
						let stack = pool.stacks[i]
						let pUser = stack.users.find(v=>v.chairNo == this.player.chairNo)
						if(pUser) {
							total = total.add(pUser.value)
						}
					}
					this.lblPool.string = total.toString()
				} else {
					this.lblPool.string = "0"
				}
			}
			this.refreshActive()
		}) 
		
	}

	refreshActive() {
		let value = new Decimal(this.lblPool.string || "0")
		if(value.greaterThan(0) && this.gameLayer.playingChairNos.includes(this.player.chairNo)) {
			this.nodeRoot.active = true 
		} else {
			this.nodeRoot.active = false 
		}
	}
	onUserDataChanged(): void {
	}
}