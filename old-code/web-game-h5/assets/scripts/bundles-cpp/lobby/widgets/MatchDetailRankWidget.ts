import Decimal from "decimaljs";
import UserUtils from "../../../core/utils/UserUtils";
import { MatchDefine } from "../../../ServerDefines/MatchDefine";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/widgets/MatchDetailRankWidget")
export default class MatchDetailRankWidget extends cc.Component {

	private userID_:number
	setRank(idx:number,rank:MatchDefine.tUserRank) {
		this.userID_ = rank.userID

		this.child("bg_1").active = idx == 0
		this.child("bg_2").active = idx == 1
		this.child("bg_3").active = idx == 2
		this.child("bg_4").active = idx == 3
		this.child("bg_5").active = idx >= 4

		this.child("rank_1").active = idx == 0
		this.child("rank_2").active = idx == 1
		this.child("rank_3").active = idx == 2

		let lblRank = this.childCom("rank",cc.Label)
		if(idx < 3) {
			lblRank.node.active = false
		} else {
			lblRank.node.active = true
			lblRank.string = String(idx + 1)
		}

		
		let name = this.childCom("name",cc.Label)
		let id = this.childCom("id",cc.Label)
		name.string = ""
		id.string = "ID:" + rank.userID
		UserUtils.instance.load(rank.userID)
		.then( userInfo => {
			if(this.isValid && this.userID_ == rank.userID) {
				name.string = userInfo ? userInfo.nickName : ""
			}
		})

		let win = this.childCom("win",cc.Label)
		let lose = this.childCom("lose",cc.Label)
		if(rank.scoreNum > 0) {
			win.string = "+" + rank.score
			
			win.node.active = true 
			lose.node.active = false
		} else {
			lose.string = "" + rank.score

			win.node.active = false
			lose.node.active = true
		}
	}

	setRuntime(idx:number,runtime:MatchDefine.tUserRuntime) {
		this.userID_ = runtime.userID

		this.child("bg_1").active = idx == 0
		this.child("bg_2").active = idx == 1
		this.child("bg_3").active = idx == 2
		this.child("bg_4").active = idx == 3
		this.child("bg_5").active = idx >= 4

		this.child("rank_1").active = idx == 0
		this.child("rank_2").active = idx == 1
		this.child("rank_3").active = idx == 2

		let lblRank = this.childCom("rank",cc.Label)
		if(idx < 3) {
			lblRank.node.active = false
		} else {
			lblRank.node.active = true
			lblRank.string = String(idx + 1)
		}
		
		let name = this.childCom("name",cc.Label)
		let id = this.childCom("id",cc.Label)
		name.string = ""
		id.string = "ID:" + runtime.userID
		UserUtils.instance.load(runtime.userID)
		.then( userInfo => {
			if(this.isValid && this.userID_ == runtime.userID) {
				name.string = userInfo ? userInfo.nickName : ""
			}
		})

		let win = this.childCom("win",cc.Label)
		let lose = this.childCom("lose",cc.Label)
		let change = new Decimal(runtime.scoreChange)
		if(change.greaterThan(0)) {
			win.string = "+" + change
			
			win.node.active = true 
			lose.node.active = false
		} else {
			lose.string = "" + change

			win.node.active = false
			lose.node.active = true
		}
	}

}