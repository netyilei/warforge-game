import Decimal from "decimaljs"
import { MatchDefine } from "../../../ServerDefines/MatchDefine"
import { RoomDefine } from "../../../ServerDefines/RoomDefine"
import { Config } from "../../../core/Config"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/BillUserListItemWidget')
export default class BillUserListItemWidget extends cc.Component {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Label)
	lblName:cc.Label = null
	@property(cc.Label)
	lblScore:cc.Label = null

	setData(bill:RoomDefine.BillData['users'][0]) {
		this.lblName.string = bill.nickName
		let score = new Decimal(bill.scoreChanged || 0)
		if(score.greaterThan(0)) {
			this.lblScore.string = "+" + score.toString()
		} else {
			this.lblScore.string = score.toString()
		}
		kcore.display.setWebTextureStyle(this.sprIcon,bill.iconUrl,{
			style:"opacity",
			defaultSpriteFrame:Config.defaultIconSpriteFrame,
		})
	}
}