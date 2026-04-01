import Decimal from "decimaljs";
import { UIBase } from "../../core/ui/UIBase";
import UILeftAction from "../../core/ui/UILeftAction";
import { ReqLobby } from "../../requests/ReqLobby";
import { ItemDefine } from "../../ServerDefines/ItemDefine";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import { UserDefine } from "../../ServerDefines/UserDefine";
import TexasGameLayer from "./TexasGameLayer";

const { ccclass, property, menu } = cc._decorator


@ccclass
export default class TexasGameMenuLayer extends UILeftAction {
	@property(cc.Node)
	nodeBtnJiesan:cc.Node = null

	get gameLayer() {
		return <TexasGameLayer>kroom.env.gameLayer
	}

	onPush(...params: any[]): void {
		switch(this.gameLayer.roomInfo.roomType) {
			case RoomDefine.RoomType.Group:{
				this.nodeBtnJiesan.active = false
			} break 
			case RoomDefine.RoomType.Match:{
				this.nodeBtnJiesan.active = false
			} break
			default:{
				this.nodeBtnJiesan.active = true 
			}
		}
	}
	onClickExit() {
		// kcore.click.playAudio()
		this.gameLayer?.onClickExit()
		kcore.tip.push("提示","请求已发出")
		this.popSelf()
	}

	onClickWatch() {
		// kcore.click.playAudio()
		this.gameLayer?.onClickStandUp()
		kcore.tip.push("提示","请求已发出")
		this.popSelf()
	}

	onClickSetting() {
		kcore.click.playAudio()
		kcore.ui.push('TexasGameSettingLayer')
		this.popSelf()
	}

	onClickSwitchNetwork() {
		kcore.click.playAudio()
		kcore.toast.push("暂未开放")
	}

	async onClickGroup() {
		// kcore.click.playAudio()
		this.gameLayer.onClickSwitchGroup()
		this.popSelf()
	}

	onClickRule() {
		kcore.click.playAudio()
		kcore.toast.push("暂未开放")
	}
	onClickJiesan() {
		// kcore.click.playAudio()
		this.gameLayer?.onClickJiesan() 
		this.popSelf()
	}
}