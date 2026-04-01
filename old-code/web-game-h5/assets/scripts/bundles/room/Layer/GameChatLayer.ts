import { UIBase } from "../../../core/ui/UIBase";
import UIBottomAction from "../../../core/ui/UIBottomAction";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/layer/GameChatLayer")
export default class GameChatLayer extends UIBottomAction {
	@property(cc.Node)
	nodeFastTemplate: cc.Node = null
	@property(cc.Node)
	nodeFastLayout: cc.Node = null
	@property(cc.Node)
	nodeFastRoot: cc.Node = null
	@property(cc.Node)
	nodeEmojiTemplate: cc.Node = null
	@property(cc.Node)
	nodeEmojiLayout: cc.Node = null
	@property(cc.Node)
	nodeEmojiRoot: cc.Node = null
	@property(ButtonCheckBox)
	checkFast: ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkEmoji: ButtonCheckBox = null
	@property(cc.EditBox)
	editBox:cc.EditBox = null
	// onFocus(b:boolean):boolean {
	// 	if(b) {
	// 		kcore.uiactions.moveFadeInFromBottom(this)
	// 	} else {
	// 		let self = this 
	// 		kcore.uiactions.moveFadeOutToBottom(this,function() {
	// 			self.node.active = false
	// 		})
	// 	}
	// 	return true 
	// }
	// onDead() {
	// 	let self = this
	// 	kcore.uiactions.moveFadeOutToBottom(this,function() {
	// 		self.node.destroy()
	// 	})
	// 	return true 
	// }

	private gameLayer_: kroom.IBaseGameLayer
	onPush(gameLayer: kroom.IBaseGameLayer): void {

		this.gameLayer_ = gameLayer
		this.nodeFastTemplate.active = false

		this.checkFast.setFunc(() => {
			this.onTab(0)
		})
		this.checkEmoji.setFunc(() => {
			this.onTab(1)
		})
		this.nodeFastLayout.destroyAllChildren()
		console.log("krenderer.asset", krenderer.asset)
		if (krenderer && krenderer.asset && krenderer.asset.chat) {
			for (let i = 0; ; i++) {
				let idx = i
				let def = krenderer.asset.chat.getFast(idx)
				if (!def) {
					break
				}
				let node = kcore.display.instantiate(this.nodeFastTemplate)
				node.active = true
				this.nodeFastLayout.addChild(node)
				let lbl = node.getComponentInChildren(cc.Label)
				lbl.string = def.text

				kcore.click.click(node, () => {
					kcore.gnet.send(GSUserMsg.Chat, <GSUserMsg.tChatReq>{
						type: GSUserMsg.ChatType.Fast,
						// text:def.text,
						index: idx,
					})
					this.popSelf()
				})
			}
		}
		if (krenderer && krenderer.asset && krenderer.asset.ani) {
			let emojis = krenderer.asset.ani.getAllEmojiDefines()
		
			emojis.forEach((data: krenderer.IAniEmojiDefine) => {
				let node = kcore.display.instantiate(this.nodeEmojiTemplate)
				node.active = true
				this.nodeEmojiLayout.addChild(node)
				let spr: cc.Sprite = node.childComponent(cc.Sprite)
				console.log(data.frame)
				spr.setImage(data.frame)
				kcore.click.click(node, () => {
					kcore.gnet.send(GSUserMsg.Chat, <GSUserMsg.tChatReq>{
						type: GSUserMsg.ChatType.Emoji,
						// text:def.text,
						index: data.index,
					})
					this.popSelf()
				})
			})
		}
		this.onTab(0)
	}

	onTab(idx: number) {
		this.checkFast.isChecked = idx == 0
		this.checkEmoji.isChecked = idx == 1

		this.nodeFastRoot.active = idx == 0
		this.nodeEmojiRoot.active = idx == 1
	}

	onClickEdit() {
		kcore.click.playAudio()
		let content = this.editBox.string.trim()
		if(content.length == 0) {
			return 
		}
		kcore.gnet.send(GSUserMsg.Chat, <GSUserMsg.tChatReq>{
			type: GSUserMsg.ChatType.Text,
			text: content,
		})
		this.editBox.string = ""
		this.popSelf()
	}

}