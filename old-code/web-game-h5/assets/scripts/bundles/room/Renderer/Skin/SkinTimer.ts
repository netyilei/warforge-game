import BaseSkin from "./BaseSkin"


const { ccclass, property, menu } = cc._decorator

 
@ccclass
@menu("game/skin/SkinTimer")
export default class SkinTimer extends BaseSkin implements krenderer.ISkinTimer {
	@property(cc.Prefab)
	prefab:cc.Prefab = null

	get type() {
		return krenderer.RType.Timer
	}
}