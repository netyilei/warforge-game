import { ReqLobby } from "../../../requests/ReqLobby";
import { MatchDefine } from "../../../ServerDefines/MatchDefine";
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox";
import LobbyControl_Base from "./LobbyControl_Base";
import MatchItemWidget from "./MatchItemWidget";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/LobbyControl_Match')
export default class LobbyControl_Match extends LobbyControl_Base {
	@property(cc.Node)
	nodeAniMatch:cc.Node = null
	@property(cc.Node)
	nodeAniMatchEN:cc.Node = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property(cc.ScrollView)
	listMatch:cc.ScrollView = null
	@property([ButtonCheckBox])
	checks:ButtonCheckBox[] = []

	start() {
		let langKey = kcore.data.get("langKey")
		if(!langKey || langKey == "en_US") {
			this.nodeAniMatch.active = false
			this.nodeAniMatchEN.active = true
		} else {
			this.nodeAniMatch.active = true
			this.nodeAniMatchEN.active = false
		}
		this.nodeTemplate.active = false 
		for(let i = 0 ; i < this.checks.length ; i ++) {
			let check = this.checks[i]
			check.isChecked = false
			check.setFunc(()=>{
				this.onToggleChanged(i)
			})
		}
		this.onToggleChanged(0)
		kcore.data.listen("lobby/match_refresh",this.node,()=>{
			this.refreshMatchList()
		})
	}
	onToggleChanged(activeIndex:number) {
		for(let i = 0 ; i < this.checks.length ; i ++) {
			let check = this.checks[i]
			check.isChecked = (i == activeIndex)
		}
		this.refreshMatchList()
	}

	onFocus(b: boolean): void {
		b && this.refreshMatchList()
	}

	private caller_:kcore.PageLimitCaller<MatchDefine.tData>
	private matchExts_:{
		matchID:number,
		display:MatchDefine.tDisplay,
		userRuntime:MatchDefine.tUserRuntime,
		reward:MatchDefine.tReward,
		userSignup:MatchDefine.tUserSignupRecord,
		userCount:number,
	}[] = []
	async refreshMatchList() {
		let idx = this.checks.findIndex(v=>v.isChecked)
		if(!this.caller_) {
			this.caller_ = kcore.PageLimitCaller.createListViewEx<MatchDefine.tData>({
				loadStep:20,
				loadNow:false,
				view:this.listMatch,
				itemPrefab:()=>{
					let node = kcore.display.instantiate(this.nodeTemplate)
					node.active = true 
					return node 
				},
				func:(idx,data,node)=>{
					let com = node.getComponent(MatchItemWidget)
					let userRuntime = this.matchExts_.find(v=>v.matchID == data.matchID)?.userRuntime
					let display = this.matchExts_.find(v=>v.matchID == data.matchID)?.display
					let userCount = this.matchExts_.find(v=>v.matchID == data.matchID)?.userCount || 0
					let userSignup = this.matchExts_.find(v=>v.matchID == data.matchID)?.userSignup
					com.setData(data,userSignup,userRuntime,display,userCount)
				},
				funcLoadCursor:null,
			})
		}
		this.matchExts_.splice(0)
		switch(idx) {
			case 0: {	// 即将开始
				this.caller_.funcLoadCursor = async (cursor)=>{
					let res = await ReqLobby.getMatchList({
						statuss:[MatchDefine.MatchStatus.Signup,MatchDefine.MatchStatus.Running],
						page:cursor.page,
						limit:cursor.limit,
					})
					if(res == null || res.errMsg) {
						kcore.tip.push("提示",res ? res.errMsg : "请求失败")
						return null
					}
					for(let data of res.matchDatas) {
						let display = res.displays.find(v=>v.matchID == data.matchID)
						let userRuntime = res.userRuntimes.find(v=>v.matchID == data.matchID)
						let reward = res.rewards.find(v=>v.matchID == data.matchID)
						let userCount = res.userCounts[data.matchID] || 0
						this.matchExts_.push({
							matchID:data.matchID,
							display:display,
							userRuntime:userRuntime,
							reward:reward,
							userSignup:res.userSignups.find(v=>v.matchID == data.matchID),
							userCount:userCount,
						})
					}
					return {
						count:res.count,
						datas:res.matchDatas,
					}
				}
			} break
			case 1: {	// 已结束
				this.caller_.funcLoadCursor = async (cursor)=>{
					let res = await ReqLobby.getMatchList({
						status:MatchDefine.MatchStatus.FullyEnded,
						page:cursor.page,
						limit:cursor.limit,
					})
					if(res == null || res.errMsg) {
						kcore.tip.push("提示",res ? res.errMsg : "请求失败")
						return null
					}
					for(let data of res.matchDatas) {
						let display = res.displays.find(v=>v.matchID == data.matchID)
						let userRuntime = res.userRuntimes.find(v=>v.matchID == data.matchID)
						let reward = res.rewards.find(v=>v.matchID == data.matchID)
						this.matchExts_.push({
							matchID:data.matchID,
							display:display,
							userRuntime:userRuntime,
							reward:reward,
							userSignup:res.userSignups.find(v=>v.matchID == data.matchID),
							userCount:res.userCounts[data.matchID] || 0,
						})
					}
					return {
						count:res.count,
						datas:res.matchDatas,
					}
				}
			} break
			case 2: {	// 我的赛事
				this.caller_.funcLoadCursor = async (cursor)=>{
					let res = await ReqLobby.getMatchList({
						self:true,
						page:cursor.page,
						limit:cursor.limit,
					})
					if(res == null || res.errMsg) {
						kcore.tip.push("提示",res ? res.errMsg : "请求失败")
						return null
					}
					for(let data of res.matchDatas) {
						let display = res.displays.find(v=>v.matchID == data.matchID)
						let userRuntime = res.userRuntimes.find(v=>v.matchID == data.matchID)
						let reward = res.rewards.find(v=>v.matchID == data.matchID)
						this.matchExts_.push({
							matchID:data.matchID,
							display:display,
							userRuntime:userRuntime,
							reward:reward,
							userSignup:res.userSignups.find(v=>v.matchID == data.matchID),
							userCount:res.userCounts[data.matchID] || 0,
						})
					}
					return {
						count:res.count,
						datas:res.matchDatas,
					}
				}
			} break
		}
		this.caller_.clear()
		this.caller_.load(0)
	}
}