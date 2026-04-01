import { GameConfigDefines } from "../../../games/GameConfigDefines";
import { GameConfigSerialize } from "../../../games/GameConfigSerialize";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { SrsUserMsg } from "../../../ServerDefines/SrsUserMsg";
import BaseGameLayer from "../BaseGameLayer";
import { BaseGameLayerExtension } from "../BaseGameLayerExtension";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/GameLayerExt_MenuSetting")
export default class GameLayerExt_MenuSetting extends BaseGameLayerExtension<BaseGameLayer> {
	@property(cc.Button)
	btnExit:cc.Button = null

	@property(cc.Node)
	nodeRootMenu:cc.Node = null

	onInitLayerExtension(): void {
		this.onHideMenu(true)
	}

	onClickExit() {
		kcore.click.playAudio()
		kcore.gnet.send(GSUserMsg.UserExit,{})
		if(this.btnExit) {
			this.btnExit.interactable = false 
			this.scheduleOnce(()=>{
				this.btnExit.interactable = true 
			},1)
		}
	}

	onClickSetting() {
		kcore.click.playAudio()

	}

	onShowMenu(forceShow?:boolean) {

	}

	onHideMenu(forceShow?:boolean) {

	}
}