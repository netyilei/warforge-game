import { Poker } from "../../../../ServerDefines/PokerDefine";
import BaseSkin from "./BaseSkin";


const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("game/skin/SkinPokerCardBack")
export default class SkinPokerCardBack extends BaseSkin implements krenderer.ISkinCardBack {
	@property(cc.SpriteFrame)
	back:cc.SpriteFrame = null
	get type() {
		return krenderer.RType.CardBack 
	}
	get defaultFrame() {
		return this.back 
	}
}