import BaseSkin from "./BaseSkin"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/skin/SkinHandCards")
export default class SkinHandCards extends BaseSkin {
	get type() {
		return krenderer.RType.HandCards 
	}
}