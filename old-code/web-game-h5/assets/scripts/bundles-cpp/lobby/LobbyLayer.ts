import Decimal from "decimaljs";
import { UIBase } from "../../core/ui/UIBase";
import { UIBoardBase } from "../../core/ui/UIBoardBase";
import BagUtils from "../../core/utils/BagUtils";
import { DCN } from "../../core/web/DCN";
import { ItemDefine, ItemID } from "../../ServerDefines/ItemDefine";
import { UserDefine } from "../../ServerDefines/UserDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import LobbyControl_Base from "./widgets/LobbyControl_Base";
import UserUtils from "../../core/utils/UserUtils";
import { Config } from "../../core/Config";
import { ReqUser } from "../../requests/ReqUser";
import { ReqTest } from "../../requests/ReqTest";
import { NewsDefine } from "../../ServerDefines/NewsDefine";
import { ReqLobby } from "../../requests/ReqLobby";


const { ccclass, property, menu } = cc._decorator

const ccLobbyControlDefine = cc.Class({
	name:"ccLobbyControlDefine",
	properties:{
		nodeRoot:{
			type:cc.Node,
			default:null,
		},
		check:{
			type:ButtonCheckBox, 
			default:null,
		},
		control:{
			type:LobbyControl_Base,
			default:null,
		},
	}
})
type LobbyControlDefine = {
	nodeRoot:cc.Node,
	check:ButtonCheckBox,
	control:LobbyControl_Base,
}
@ccclass
@menu("cpp/LobbyLayer")
export default class LobbyLayer extends UIBoardBase {

	@property([ccLobbyControlDefine])
	lobbyControls:LobbyControlDefine[] = []
	@property(cc.AudioClip)
	clipBG:cc.AudioClip = null

	onPush(...params: any[]): void {
		this.clipBG && kcore.audio.playMusicClip(this.clipBG)
		for(let i = 0 ; i < this.lobbyControls.length ; i ++) {
			let def = this.lobbyControls[i]
			def.nodeRoot.active = false 
			def.check.setFunc(()=>{
				this.onToggleChanged(i)
			})
		}
		this.lobbyControls[0].check.isChecked = true
		this.onToggleChanged(0,true)

		kcore.data.listen("lobby/tab",this.node,(idx)=>{
			this.onToggleChanged(idx)
		})
	}


	private activeDef_:LobbyControlDefine = null
	onToggleChanged(idx:number,first?:boolean) {
		kcore.data.set("lobby/tab",idx,true)
		this.activeDef_ = this.lobbyControls[idx]
		for(let def of this.lobbyControls) {
			def.check.isChecked = def == this.activeDef_
			def.nodeRoot.stopAllActions()
		}
		for(let def of this.lobbyControls) {
			if(def != this.activeDef_) {
				if(def.nodeRoot.active && !first) {
					def.nodeRoot.runAction(cc.sequence([
						cc.fadeOut(0.2),
						cc.callFunc(()=>{
							def.nodeRoot.active = this.activeDef_ == def 
						})
					]))
				} else {
					def.nodeRoot.active = false 
					!first && def.control.onFocus(false)
				}
			} else {
				if(!def.nodeRoot.active && !first) {
					def.nodeRoot.active = true 
					def.nodeRoot.opacity = 0
					def.nodeRoot.runAction(cc.sequence([
						cc.fadeIn(0.2),
						cc.callFunc(()=>{
							def.nodeRoot.active = this.activeDef_ == def 
						})
					]))
					def.control.onFocus(true)
				} else {
					def.nodeRoot.active = true 
					def.control.onFocus(true)
				}
			}
		}
	}

	onClickCustomer() {
		kcore.click.playAudio()
		kcore.ui.push("CustomerLayer")
	}

	onClickMailBox() {
		kcore.click.playAudio()
		kcore.ui.push("MailListLayer")
	}

	onClickCharge() {
		kcore.click.playAudio()
		kcore.ui.push("ChargeLayer")
	}
	onClickSelf() {
		kcore.click.playAudio()
		this.onToggleChanged(2)
	}
	onClickTestCharge() {
		kcore.click.playAudio()
		ReqTest.addValue({
			itemID:ItemID.Gold,
			value:"1000",
		})
	}
}