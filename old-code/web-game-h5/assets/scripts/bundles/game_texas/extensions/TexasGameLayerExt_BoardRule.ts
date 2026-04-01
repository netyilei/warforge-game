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

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("game/texas/TexasGameLayerExt_BoardRule")
export default class TexasGameLayerExt_BoardRule extends BaseGameLayerExtension<TexasGameLayer> {
	@property(cc.Label)
	lblRule:cc.Label = null
	onInitLayerExtension(): void {
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.RoomInfo,(msg:GSUserMsg.tRoomInfoNT)=>{
				let gameSet = GameSet.createWithData(msg.gameData)
				let serialize = GameConfigDefines.getSerialize(gameSet)
				
				let sb = gameSet.iSets[TexasRule.Group6_SBlind]
				let bb = sb * 2
				let ante = gameSet.iSets[TexasRule.Group5_ANTE]
				let baseScore = gameSet.getScore()
				let rule = ""
				if(gameSet.checkRule(TexasRule.Group0,TexasRule.Group0_ANTE)) { 
					rule += `${ante}/${sb}/${bb}`
				} else {
					rule += `${sb}/${bb}`
				}
				let extNames = serialize.getExtensioNames()
				if(extNames.length > 0) {
					rule += " " + extNames.join(",")
				}
				this.lblRule.string = rule
			})
	}
}