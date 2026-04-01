

const { ccclass, property, menu } = cc._decorator

@ccclass
export default class BaseAnimationRuntimeItem extends cc.Component implements krenderer.IAniRuntimeItem {
	@property(cc.Node)
	target:cc.Node = null
	playAnimation(callback?: Function) {
		throw new Error("Method not implemented.");
	}
	playLoopAnimation() {
		throw new Error("Method not implemented.");
	}
	stop() {
		throw new Error("Method not implemented.");
	}
	comid_IAniRuntimeItem() {
	}
}