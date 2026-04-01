import Decimal from "decimaljs"
import { GameConfigDefines } from "../../../games/GameConfigDefines"
import { GameSet } from "../../../ServerDefines/GameSet"
import { MatchDefine } from "../../../ServerDefines/MatchDefine"
import { RoomDefine } from "../../../ServerDefines/RoomDefine"
import moment = require("moment")


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/BillJuListItemWidget')
export default class BillJuListItemWidget extends cc.Component {
	@property(cc.Label)
	lblDate:cc.Label = null
	@property(cc.Label)
	lblRoom:cc.Label = null
	@property(cc.Label)
	lblWin:cc.Label = null
	@property(cc.Label)
	lblLose:cc.Label = null

	private bill_:RoomDefine.BillData
	setData(bill:RoomDefine.BillData) {
		this.bill_ = bill
		this.lblRoom.string = "对局ID:" + bill.roomID + "-" + bill.juCount
		this.lblDate.string = moment(bill.endTimestamp).format("YYYY-MM-DD HH:mm:ss")
		let userID = kcore.data.get("login/data/userID")
		let self = bill.users.find(v=>v.userID == userID)
		let score = new Decimal(self?.scoreChanged || 0)
		if(score.greaterThan(0)) {
			this.lblWin.string = "+" + score.toString()
			this.lblLose.string = ""
		} else {
			this.lblWin.string = ""
			this.lblLose.string = score.toString()
		}
	}

	onClick() {
		kcore.click.playAudio()
		kcore.ui.push("BillRoomUserDetailLayer",this.bill_)
	}
}