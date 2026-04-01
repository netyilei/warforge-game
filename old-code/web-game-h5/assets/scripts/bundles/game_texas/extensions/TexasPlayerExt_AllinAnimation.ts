import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import { PlayerPotType } from "../../room/BasePlayer";
import { TexasDefine, TexasUserMsg } from "../TexasDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_AllinAnimation")
export default class TexasPlayerExt_AllinAnimation extends BasePlayerExtension {
	@property()
	nameHead:string = ""
	@property()
	nameZi:string = ""
	onInitPlayerExtension(): void {
		this.gameLayer.dispMsg.addNode(this.node,null,this)
		.listen(GSUserMsg.GameStart,()=>{
			this.clearAnimation()
		})
		.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{
			this.clearAnimation()
		})
		.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
			let selfPlayer = this.player
			for(let bet of msg.bets) {
				if(bet.chairNo == selfPlayer.chairNo && bet.type == TexasDefine.BetType.Allin) {
					this.playAnimation()
					return 
				}
			}
		})
		.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
			this.clearAnimation()
			let data:TexasUserMsg.tSyncData = syncNT.syncData
			let selfChairNo = this.player.chairNo
			if(data.pool && data.pool.userTypes) {
				let userType = data.pool.userTypes.find(v=>v.chairNo == selfChairNo)
				if(userType?.lastType == TexasDefine.BetType.Allin) {
					this.playAnimation()
				}
			}
		}) 
	}

	private nodeAniHead_:cc.Node
	private nodeAniZi_:cc.Node
	clearAnimation() {
		if(this.nodeAniHead_) {
			if(this.nodeAniHead_.isValid) {
				this.nodeAniHead_.destroy()
			}
			this.nodeAniHead_ = null
		}
		if(this.nodeAniZi_) {
			if(this.nodeAniZi_.isValid) {
				this.nodeAniZi_.destroy()
			}
			this.nodeAniZi_ = null
		}
	}

	playAnimation() {
		this.clearAnimation()
		let aniHead = krenderer.asset.ani.createAnimation(this.nameHead)
		this.node.addChild(aniHead.node)
		this.nodeAniHead_ = aniHead.node

		// let aniZi = krenderer.asset.ani.createAnimation(this.nameZi)
		// this.node.addChild(aniZi.node)
		// this.nodeAniZi_ = aniZi.node
	}

	onUserDataChanged(): void {
	
	}
}