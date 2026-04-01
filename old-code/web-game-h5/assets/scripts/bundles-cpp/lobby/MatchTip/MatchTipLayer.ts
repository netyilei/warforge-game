import { UIBase } from "../../../core/ui/UIBase"
import { ReqLobby } from "../../../requests/ReqLobby"
import { MatchDefine } from "../../../ServerDefines/MatchDefine"
import { SrsDCN } from "../../../ServerDefines/SrsUserMsg"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/MatchTipLayer")
export default class MatchTipLayer extends UIBase {
	@property(cc.Node)
	nodeLayout:cc.Node = null
	@property(cc.ScrollView)
	view:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	get uiType() {
		return UIType.MatchTip
	}	

	onPush(event:MatchDefine.tUserMatchEvent | MatchDefine.tUserMatchEvent[]): void {
		this.maskPopEnabled = false 
		this.nodeTemplate.active = false 
		if(kcore.api.isArray(event)) {
			for(let e of event as MatchDefine.tUserMatchEvent[]) {
				this.addEvent(e)
			}
		} else {
			this.addEvent(event as MatchDefine.tUserMatchEvent)
		}
	}

	onRePush(event:MatchDefine.tUserMatchEvent | MatchDefine.tUserMatchEvent[]): boolean {
		if(kcore.api.isArray(event)) {
			for(let e of event as MatchDefine.tUserMatchEvent[]) {
				this.addEvent(e)
			}
		} else {
			this.addEvent(event as MatchDefine.tUserMatchEvent)
		}
		return true 
	}

	private matchDatas_:MatchDefine.tData[] = []
	async addEvent(event:MatchDefine.tUserMatchEvent) {
		let matchData = this.matchDatas_.find((data)=>data.matchID == event.matchID)
		if(!matchData) {
			let res = await ReqLobby.getMatchList({
				matchID:event.matchID,
				page:0,
				limit:1,
			})
			if(!this.isValid) {
				return
			}
			matchData = res?.matchDatas ? res.matchDatas[0] : null
			if(matchData) {
				this.matchDatas_.push(matchData)
			} else {
				kcore.toast.push("获取比赛信息失败")
				return
			}
		}
		let node = kcore.display.instantiate(this.nodeTemplate)
		node.active = true
		this.nodeLayout.addChild(node)

		let title = node.childCom("title",cc.Label)
		let content = node.childCom("content",cc.Label)
		switch(event.type) {
			case MatchDefine.UserMatchEventType.ReadyStart:{
				title.string = "比赛即将开始"
				content.string = "您报名的比赛[" + matchData.name + "]即将开始，请准备"
			} break
			case MatchDefine.UserMatchEventType.Start:{
				title.string = "比赛已开始"
				content.string = "您报名的比赛[" + matchData.name + "]已开始，请准备"
			} break
			case MatchDefine.UserMatchEventType.Win:{
				title.string = "比赛已结束"
				content.string = "您在比赛[" + matchData.name + "]中获得了第" + event.rankInfo?.rank + "名，感谢您的参与"
				if(event.rankInfo?.rewards) {
					content.string += "\n奖励已发放到您的账户"
				}
			} break
			case MatchDefine.UserMatchEventType.Lose:{
				title.string = "比赛已结束"
				content.string = "您在比赛[" + matchData.name + "]中获得了第" + event.rankInfo?.rank + "名，感谢您的参与"
			} break
			case MatchDefine.UserMatchEventType.Out:{
				title.string = "比赛已出局"
				content.string = "您在比赛[" + matchData.name + "]中已出局，感谢您的参与"
			} break
			case MatchDefine.UserMatchEventType.Out_NotReady:{
				title.string = "比赛已出局"
				content.string = "您在比赛[" + matchData.name + "]中因未准备已出局，感谢您的参与"
			} break
			case MatchDefine.UserMatchEventType.Out_EnterFailed:{
				title.string = "比赛已出局"
				content.string = "您在比赛[" + matchData.name + "]中因进入失败已出局，感谢您的参与"
			} break 
		}
		// this.view.scrollToBottom()
	}

	onClickClose() {
		this.popSelf()
	}
}