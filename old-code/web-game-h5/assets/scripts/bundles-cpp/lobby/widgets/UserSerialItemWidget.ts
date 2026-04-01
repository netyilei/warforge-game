import moment = require("moment")
import { ItemDefine } from "../../../ServerDefines/ItemDefine"
import { NewsDefine } from "../../../ServerDefines/NewsDefine"
import Decimal from "decimaljs"

const { ccclass, property, menu } = cc._decorator

export const SerialNameMap = {
	["System"]:"系统",

	["GM"]:"GM",
	["Charge"]:"充值",
	["Withdraw"]:"发起提现",
	["WithdrawFailed"]:"提现失败",
	["ChangeName"]:"改名",
	["MailAttach"]:"消息附件",

	["GMCharge"]:"GM充值",
	["GMWithdraw"]:"GM提现",
	
	["ChargeRefund"]:"充值退款",
	["ChargeReward"]:"充值奖励",
	
	["Lock"]:"锁定",
	["Unlock"]:"解锁",

	["Game"]:"游戏",
	["Buyin"]:"买入",
	["GameJu"]:"局内变化",
	["GameEnd"]:"游戏结束",
	["GameFee"]:"游戏费用",

	["Group"]:"匹配",
	["EnterGroup"]:"进入匹配",

	["Match"]:"比赛",
	["MatchSignup"]:"比赛报名",
	["MatchEnter"]:"进入比赛",
	["MatchEnd"]:"比赛结束",
	["MatchRank"]:"比赛排名",
	["MatchBuyin"]:"比赛买入",
	
	["Club"]:"俱乐部",
	
	["Give"]:"赠送",
	["Receive"]:"接收",

	["GiveFailed"]:"赠送失败",

	["DeskCost"]:"桌费消耗",
	["DeskCostEarn"]:"桌费收入",
	["WaterEarn"]:"抽水收入",

	["Mail"]:"邮件",


	["Lobby"]:"大厅",
	["Lobby_Lottery"]:"大厅抽奖",
	["Lobby_Task"]:"大厅任务",
	["Lobby_Checkin"]:"大厅签到",
}
@ccclass
@menu("cpp/widgets/UserSerialItemWidget")
export default class UserSerialItemWidget extends cc.Component {
	@property(cc.Label)
	lblTitle:cc.Label = null
	@property(cc.Label)
	lblDate:cc.Label = null
	@property(cc.Label)
	lblWin:cc.Label = null
	@property(cc.Label)
	lblLose:cc.Label = null
	
	setData(serial:ItemDefine.tSerial) {
		this.lblTitle.string = SerialNameMap[ItemDefine.SerialType[serial.type]] || ItemDefine.SerialType[serial.type]
		this.lblDate.string = moment(serial.timestamp).format("YYYY-MM-DD HH:mm:ss")
		let score = new Decimal(serial.changed)
		if(score.gte(0)) {
			this.lblWin.string = "+" + score.toString()
			this.lblLose.string = ""
		} else {
			this.lblWin.string = ""
			this.lblLose.string = score.toString()
		}
	}
}