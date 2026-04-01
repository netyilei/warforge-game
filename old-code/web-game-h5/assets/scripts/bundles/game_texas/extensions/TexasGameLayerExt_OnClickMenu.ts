import GameLayerExt_OnClickMenu from "../../room/GameLayerExtensions/GameLayerExt_OnClickMenu";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasGameLayerExt_OnClickMenu")
export default class TexasGameLayerExt_OnClickMenu extends GameLayerExt_OnClickMenu {

	onClick(): void {
		kcore.click.playAudio()
		this.gameLayer.relogin()
	}
}