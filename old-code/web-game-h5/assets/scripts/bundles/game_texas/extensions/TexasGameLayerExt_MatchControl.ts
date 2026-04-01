import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox";
import { BaseGameLayerExtension } from "../../room/BaseGameLayerExtension";
import { TexasDefine, TexasGamePhase, TexasRule, TexasUserMsg } from "../TexasDefine";
import _ = require("underscore");
import { TexasClientDefine } from "../TexasClientDefine";
import TexasGameLayer from "../TexasGameLayer";
import { rcData } from "../../../core/utils/rcData";
import { TexasLocalData } from "../TexasLocal";
import { TexasQuickBet } from "../TexasQuickSetView";
import Decimal from 'decimaljs'
import { GameConfigDefines } from "../../../games/GameConfigDefines";
import { GameSet } from "../../../ServerDefines/GameSet";
import { GSMatchUserMsg } from "../../../ServerDefines/GSMatchUserMsg";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("game/texas/TexasGameLayerExt_MatchControl")
export default class TexasGameLayerExt_MatchControl extends BaseGameLayerExtension<TexasGameLayer> {
	@property(cc.Node)
	nodeCombineTip:cc.Node = null
	@property(cc.Node)
	nodeCombineForceTip:cc.Node = null
	@property(cc.Node)
	nodeBtnRank:cc.Node = null 
	onInitLayerExtension(): void {
		this.nodeCombineTip.active = false 
		this.nodeCombineForceTip.active = false
		this.nodeBtnRank.active = false 
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,(msg:GSUserMsg.tRoomInfoNT)=>{
				this.nodeCombineTip.active = false 
				if(this.gameLayer.roomInfo.matchID) {
					this.nodeBtnRank.active = true 
				} else {
					this.nodeBtnRank.active = false 
				}
			})
			.listen(GSMatchUserMsg.WaitForCombine,(msg:GSMatchUserMsg.tWaitForCombineNT)=>{
				if(msg.force) {
					this.nodeCombineForceTip.active = true
				} else {
					this.nodeCombineTip.active = true 
				}
			})
			.listen(GSUserMsg.GameEnd,()=>{
				this.nodeCombineTip.active = false 
				this.nodeCombineForceTip.active = false
			})
	}

	onClickMatchRank() {
		kcore.click.playAudio()
		if(!this.gameLayer.roomInfo.matchID) {
			return 
		}
		kcore.ui.push("MatchDetailLayer",this.gameLayer.roomInfo.matchID,1)
	}
}