import { UIBase } from "../../core/ui/UIBase";
import ItemUtils from "../../core/utils/ItemUtils";
import { ReqLobby } from "../../requests/ReqLobby";
import { MatchDefine } from "../../ServerDefines/MatchDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import MatchDetailRankWidget from "./widgets/MatchDetailRankWidget";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/MatchDetailLayer")
export default class MatchDetailLayer extends UIBase {
	@property([ButtonCheckBox])
	checks:ButtonCheckBox[] = []
	@property(cc.ScrollView)
	listRank:cc.ScrollView = null	
	@property(cc.ScrollView)
	listReward:cc.ScrollView = null	
	@property(cc.Node)
	nodeRule:cc.Node = null
	@property(cc.Node)
	nodeRank:cc.Node = null
	@property(cc.Node)
	nodeReward:cc.Node = null

	@property(cc.Node)
	nodeLayoutRule:cc.Node = null
	@property(cc.Node)
	nodeTemplateRuleContent:cc.Node = null
	@property(cc.Node)
	nodeTemplateRuleImage:cc.Node = null
	@property(cc.Node)
	nodeTemplateRank:cc.Node = null
	@property(cc.Node)
	nodeTemplateReward:cc.Node = null

	@property(cc.Node)
	nodeBtnSignup:cc.Node = null
	@property(cc.Node)
	nodeBtnSignuped:cc.Node = null
	@property(cc.Node)
	nodeBtnEnter:cc.Node = null
	@property(cc.Node)
	nodeBtnEnd:cc.Node = null
	private matchID_:number
	onPush(matchID:number,tab:number): void {
		this.matchID_ = matchID
		this.nodeTemplateRuleContent.active = false
		this.nodeTemplateRuleImage.active = false
		this.nodeTemplateRank.active = false
		this.nodeTemplateReward.active = false
		for(let check of this.checks) {
			check.isChecked = false
			check.setFunc(()=>{
				this.onToggleChanged(this.checks.indexOf(check))
			})
		}
		this.onToggleChanged(tab || 0)
		this.loadData()
	}

	private matchData_:MatchDefine.tData
	private matchDisplay_:MatchDefine.tDisplay
	private matchUserRuntime_:MatchDefine.tUserRuntime
	private matchReward_:MatchDefine.tReward
	private matchSignup_:MatchDefine.tUserSignupRecord

	async loadData() {
		let res = await ReqLobby.getMatchFullDisplay({matchID:this.matchID_})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			this.popSelf()
			return
		}
		if(!this.isValid) {
			return 
		}

		this.matchData_ = res.matchData
		this.matchDisplay_ = res.display
		this.matchUserRuntime_ = res.runtime
		this.matchReward_ = res.reward	
		this.matchSignup_ = res.userSignup


		
		this.nodeBtnEnter.active = false 
		this.nodeBtnSignup.active = false
		this.nodeBtnSignuped.active = false
		this.nodeBtnEnd.active = false
		if(this.matchData_.status == MatchDefine.MatchStatus.Running && this.matchUserRuntime_ && this.matchUserRuntime_.status != MatchDefine.UserMatchStatus.Out) {
			this.nodeBtnEnter.active = true
		} else if(this.matchData_.status == MatchDefine.MatchStatus.Signup && !this.matchSignup_) {
			this.nodeBtnSignup.active = true
		} else if(this.matchData_.status == MatchDefine.MatchStatus.Signup && this.matchSignup_) {
			this.nodeBtnSignuped.active = true
		} else if(this.matchData_.status == MatchDefine.MatchStatus.Running && this.matchUserRuntime_ && this.matchUserRuntime_.status == MatchDefine.UserMatchStatus.Out) {
			if(this.matchUserRuntime_.enterCount < this.matchData_.maxEnterCount) {
				this.nodeBtnSignup.active = true
			}
		} else if(this.matchData_.status == MatchDefine.MatchStatus.FullyEnded) {
			this.nodeBtnEnd.active = true
		}

		this.nodeLayoutRule.destroyAllChildren()
		for(let rule of this.matchDisplay_.rules) {
			if(rule.content) {
				let node = kcore.display.instantiate(this.nodeTemplateRuleContent)
				node.active = true 
				let lbl = node.getComponent(cc.Label)
				lbl.string = rule.content
				this.nodeLayoutRule.addChild(node)
			}
			if(rule.iconUrl) {
				let node = kcore.display.instantiate(this.nodeTemplateRuleImage)
				node.active = true 
				this.nodeLayoutRule.addChild(node)
				let sp = node.getComponentInChildren(cc.Sprite)
				kcore.display.setWebTextureStyle(sp,rule.iconUrl,{
					style:"active",
					func:(frame)=>{
						if(!this.isValid) {
							return
						}
						if(frame) {
							sp.node.opacity = 0
							sp.node.runAction(cc.fadeIn(0.2))
						}
					}
				})
			}
		}
		this.listReward.content.destroyAllChildren()
		for(let i = 0 ; i < this.matchReward_.ranks.length ; i ++) {
			let rewardItem = this.matchReward_.ranks[i]
			let node = kcore.display.instantiate(this.nodeTemplateReward)
			node.active = true
			this.listReward.content.addChild(node)

			let rankNormal = node.childCom("rank_normal",cc.Label)
			let rewardNormal = node.childCom("reward_normal",cc.Label)
			let rank1 = node.childCom("rank_1",cc.Label)
			let reward1 = node.childCom("reward_1",cc.Label)

			if(i == 0) {
				rankNormal.node.active = false
				rewardNormal.node.active = false
				rank1.node.active = true
				reward1.node.active = true
				rank1.string = rewardItem.minRank + "-" + rewardItem.maxRank
				reward1.string = rewardItem.items.map(v=>v.count + ItemUtils.getItemConfigSync(v.itemID)?.name).join(",")
			} else {
				rankNormal.node.active = true
				rewardNormal.node.active = true
				rank1.node.active = false
				reward1.node.active = false
				rankNormal.string = rewardItem.minRank + "-" + rewardItem.maxRank
				rewardNormal.string = rewardItem.items.map(v=>v.count + ItemUtils.getItemConfigSync(v.itemID)?.name).join(",")
			}
		}
		this.onToggleChanged(this.tab_)
	}

	private tab_:number = 0
	private callerRank_:kcore.PageLimitCaller<any>
	onToggleChanged(activeIndex:number) {
		this.tab_ = activeIndex
		this.nodeRule.active = (activeIndex == 0)
		this.nodeRank.active = (activeIndex == 1)
		this.nodeReward.active = (activeIndex == 2)
		for(let i = 0 ; i < this.checks.length ; i ++) {
			let check = this.checks[i]
			check.isChecked = (i == activeIndex)
		}
		if(!this.matchData_) {
			return 
		}
		switch(activeIndex) {
			case 0:
				//规则
				break
			case 1:
				//排行
				if(!this.callerRank_) {
					this.callerRank_ = kcore.PageLimitCaller.createListViewEx<any>({
						loadStep:20,
						loadNow:false,
						view:this.listRank,
						itemPrefab:()=>{
							let node = kcore.display.instantiate(this.nodeTemplateRank)
							node.active = true 
							return node 
						},
						func:(idx,data,node)=>{
							let com = node.getComponent(MatchDetailRankWidget)
							if(this.matchData_.status == MatchDefine.MatchStatus.FullyEnded) {
								let rank:MatchDefine.tUserRank = data 
								com.setRank(idx,rank)
							} else {
								let runtime:MatchDefine.tUserRuntime = data 
								com.setRuntime(idx,runtime)
							}
						},
						funcLoadCursor:null,
					})
				}
				if(this.matchData_.status == MatchDefine.MatchStatus.FullyEnded) {
					this.callerRank_.funcLoadCursor = async (cursor)=>{
						let res = await ReqLobby.getMatchRank({
							matchID:this.matchID_,
							page:cursor.page,
							limit:cursor.limit,
						})
						if(res == null || res.errMsg) {
							kcore.tip.push("提示",res ? res.errMsg : "请求失败")
							return null
						}
						return {
							datas:res.datas,
							count:res.count,
						}
					}
				} else {
					this.callerRank_.funcLoadCursor = async (cursor)=>{
						let res = await ReqLobby.getMatchRuntimeRank({
							matchID:this.matchID_,
							page:cursor.page,
							limit:cursor.limit,
						})
						if(res == null || res.errMsg) {
							kcore.tip.push("提示",res ? res.errMsg : "请求失败")
							return null
						}
						return {
							datas:res.datas,
							count:res.count,
						}
					}
				}
				this.callerRank_.clear()
				this.callerRank_.load(0)
				break
			case 2:
				//奖励
				break
		}
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
			this.loadData()
		} finally {
			this.signuping_ = false
		}
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
}