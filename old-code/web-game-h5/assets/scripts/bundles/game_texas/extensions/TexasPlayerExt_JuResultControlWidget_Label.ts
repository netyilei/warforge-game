import Decimal from 'decimaljs'


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("game/texas/TexasPlayerExt_JuResultControlWidget_Label")
export default class TexasPlayerExt_JuResultControlWidget_Label extends cc.Component {
	@property(cc.Label)
	lblScore:cc.Label = null
	setScore(scoreChanged:string) {
		if(new Decimal(scoreChanged).greaterThanOrEqualTo(0)) {
			this.lblScore.string = "+" + scoreChanged
		} else {
			this.lblScore.string = scoreChanged
		}
	}
}