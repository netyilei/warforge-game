import { BasePlayerExtension } from "../../room/BasePlayerExtension";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { TexasClientDefine } from "../TexasClientDefine";
import TexasGameLayer from "../TexasGameLayer";
import TexasPlayer from "../TexasPlayer";
import { TexasUserMsg } from "../TexasDefine";
import TexasPlayerExt_JuResultControlWidget_Label from "./TexasPlayerExt_JuResultControlWidget_Label";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_JuResultControl")
export default class TexasPlayerExt_JuResultControl extends BasePlayerExtension<TexasGameLayer,TexasPlayer> {
	@property(cc.Node)
	nodeResultTemplate:cc.Node = null
	@property()
	yStartOffset:number = -100
	onInitPlayerExtension(): void {
		this.nodeResultTemplate.active = false 
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{
				for(let user of resultNT.users) {
					if(user.chairNo == this.player.chairNo) {
						if(this.gameLayer.playingChairNos.includes(user.chairNo) && new Decimal(user.scoreChanged).greaterThan(0)) {
							let node = kcore.display.instantiate(this.nodeResultTemplate)
							node.active = true 
							let com = node.getComponent(TexasPlayerExt_JuResultControlWidget_Label)
							com.setScore(user.scoreChanged)

							this.node.addChild(node)
							node.position2 = cc.v2(0,this.yStartOffset)
							node.opacity = 180

							let interval = 0.2
							node.runAction(cc.sequence([
								cc.spawn([
									cc.fadeIn(interval),
									cc.moveTo(interval,cc.v2(0,0)).easing(cc.easeOut(2)),
								]),
								cc.delayTime(2.5),
								cc.spawn([
									cc.fadeOut(interval),
									cc.moveTo(interval,cc.v2(0,-this.yStartOffset)).easing(cc.easeOut(2)),
								]),
								cc.destroySelf()
							]))
						}
						break 
					}
				}
			})
		
	}
}