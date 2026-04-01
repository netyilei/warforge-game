import { BasePlayerExtension } from "../BasePlayerExtension";


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/PlayerExt_Timer")
export default class PlayerExt_Timer extends BasePlayerExtension {
	@property(cc.Prefab)
	prefab:cc.Prefab = null
	@property(cc.Node)
	nodeRoot:cc.Node = null
	onInitPlayerExtension(): void {
		
	}
}