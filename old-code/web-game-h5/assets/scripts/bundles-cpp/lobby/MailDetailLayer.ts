import moment = require("moment");
import { UIBase } from "../../core/ui/UIBase";
import { MailDefine } from "../../ServerDefines/MailDefine";
import { ReqLobby } from "../../requests/ReqLobby";
import { ReqUser } from "../../requests/ReqUser";
import ItemUtils from "../../core/utils/ItemUtils";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/MailDetailLayer')
export default class MailDetailLayer extends UIBase {
	@property(cc.Node)
	nodeReward:cc.Node = null
	@property(cc.Label)
	lblContent:cc.Label = null
	@property(cc.Label)
	lblTitle:cc.Label = null
	@property(cc.Node)
	nodeRewardLayout:cc.Node = null
	@property(cc.Node)
	nodeRewardTemplate:cc.Node = null
	@property(cc.Node)
	nodeBtnGain:cc.Node = null
	@property(cc.Node)
	nodeBtnAlreadyGain:cc.Node = null

	private fullMail_:MailDefine.tMail = null
	private simpleMail_:MailDefine.tMail = null
	onPush(mail:MailDefine.tMail): void {
		this.nodeRewardTemplate.active = false 
		this.nodeReward.active = false 

		this.simpleMail_ = mail
		this.lblTitle.string = moment(this.simpleMail_.sendTime).format("YYYY-MM-DD HH:mm:ss")
		this.lblContent.string = this.simpleMail_.title + "\n\n"
		this.loadData()
	}

	async loadData() {
		let res = await ReqUser.readUserMail({
			mailID:this.simpleMail_.mailID,
		})
		if(!this.isValid) {
			return 
		}
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		
		this.fullMail_ = res.data
		this.updateLayer()
	}

	updateLayer() {
		this.lblContent.string = this.fullMail_.title + "\n\n" + this.fullMail_.content
		if(this.fullMail_.attachs && this.fullMail_.attachs.length > 0) {
			this.nodeReward.active = true 
			this.nodeRewardLayout.removeAllChildren()
			for(let attach of this.fullMail_.attachs) {
				let itemNode = kcore.display.instantiate(this.nodeRewardTemplate)
				itemNode.active = true 
				this.nodeRewardLayout.addChild(itemNode)

				let lblName = itemNode.childCom("name",cc.Label)
				let lblCount = itemNode.childCom("count",cc.Label)

				let config = ItemUtils.getItemConfigSync(attach.itemID)
				lblName.string = config?.name || attach.title || "未知物品"
				lblCount.string = "x" + attach.count
			}

			if(this.fullMail_.isReceived) {
				this.nodeBtnGain.active = false 
				this.nodeBtnAlreadyGain.active = true
			} else {
				this.nodeBtnGain.active = true 
				this.nodeBtnAlreadyGain.active = false
			}
		}
	}

	async onClickGain() {
		kcore.click.playAudio()
		let res = await ReqUser.receiveUserMail({
			mailID:this.fullMail_.mailID,
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		kcore.tip.push("提示","领取成功")
		this.fullMail_.isReceived = true
		this.updateLayer()
	}
}