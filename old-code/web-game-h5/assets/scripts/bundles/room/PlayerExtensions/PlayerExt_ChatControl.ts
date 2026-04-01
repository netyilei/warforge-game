import { Config } from "../../../core/Config";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { SrsUserMsg } from "../../../ServerDefines/SrsUserMsg";
import { BasePlayerExtension } from "../BasePlayerExtension";
import PlayerChatBoard from "../Component/PlayerChatBoard";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/PlayerExt_ChatControl")
export default class PlayerExt_ChatControl<
	GameLayerClass extends kroom.IBaseGameLayer = kroom.IBaseGameLayer,
	PlayerClass extends kroom.IBasePlayer = kroom.IBasePlayer
>
	extends BasePlayerExtension<GameLayerClass, PlayerClass> {

	@property(PlayerChatBoard)
	board: PlayerChatBoard = null
	@property(cc.Prefab)
	prefab: cc.Prefab = null
	@property()
	chatAudioName = "chat"

	onInitPlayerExtension(): void {
		if (!this.board && this.prefab) {
			let node = kcore.display.instantiate(this.prefab)
			this.node.addChild(node)
			this.board = node.getComponent(PlayerChatBoard)
		}
		if (this.board) {
			this.board.viewID = this.player.viewID
		}
		this.gameLayer.dispMsg.addNode(this.node, null, this)
			.listen(GSUserMsg.Chat, (msg: GSUserMsg.tChatNT) => {
				if(this.chatAudioName && krenderer.asset.audio) {
					krenderer.asset.audio.play(this.chatAudioName)
				}
				if (msg.fromChairNo != this.player.chairNo) {
					return
				}
				// todo 处理聊天
				switch (msg.type) {
					case GSUserMsg.ChatType.Text: {
						if (this.board) {
							this.board.setup(msg.text)
						}
					} break
					case GSUserMsg.ChatType.Fast: {
						if (krenderer.asset.chat) {
							let content = krenderer.asset.chat.playFast(msg.index)
							if (content) {
								if (this.board) {
									this.board.setup(content)
								}
							}
						}
					} break
					case GSUserMsg.ChatType.Emoji: {
						if (krenderer.asset.ani) {
							let delaySec : number = 3
							if (this.board) {
								let emojiRoot: cc.Node = <cc.Node>this.board.setupEmoji(delaySec)
								if (emojiRoot) {
									krenderer.asset.ani.playEmoji(msg.index, {
										node: emojiRoot,
										parent: emojiRoot,
										delaySec,
									})
									emojiRoot.children.forEach((node: cc.Node) => {
										console.log(node.name, node.getPosition(), node.active)
									})
									emojiRoot.parent.children.forEach((node: cc.Node) => {
										console.log(node.name, node.active)
									})
									console.log(emojiRoot.parent.name, emojiRoot.parent.active)
									// this.board.setupEmoji()
								}

							}
							// if(this.player.sprIcon) {
							// 	krenderer.asset.ani.playEmoji(msg.index,{
							// 		node:this.player.sprIcon.node,
							// 		parent:this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Top),
							// 		delaySec:3,
							// 	})
							// }
						}

					} break
					case GSUserMsg.ChatType.ToEmoji: {
						if (msg.fromChairNo != this.player.chairNo) {
							break
						}
						if (krenderer.asset.ani) {
							let otherPlayer = this.gameLayer.players.find(v => v.chairNo == msg.toChairNo)
							if (otherPlayer) {
								let from = this.player.sprIcon ? this.player.sprIcon.node : this.player.node
								let to = otherPlayer.sprIcon ? otherPlayer.sprIcon.node : otherPlayer.node
								krenderer.asset.ani.playToEmoji(msg.index, {
									fromNode: from,
									toNode: to,
									parent: this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Top),
									duration: 0.5,
								})
							}
						}
					} break
				}
			})
	}
}