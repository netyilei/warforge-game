import { GameConfigDefines } from "../../../games/GameConfigDefines";
import { GameConfigSerialize } from "../../../games/GameConfigSerialize";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import BaseGameLayer from "../BaseGameLayer";
import { BaseGameLayerExtension } from "../BaseGameLayerExtension";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/GameLayerExt_GameInfos")
export default class GameLayerExt_GameInfos extends BaseGameLayerExtension<BaseGameLayer> {
	@property(cc.Label)
	lblRule:cc.Label = null
	@property()
	ruleSplit:string = ","
	@property(cc.Label)
	lblUserCount:cc.Label = null
	@property()
	userCountFormat:string = "{$userCount}人"
	@property(cc.Label)
	lblJuCount:cc.Label = null
	@property()
	juFormat:string = "第{$cur}/{$max}{$juType}"
	@property(cc.Label)
	lblRoomInfo:cc.Label = null
	@property(cc.Node)
	nodeBoxCodeEnabled:cc.Node = null

	protected serialize_:GameConfigSerialize
	onInitLayerExtension(): void {
		let juFormat = kcore.lang.get(this.juFormat)
		this.nodeBoxCodeEnabled.active = false 
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.RoomInfo,(msg:GSUserMsg.tRoomInfoNT)=>{
				let config = GameConfigDefines.getGameConfig(msg.gameData.gameID)
				this.serialize_ = new GameConfigSerialize(this.gameLayer.gameSet,config)
				let extNames = this.serialize_.getExtensioNames()
				if(this.lblRule) {
					this.lblRule.string = extNames.join(this.ruleSplit)
				}
				if(this.lblUserCount) {
					this.lblUserCount.string = this.userCountFormat.replace("{$userCount}",String(this.gameLayer.gameSet.getUserCount()))
				}
				if(this.lblJuCount) {
					this.lblJuCount.string = juFormat
						.replace("{$cur}",String(this.gameLayer.juCount))
						.replace("{$max}",String(this.gameLayer.gameSet.getJuCount()))
						.replace("{$juType}",String(this.serialize_.getJuType()))
				}
				if(this.lblRoomInfo) {
					let roomInfo = this.gameLayer.roomInfo
					if(roomInfo.groupID) {
						this.lblRoomInfo.string = `匹配:${roomInfo.roomID}`
					} else if(roomInfo.matchID) {
						this.lblRoomInfo.string = `比赛:${roomInfo.roomID}`
					} else {
						this.lblRoomInfo.string = `房间号${roomInfo.boxCode}`
					}
				}
				this.nodeBoxCodeEnabled.active = this.isBoxCodeEnabled()
			})
			.listen(GSUserMsg.GameStart,(msg:GSUserMsg.tGameStartNT)=>{
				if(this.lblJuCount) {
					this.lblJuCount.string = juFormat
						.replace("{$cur}",String(this.gameLayer.juCount))
						.replace("{$max}",String(this.gameLayer.gameSet.getJuCount()))
						.replace("{$juType}",String(this.serialize_.getJuType()))
				}
			})
	}

	isBoxCodeEnabled() {
		let roomInfo = this.gameLayer.roomInfo
		if(roomInfo.groupID) {
			return false 
		} else if(roomInfo.matchID) {
			return false 
		} else if(roomInfo.boxCode) {
			return true 
		}
		return false 
	}
	onClickCopyBoxCode() {
		kcore.click.playAudio()
		if(!this.isBoxCodeEnabled()) {
			return 
		}
		kcore.utils.copyToClipboard(this.gameLayer.roomInfo.boxCode)
		kcore.toast.push("房间号已复制到剪贴板")
	}
}