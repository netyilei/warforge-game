import moment = require("moment")
import UIManager from "../../../core/ui/UIManager"
import { GameConfigDefines } from "../../../games/GameConfigDefines"
import { GameSet } from "../../../ServerDefines/GameSet"
import { MatchDefine } from "../../../ServerDefines/MatchDefine"
import { RoomDefine } from "../../../ServerDefines/RoomDefine"
import Decimal from "decimaljs"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/BillListItemWidget')
export default class BillListItemWidget extends cc.Component {
	@property(cc.Node)
	nodeSprFriend:cc.Node = null
	@property(cc.Node)
	nodeSprGroup:cc.Node = null
	@property(cc.Node)
	nodeSprMatch:cc.Node = null	
	@property(cc.Label)
	lblRule:cc.Label = null
	@property(cc.Label)
	lblRoom:cc.Label = null
	@property(cc.Label)
	lblWin:cc.Label = null
	@property(cc.Label)
	lblLose:cc.Label = null
	@property(cc.Label)
	lblTitle:cc.Label = null

	private bill_:RoomDefine.FinalBillData
	setData(bill:RoomDefine.FinalBillData) {
		this.bill_ = bill
		this.nodeSprFriend.active = false 
		this.nodeSprGroup.active = false
		this.nodeSprMatch.active = false 
		if(bill.matchID) {
			this.nodeSprMatch.active = true
			this.lblTitle.string = "竞技赛:" + bill.matchID
		} else if(bill.groupID) {
			this.nodeSprGroup.active = true
			this.lblTitle.string = "快速开始"
		} else {
			this.nodeSprFriend.active = true
			this.lblTitle.string = "好友房"
		}
		let gameSet = GameSet.createWithData(bill.gameData)
		this.lblRule.string = GameConfigDefines.getSerialize(gameSet).getRuleInList()
		this.lblRoom.string = "房间ID:" + bill.roomID + " " + moment(bill.endTimestamp).format("YYYY-MM-DD HH:mm:ss")
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
		UIManager.instance.push("BillRoomDetailLayer",this.bill_)
	}

}