import Decimal from "decimaljs";
import { TexasRule } from "../../bundles/game_texas/TexasDefine";
import { UIBase } from "../../core/ui/UIBase";
import { UIBoardBase } from "../../core/ui/UIBoardBase";
import UIManager from "../../core/ui/UIManager";
import { ReqLobby } from "../../requests/ReqLobby";
import { ReqUser } from "../../requests/ReqUser";
import { GameSet } from "../../ServerDefines/GameSet";
import { GroupDefine } from "../../ServerDefines/GroupDefine";
import { ItemDefine, ItemID } from "../../ServerDefines/ItemDefine";
import { UserDefine } from "../../ServerDefines/UserDefine";


const { ccclass, property, menu } = cc._decorator

const ccGroupLayer_TexasDefine = cc.Class({
	name:"ccGroupLayer_TexasDefine",
	properties:{
		nodeGroup:{
			type:cc.Node,
			default:null,
		},
		lblName:{
			type:cc.Label,
			default:null,
		},
		lblValue:{
			type:cc.Label,
			default:null,
		},
		lblBuyin:{
			type:cc.Label,
			default:null,
		},
		lblBind:{
			type:cc.Label,
			default:null,
		},
		lblUserCount:{
			type:cc.Label,
			default:null,
		},
	}
})
type GroupLayer_TexasDefine = {
	nodeGroup:cc.Node,
	lblName:cc.Label,
	lblValue:cc.Label,
	lblBuyin:cc.Label,
	lblBind:cc.Label,
	lblUserCount:cc.Label,

	// 
	groupID?:number
}
@ccclass
@menu('cpp/lobby/GroupLayer_Texas')
export default class GroupLayer_Texas extends UIBase {
	@property(cc.Label)
	lblGold:cc.Label = null
	@property([ccGroupLayer_TexasDefine])
	defines:GroupLayer_TexasDefine[] = []

	private offsetX_ = 600
	private goldCount_:Decimal
	onPush(...params: any[]): void {
		this.maskPopEnabled = false 
		kcore.data.listenget("user/items",null,this.node,(items:ItemDefine.tItem[])=>{
			let goldItem = items?.find(v=>v.id == ItemID.Gold)
			let goldCount = goldItem ? goldItem.count : 0
			this.goldCount_ = new Decimal(goldCount)
			this.lblGold.string = this.goldCount_.toFixed(2)
		})
		for(let def of this.defines) {
			def.nodeGroup.opacity = 0
			def.nodeGroup.x += this.offsetX_
		}
		this.loadGroups()
	}

	private groups_:GroupDefine.tData[]
	async loadGroups() {
		let res = await ReqLobby.getGroups({gameID:101})
		let groups = res?.groups || []
		groups.sort((a,b)=>a.pri - b.pri)
		this.groups_ = groups
		let delayTime = 0
		for(let i = 0 ; i < this.defines.length ; i ++) {
			let def = this.defines[i]
			let group = groups[i]
			let pos = def.nodeGroup.position2
			pos.x -= this.offsetX_
			def.nodeGroup.runAction(cc.sequence([
				cc.delayTime(delayTime),
				cc.moveTo(0.2,pos).easing(cc.easeSineOut()),
			]))
			def.nodeGroup.runAction(cc.sequence([
				cc.delayTime(delayTime),
				cc.fadeIn(0.2),
			]))
			delayTime += 0.08

			if(def.lblName) {
				def.lblName.string = group?.display?.type || "未开放"
				def.groupID = group?.groupID

				if(group) {
					let gameSet = GameSet.createWithData(group.gameData)
					let iSets = gameSet.iSets
					def.lblBuyin.string = iSets[TexasRule.Group7_MinBuyin] + "-" + iSets[TexasRule.Group8_MaxBuyin]
					if(gameSet.checkRule(TexasRule.Group0,TexasRule.Group0_ANTE)) {
						def.lblBind.string = iSets[TexasRule.Group5_ANTE] + "/" + iSets[TexasRule.Group6_SBlind] +"/" + iSets[TexasRule.Group6_SBlind] * 2
					} else {
						def.lblBind.string = iSets[TexasRule.Group6_SBlind] +"/" + iSets[TexasRule.Group6_SBlind] * 2
					}
					if(group.maxItemCount) {
						def.lblValue.string = group.minItemCount + "-" + group.maxItemCount
					} else {
						def.lblValue.string = "最低" + group.minItemCount
					}
					def.lblUserCount.string = kcore.utils.intRandomRange(1000,10000).toString()
				} else {
					def.lblValue.string = "--"
					def.lblBuyin.string = "--"
					def.lblBind.string = "--"
					def.lblUserCount.string = "--"
				}
			}
		} 
	}

	onClickGroup(_,str) {
		kcore.click.playAudio()
		let idx = parseInt(str)
		let def = this.defines[idx]
		if(!def.lblName) {
			this.popSelf()
			kcore.data.set("lobby/tab",1)
			return 
		}
		if(def.groupID) {
			let group = this.groups_.find(v=>v.groupID == def.groupID)
			let items:ItemDefine.tItem[] = kcore.data.get("user/items",[])
			let item = items.find(v=>v.id == group.itemID)

			let itemCount = new Decimal(item?.count || "0")
			let min = new Decimal(group.minItemCount || "0")
			let max = new Decimal(group.maxItemCount || "0")

			if(min.greaterThan(0) && itemCount.lessThan(min)) {
				kcore.toast.push(`金币不足`)
				return 
			}
			if(max.greaterThan(0) && itemCount.greaterThan(max)) {
				kcore.toast.push(`金币太多`)
				return 
			}
			kcore.ui.push("EnterGroupLayer",def.groupID)
		} else {
			kcore.toast.push("暂未开放")
		}
	}

	onClickBack() {
		kcore.click.playAudio()
		this.popSelf()
	}

	onClickMatch() {
		kcore.click.playAudio()
		this.popSelf()
		kcore.data.set("lobby/tab",1)
	}

	onClickMailBox() {
		kcore.click.playAudio()
		kcore.ui.push("MailListLayer")
	}

	onClickCreate() {
		kcore.click.playAudio()
		kcore.ui.push("CreateGameLayer")
	}

	onClickJoin() {
		kcore.click.playAudio()
		kcore.ui.push("EnterCodeLayer")
	}

	onClickFast() {
		kcore.click.playAudio()
		for(let group of this.groups_) {
			let min = new Decimal(group.minItemCount || "0")
			let max = new Decimal(group.maxItemCount || "0")
			if(this.goldCount_.greaterThanOrEqualTo(min) && (max.equals(0) || this.goldCount_.lessThanOrEqualTo(max))) {
				kcore.ui.push("EnterGroupLayer",group.groupID)
				return 
			}
		}
	}
	onClickCharge() {
		kcore.click.playAudio()
		kcore.ui.push("ChargeLayer")
	}
}
