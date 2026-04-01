import { TexasRule } from "../../bundles/game_texas/TexasDefine";
import Foldout from "../../core/ui/Foldout";
import ProgressBlock from "../../core/ui/ProgressBlock";
import { UIBase } from "../../core/ui/UIBase";
import { GameConfig_Texas } from "../../games/GameConfig_Texas";
import { ReqLobby } from "../../requests/ReqLobby";
import { GameSet } from "../../ServerDefines/GameSet";
import { ItemID } from "../../ServerDefines/ItemDefine";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/CreateGameLayer')
export default class CreateGameLayer extends UIBase {
	@property(cc.Label)
	lblBlind:cc.Label = null
	@property(cc.Label)
	lblStraddle:cc.Label = null
	@property(cc.Label)
	lblBuyin:cc.Label = null
	@property(cc.Label)
	lblMaxBuyin:cc.Label = null
	@property(cc.Label)
	lblLastHour:cc.Label = null
	@property(cc.Label)
	lblTimeout:cc.Label = null
	@property(Foldout)
	foldoutANTE:Foldout = null
	@property(ButtonCheckBox)
	checkStraddle:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkDoubleBlind:ButtonCheckBox = null	
	@property(ButtonCheckBox)
	checkShort:ButtonCheckBox = null

	@property(ProgressBlock)
	barBind:ProgressBlock = null
	@property(ProgressBlock)
	barBuyin:ProgressBlock = null
	@property(ProgressBlock)
	barMaxBuyin:ProgressBlock = null
	@property(ProgressBlock)
	barLastHour:ProgressBlock = null
	@property(cc.Node)
	nodeLayoutLastHour:cc.Node = null
	@property(ProgressBlock)
	barTimeout:ProgressBlock = null
	@property(cc.Node)
	nodeLayoutTimeout:cc.Node = null

	onPush(...params: any[]): void {
		this.maskPopEnabled = false 
		this.checkDoubleBlind.setFunc(()=>{
			this.onWidgetChanged()
		})
		this.checkStraddle.setFunc(()=>{
			this.onWidgetChanged()
		})
		this.checkShort.setFunc(()=>{
			this.onWidgetChanged()
		})

		this.barBind.funcChanged = ()=>{
			this.onWidgetChanged()
		}
		this.barBuyin.funcChanged = ()=>{
			this.onWidgetChanged()
		}
		this.barMaxBuyin.funcChanged = ()=>{
			this.onWidgetChanged()
		}
		this.barLastHour.funcChanged = ()=>{
			this.onWidgetChanged()
		}
		this.barTimeout.funcChanged = ()=>{
			this.onWidgetChanged()
		}
		this.gameSet_ = new GameSet(GameConfig_Texas.gameID)
		this.gameSet_.setScore(1)
		this.gameSet_.setPayType(RoomDefine.makePayType(RoomDefine.PayType.Item,parseInt(ItemID.Gold)))
		this.gameSet_.setUserCount(GameConfig_Texas.config.lobby_setting.user_count[0])
		
		let level = CreateGameConfigs.BlindLevels[0]
		this.foldoutANTE.setup(level.antes.map(v=>v + ""),0,()=>{
			this.onWidgetChanged()
		})
		this.gameSet_.setISet(TexasRule.Group3_Timeout,CreateGameConfigs.Timeouts[Math.floor(CreateGameConfigs.Timeouts.length / 2)])
		this.gameSet_.setISet(TexasRule.Group4_LastSeconds,CreateGameConfigs.LastHours[Math.floor(CreateGameConfigs.LastHours.length / 2)] * 3600)

		this.onGameSetChanged()
	}

	private gameSet_:GameSet
	private prevSB_:number
	onWidgetChanged() {
		let levelLength = CreateGameConfigs.BlindLevels.length
		let per = this.barBind.bar.progress
		let idx = Math.floor(per * levelLength)
		if(idx >= levelLength) {
			idx = levelLength - 1
		}
		let level = CreateGameConfigs.BlindLevels[idx]
		if(this.prevSB_ != level.sb) {
			this.prevSB_ = level.sb
			this.foldoutANTE.changeContents(level.antes.map(v=>v + ""))
		}
		this.gameSet_.setISet(TexasRule.Group6_SBlind,level.sb)
		if(this.checkStraddle.isChecked) {
			this.lblStraddle.string = level.straddle + ""
			this.gameSet_.addRule(TexasRule.Group0,TexasRule.Group0_Straddle)
		} else {
			this.lblStraddle.string = level.straddle + ""
			this.gameSet_.removeRule(TexasRule.Group0,TexasRule.Group0_Straddle)
		}

		if(this.checkDoubleBlind.isChecked) { 
			this.lblBlind.string = level.bb + "/" + level.bb
			this.gameSet_.addRule(TexasRule.Group0,TexasRule.Group0_DoubleBB)
		} else {
			this.lblBlind.string = level.sb + "/" + level.bb
			this.gameSet_.removeRule(TexasRule.Group0,TexasRule.Group0_DoubleBB)
		}

		let anteIdx = this.foldoutANTE.idx
		let ante = level.antes[anteIdx] || 0
		this.gameSet_.setISet(TexasRule.Group5_ANTE,ante)
		if(ante > 0) {
			this.gameSet_.addRule(TexasRule.Group0,TexasRule.Group0_ANTE)
		} else {
			this.gameSet_.removeRule(TexasRule.Group0,TexasRule.Group0_ANTE)
		}

		if(this.checkShort.isChecked) {
			this.gameSet_.addRule(TexasRule.Group1,TexasRule.Group1_Short)
			this.gameSet_.removeRule(TexasRule.Group1,TexasRule.Group1_Long)
		} else {
			this.gameSet_.removeRule(TexasRule.Group1,TexasRule.Group1_Short)
			this.gameSet_.addRule(TexasRule.Group1,TexasRule.Group1_Long)
		}

		{
			let per = this.barBuyin.bar.progress
			let minBuyin = level.minBuyinMin + Math.floor(per * (level.minBuyinMax - level.minBuyinMin))
			this.lblBuyin.string = minBuyin + ""
			this.gameSet_.setISet(TexasRule.Group7_MinBuyin,minBuyin)
		}
		{
			let per = this.barMaxBuyin.bar.progress
			let maxBuyin = level.maxBuyinMin + Math.floor(per * (level.maxBuyinMax - level.maxBuyinMin))
			this.lblMaxBuyin.string = maxBuyin + ""
			this.gameSet_.setISet(TexasRule.Group8_MaxBuyin,maxBuyin)
		}
		{
			let blockPos = this.barLastHour.nodeBlock.convertToWorldSpaceAR(cc.Vec2.ZERO)
			let localPos = this.nodeLayoutLastHour.parent.convertToNodeSpaceAR(blockPos)
			let idx = 0
			for(let i = 0 ; i < this.nodeLayoutLastHour.childrenCount ; i ++) {
				let child = this.nodeLayoutLastHour.children[i]
				if(localPos.x >= child.x) {
					idx = i
				} else {
					break
				}
			}
			let hour = CreateGameConfigs.LastHours[idx]
			this.lblLastHour.string = hour + "小时"
			this.gameSet_.setISet(TexasRule.Group4_LastSeconds, hour * 3600)
		}

		{
			let blockPos = this.barTimeout.nodeBlock.convertToWorldSpaceAR(cc.Vec2.ZERO)
			let localPos = this.nodeLayoutTimeout.parent.convertToNodeSpaceAR(blockPos)
			let idx = 0
			for(let i = 0 ; i < this.nodeLayoutTimeout.childrenCount ; i ++) {
				let child = this.nodeLayoutTimeout.children[i]
				if(localPos.x >= child.x) {
					idx = i
				} else {
					break
				}
			}
			let timeout = CreateGameConfigs.Timeouts[idx]
			if(timeout == 0) {
				this.lblTimeout.string = "不限制"
			} else {
				this.lblTimeout.string = timeout + "秒"
			}
			this.gameSet_.setISet(TexasRule.Group3_Timeout, timeout)
		}
	}

	onGameSetChanged() {
		let isets = this.gameSet_.iSets
		let sb = isets[TexasRule.Group6_SBlind]
		let bb = sb * 2
		let level = CreateGameConfigs.BlindLevels.find((level)=>{
			return level.sb == sb && level.bb == bb
		}) || CreateGameConfigs.BlindLevels[0]
		let levelIdx = CreateGameConfigs.BlindLevels.indexOf(level)
		let levelLength = CreateGameConfigs.BlindLevels.length
		this.barBind.bar.progress = cc.misc.clamp01(levelIdx / (levelLength - 1))

		this.gameSet_.setISet(TexasRule.Group6_SBlind,level.sb)
		let straddle = isets[TexasRule.Group9_Straddle]
		if(straddle != level.straddle) {
			this.gameSet_.setISet(TexasRule.Group9_Straddle,level.straddle)
		}
		this.checkStraddle.isChecked = this.gameSet_.checkRule(TexasRule.Group0,TexasRule.Group0_Straddle)
		this.checkDoubleBlind.isChecked = this.gameSet_.checkRule(TexasRule.Group0,TexasRule.Group0_DoubleBB)
		this.checkShort.isChecked = this.gameSet_.checkRule(TexasRule.Group1,TexasRule.Group1_Short)
		let ante = isets[TexasRule.Group5_ANTE]
		let anteIdx = level.antes.indexOf(ante)
		if(anteIdx < 0) {
			anteIdx = 0
		}
		this.foldoutANTE.idx = anteIdx
		ante = level.antes[anteIdx] || 0
		this.gameSet_.setISet(TexasRule.Group5_ANTE,ante)
		if(ante > 0) {
			this.gameSet_.addRule(TexasRule.Group0,TexasRule.Group0_ANTE)
		} else {
			this.gameSet_.removeRule(TexasRule.Group0,TexasRule.Group0_ANTE)
		}
		let minBuyin = isets[TexasRule.Group7_MinBuyin]
		let maxBuyin = isets[TexasRule.Group8_MaxBuyin]
		this.barBuyin.bar.progress = cc.misc.clamp01((minBuyin - level.minBuyinMin) / (level.minBuyinMax - level.minBuyinMin))
		this.barMaxBuyin.bar.progress = cc.misc.clamp01((maxBuyin - level.maxBuyinMin) / (level.maxBuyinMax - level.maxBuyinMin))
		let lastSeconds = isets[TexasRule.Group4_LastSeconds]
		let lastHour = Math.floor(lastSeconds / 3600)
		let lastHourIdx = CreateGameConfigs.LastHours.indexOf(lastHour)
		if(lastHourIdx < 0) {
			lastHourIdx = 0
		}
		this.barLastHour.bar.progress = cc.misc.clamp01(lastHourIdx / (CreateGameConfigs.LastHours.length - 1))
		let timeout = isets[TexasRule.Group3_Timeout]
		let timeoutIdx = CreateGameConfigs.Timeouts.indexOf(timeout)
		if(timeoutIdx < 0) {
			timeoutIdx = 0
		}
		this.barTimeout.bar.progress = cc.misc.clamp01(timeoutIdx / (CreateGameConfigs.Timeouts.length - 1))
		
		this.onWidgetChanged()
	}

	private creating_ = false 
	async onClickCreate() {
		kcore.click.playAudio()
		if(this.creating_) {
			return
		}
		this.creating_ = true
		let res = await ReqLobby.createRoom({
			gameData:this.gameSet_.gameData,
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			this.creating_ = false
			return
		}
		kcore.toast.push("房间创建成功，正在进入房间...")
		if(CC_DEV) {
			kcore.storage.setValue("dev_cache_roomid",res.roomData.roomID)
		}
		kcore.layer.enterGameByRoomID(res.roomData.roomID)
	}
}

namespace CreateGameConfigs {
	export let BlindLevels:{
		sb:number,bb:number,straddle:number,antes:number[],
		minBuyinMin,minBuyinMax,
		maxBuyinMin,maxBuyinMax,
	}[] = [
		{
			sb:1,bb:2,straddle:2,antes:[0,1,3,4,6,8],
			minBuyinMin:100,minBuyinMax:200,
			maxBuyinMin:400,maxBuyinMax:800,
		},
		{
			sb:2,bb:4,straddle:4,antes:[0,1,2,4,6,8,12],
			minBuyinMin:200,minBuyinMax:400,
			maxBuyinMin:800,maxBuyinMax:1600,
		},
		{
			sb:3,bb:6,straddle:6,antes:[0,1,2,3,6,9,12],
			minBuyinMin:300,minBuyinMax:600,
			maxBuyinMin:1200,maxBuyinMax:2400,
		},
		{
			sb:4,bb:8,straddle:8,antes:[0,1,2,4,8,12,16],
			minBuyinMin:400,minBuyinMax:800,
			maxBuyinMin:1600,maxBuyinMax:3200,
		},
		{
			sb:5,bb:10,straddle:10,antes:[0,1,2,5,10,15,20],
			minBuyinMin:500,minBuyinMax:1000,
			maxBuyinMin:2000,maxBuyinMax:4000,
		},
		{
			sb:8,bb:16,straddle:16,antes:[0,1,2,4,8,16,24,32],
			minBuyinMin:800,minBuyinMax:1600,
			maxBuyinMin:3200,maxBuyinMax:6400,
		},
		{
			sb:10,bb:20,straddle:20,antes:[0,2,4,8,10,20,30,40],
			minBuyinMin:1000,minBuyinMax:2000,
			maxBuyinMin:4000,maxBuyinMax:8000,
		},
		{
			sb:20,bb:40,straddle:40,antes:[0,4,8,16,20,40,60,80],
			minBuyinMin:2000,minBuyinMax:4000,
			maxBuyinMin:8000,maxBuyinMax:16000,
		}
	]

	export let LastHours = [0.5,1,1.5,2,2.5,3,4,6,8]
	export let Timeouts = [0,15,30,60]
}