import { Config } from "../../core/Config";
import { UIBase } from "../../core/ui/UIBase";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/InviteLayer')
export default class InviteLayer extends UIBase {
	@property(cc.Label)
	lblCode:cc.Label = null
	@property(cc.Label)
	lblUrl:cc.Label = null
	
	onPush(...params: any[]): void {
		this.lblCode.string = kcore.data.get("login/leaderTag") || ""
		let url = Config.shareUrl
		if(!url) {
			url = window.location.href
		}
		if(url.includes("?")) {
			url = url + `&leader_tag=${this.lblCode.string}`
		} else {
			url = url + `?leader_tag=${this.lblCode.string}`
		}
		this.lblUrl.string = url
	}


	onClickCopyCode() {
		kcore.click.playAudio()
		kcore.utils.copyToClipboard(this.lblCode.string)
		kcore.toast.push("邀请码已复制到剪贴板")
	}

	onClickCopyUrl() {
		kcore.click.playAudio()
		kcore.utils.copyToClipboard(this.lblUrl.string)
		kcore.toast.push("邀请链接已复制到剪贴板")
	}
}