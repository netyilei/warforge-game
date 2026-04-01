
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { SrsUserMsg } from "../../../ServerDefines/SrsUserMsg";
import { BasePlayerExtension } from "../BasePlayerExtension";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/PlayerExt_Score")
export default class PlayerExt_Score<
		GameLayerClass extends kroom.IBaseGameLayer = kroom.IBaseGameLayer,
		PlayerClass extends kroom.IBasePlayer = kroom.IBasePlayer
	> 
	extends BasePlayerExtension<GameLayerClass,PlayerClass> {
	

	@property(cc.Label)
	lblScore:cc.Label = null
	@property({tooltip:"小数位数"})
	acc:number = 0
	@property({tooltip:"向上截断还是向下截断"})
	accRoundUpOrDown:boolean = false 

	onInitPlayerExtension(): void {
		this.lblScore.string = ""
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.ScoreChange,(msg:GSUserMsg.tScoreChangeNT)=>{
				if(msg.chairNo == this.player.chairNo) {
					this.onUserDataChanged()
				}
			})
			.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
				let user = syncNT.users.find(v=>v.chairNo == this.player.chairNo)
				if(user) {
					this.player.score = user.score
					this.onUserDataChanged()
				}
			}) 
	}
	onUserDataChanged(): void {
		this.lblScore.string = new Decimal(this.player.score).toDecimalPlaces(this.acc,this.accRoundUpOrDown ? Decimal.ROUND_UP : Decimal.ROUND_DOWN).toString()
	}
}