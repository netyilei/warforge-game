import { ReqLobby } from "../../requests/ReqLobby"
import { MatchDefine } from "../../ServerDefines/MatchDefine"
import { SrsDCN } from "../../ServerDefines/SrsUserMsg"
import { DCN } from "../web/DCN"


const { ccclass, property, menu } = cc._decorator


@ccclass
export default class MatchUtils extends cc.Component {
	@property()
	uiLayerName = "MatchTipLayer"
	private static instance_:MatchUtils
	static get instance() {
		return MatchUtils.instance_
	}
	protected onLoad() {
		MatchUtils.instance_ = this 
	}
	private dcnInited_ = false 
	initDCN() {
		if(this.dcnInited_) {
			return 
		}
		DCN.unlisten(SrsDCN.matchEnterRoom(),this.node)
		DCN.listen(SrsDCN.matchEnterRoom(),this.node,(msg:SrsDCN.tMatchEnterRoom)=>{
			if(kroom.env.gameLayer && kroom.env.gameLayer.roomID != msg.roomID) {
				kcore.tip.push("提示","比赛房间已开始，请重新进入比赛")
				return 
			}
			kcore.layer.enterGameByRoomID(msg.roomID)
		})

		DCN.unlisten(SrsDCN.matchEvent(),this.node)
		DCN.listen(SrsDCN.matchEvent(),this.node,(msg:SrsDCN.tMatchEvent)=>{
			kcore.data.set("match/event",msg.event)
		})

		kcore.data.listen("match/event",this.node,async (event:MatchDefine.tUserMatchEvent)=>{
			this.uiLayerName && event && kcore.ui.push(this.uiLayerName,event)
		})
	}
	onLogined(events?:MatchDefine.tUserMatchEvent[]) {
		this.initDCN()
		this.dcnInited_ = true
		if(events && events.length > 0) {
			kcore.ui.push(this.uiLayerName,events)
		}
	}

}