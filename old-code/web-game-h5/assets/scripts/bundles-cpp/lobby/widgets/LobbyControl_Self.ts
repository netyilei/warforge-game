import Decimal from "decimaljs";
import { Config } from "../../../core/Config";
import { ItemDefine, ItemID } from "../../../ServerDefines/ItemDefine";
import { UserDefine } from "../../../ServerDefines/UserDefine";
import LobbyControl_Base from "./LobbyControl_Base";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/LobbyControl_Self')
export default class LobbyControl_Self extends LobbyControl_Base {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Label)
	lblGold:cc.Label = null
	@property(cc.Label)
	lblNickname:cc.Label = null
	@property(cc.Label)
	lblUserID:cc.Label = null


	protected onLoad(): void {
		kcore.data.listenget("login/data",null,this.node,(data:UserDefine.tLoginData)=>{
			this.lblNickname.string = kcore.utils.cutString(data.nickName,12,"..")
			this.lblUserID.string = "ID:" + data.userID
			kcore.display.loadWebTexture(data.iconUrl).then((frame)=>{
				frame ? (this.sprIcon.spriteFrame = frame) : (this.sprIcon.spriteFrame = Config.defaultIconSpriteFrame)
			})
		})
		kcore.data.listenget("user/items",null,this.node,(items:ItemDefine.tItem[])=>{
			let goldItem = items?.find(v=>v.id == ItemID.Gold)
			let goldCount = goldItem ? goldItem.count : 0
			this.lblGold.string = new Decimal(goldCount).toFixed(2)
		})
	}

	onClickBill() {
		kcore.click.playAudio()
		kcore.ui.push("BillLayer")
	}

	onClickSerial() {
		kcore.click.playAudio()
		kcore.ui.push("UserSerialLayer")
	}

	onClickPassword() {
		kcore.click.playAudio()
		kcore.ui.push("LoginForgetLayer")
	}

	onClickSetting() {
		kcore.click.playAudio()
		kcore.ui.push("SettingLayer")
	}

	onClickInvite() {
		kcore.click.playAudio()
		kcore.ui.push("InviteLayer")
	}

	onClickModifyUserInfo() {
		kcore.click.playAudio()
		kcore.ui.push("ChangeNameLayer")
	}

	onClickWithdraw() {
		kcore.click.playAudio()
		kcore.ui.push("WithdrawLayer")
	}

	onClickCharge() {
		kcore.click.playAudio()
		kcore.ui.push("ChargeLayer")
	}

	onClickTradePassworkd() {
		kcore.click.playAudio()
		kcore.ui.push("ChangeTradeCodeLayer")
	}
	onClickRelogin() {
		kcore.click.playAudio()
		kcore.tip.push("提示","是否重新登录",2,(b)=>{
			if(b) {
				kcore.layer.login()
			}
		})
	}
	onClickAbout() {
		kcore.click.playAudio()
		kcore.ui.push("AboutLayer")
	}
}