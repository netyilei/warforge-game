import BaseGameLayer from "../room/BaseGameLayer";
import BasePlayer from "../room/BasePlayer";
import DefaultAtlas from "../room/Renderer/DefaultAtlas";


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayer")
export default class TexasPlayer extends BasePlayer {
	
	protected onInitPlayer(): void {
		super.onInitPlayer()

		
	}
}