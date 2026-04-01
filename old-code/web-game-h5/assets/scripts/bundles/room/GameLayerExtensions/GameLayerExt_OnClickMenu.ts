import { GameConfigSerialize } from "../../../games/GameConfigSerialize";
import BaseGameLayer from "../BaseGameLayer";
import { BaseGameLayerExtension } from "../BaseGameLayerExtension";
import { GameLayerEvents } from "../GameLayerEvents";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/GameLayerExt_OnClickMenu")
export default class GameLayerExt_OnClickMenu<T extends BaseGameLayer = BaseGameLayer> extends BaseGameLayerExtension<T> {
	
	get menuLayerName():string {
		return null 
	}

	protected serialize_:GameConfigSerialize
	onInitLayerExtension(): void {
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GameLayerEvents.ON_CLICKMENU,()=>{
				this.onClick()
				if(this.menuLayerName) {
					kcore.ui.push(this.menuLayerName)
				}
			})
	}

	onClick() {}
}