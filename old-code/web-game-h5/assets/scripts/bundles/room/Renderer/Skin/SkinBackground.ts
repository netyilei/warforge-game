import BaseSkin from "./BaseSkin";


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/skin/SkinBackground")
export default class SkinBackground extends BaseSkin implements krenderer.ISkinBackground {
	@property(cc.SpriteFrame)
	frame: cc.SpriteFrame = null 

	get type() {
		return krenderer.RType.Background
	}
	get defaultFrame() {
		return this.frame 
	}
}