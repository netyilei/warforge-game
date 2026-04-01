import moment = require("moment")
import { MatchDefine } from "../../../ServerDefines/MatchDefine"
import { ReqLobby } from "../../../requests/ReqLobby"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/MatchItemWidget')
export default class MatchItemWidget extends cc.Component {
	@property(cc.Sprite)
	sprRunning:cc.Sprite = null
	@property(cc.Sprite)
	sprOther:cc.Sprite = null
	@property(cc.Sprite)
	sprOtherEnd:cc.Sprite = null
	@property(cc.Label)
	lblRunning:cc.Label = null
	@property(cc.Label)
	lblOther:cc.Label = null
	@property(cc.Label)
	lblOtherEnd:cc.Label = null
	@property(cc.Label)
	lblTimer:cc.Label = null
	@property(cc.Label)
	lblMatchName:cc.Label = null
	@property(cc.Label)
	lblValueCount:cc.Label = null
	@property(cc.Label)
	lblUserCount:cc.Label = null

	@property(cc.Node)
	nodeBtnRule:cc.Node = null
	@property(cc.Node)
	nodeBtnEnter:cc.Node = null
	@property(cc.Node)
	nodeBtnRank:cc.Node = null
	@property(cc.Node)
	nodeBtnSignup:cc.Node = null
	@property(cc.Node)
	nodeBtnSignuped:cc.Node = null
	@property(cc.Node)
	nodeBtnEnd:cc.Node = null

	private matchData_:MatchDefine.tData
	private userRuntime_:MatchDefine.tUserRuntime
	private display_:MatchDefine.tDisplay
	private userSignup_:MatchDefine.tUserSignupRecord
	setData(matchData:MatchDefine.tData,userSignup:MatchDefine.tUserSignupRecord,userRuntime:MatchDefine.tUserRuntime,display:MatchDefine.tDisplay, userCount:number) {
		this.matchData_ = matchData
		this.userRuntime_ = userRuntime
		this.display_ = display
		this.userSignup_ = userSignup
		this.lblMatchName.string = display.list.title || `比赛${matchData.matchID}`
		this.lblValueCount.string = String(matchData.signup[0]?.count || 0)
		this.lblUserCount.string = String(userCount)
		
		this.sprRunning.node.active = false
		this.sprOther.node.active = false
		this.sprOtherEnd.node.active = false
		this.lblRunning.node.active = false
		this.lblOther.node.active = false
		this.lblOtherEnd.node.active = false
		this.lblTimer.node.active = false 
		if(matchData.status == MatchDefine.MatchStatus.Running) {
			this.sprRunning.node.active = true
			this.lblRunning.node.active = true
			this.lblTimer.node.active = true 
		} else if(matchData.status == MatchDefine.MatchStatus.Signup){
			this.sprOther.node.active = true
			this.lblOther.node.active = true
			this.lblTimer.node.active = true 
		} else {
			this.sprOtherEnd.node.active = true
			this.lblOtherEnd.node.active = true
		}
		this.lblTimer.string = moment(matchData.startTime).format("YYYY-MM-DD HH:mm:ss")
		this.nodeBtnEnter.active = false 
		this.nodeBtnSignup.active = false
		this.nodeBtnSignuped.active = false
		this.nodeBtnEnd.active = false
		if(matchData.status == MatchDefine.MatchStatus.Running && this.userRuntime_ && this.userRuntime_.status != MatchDefine.UserMatchStatus.Out) {
			this.nodeBtnEnter.active = true
		} else if(matchData.status == MatchDefine.MatchStatus.Signup && !this.userSignup_) {
			this.nodeBtnSignup.active = true
		} else if(matchData.status == MatchDefine.MatchStatus.Signup && this.userSignup_) {
			this.nodeBtnSignuped.active = true
		} else if(matchData.status == MatchDefine.MatchStatus.Running && this.userRuntime_ && this.userRuntime_.status == MatchDefine.UserMatchStatus.Out) {
			if(this.userRuntime_.enterCount < matchData.maxEnterCount) {
				this.nodeBtnSignup.active = true
			}
		} else if(matchData.status == MatchDefine.MatchStatus.FullyEnded) {
			this.nodeBtnEnd.active = true
		}
	}

	onClickRule() {
		kcore.click.playAudio()
		kcore.ui.push("MatchDetailLayer",this.matchData_.matchID,0)
	}

	async onClickEnter() {
		kcore.click.playAudio()
		let res = await ReqLobby.getMatchRoom({matchID:this.matchData_.matchID})	
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		if(res.roomData) {
			kcore.layer.enterGameByRoomID(res.roomData.roomID)
		} else {
			kcore.tip.push("提示","未找到比赛房间")
		}
	}

	onClickRank() {
		kcore.click.playAudio()
		kcore.ui.push("MatchDetailLayer",this.matchData_.matchID,1)
	}

	private signuping_:boolean = false
	async onClickSignup() {
		kcore.click.playAudio()
		if(this.signuping_) {
			return
		}
		this.signuping_ = true
		try {
			let res = await ReqLobby.matchSignup({matchID:this.matchData_.matchID})
			if(res == null || res.errMsg) {
				kcore.tip.push("提示",res ? res.errMsg : "请求失败")
				return
			}
			kcore.tip.push("提示","报名成功")
			kcore.data.set("lobby/match_refresh",Date.now())
		} finally {
			this.signuping_ = false
		}
	}
}