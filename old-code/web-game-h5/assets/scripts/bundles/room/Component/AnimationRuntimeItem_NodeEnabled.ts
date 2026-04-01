import BaseAnimationRuntimeItem from "./BaseAnimationRuntimeItem"


const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("game/component/AnimationRuntimeItem_NodeEnabled")
export default class AnimationRuntimeItem_NodeEnabled extends BaseAnimationRuntimeItem {
	private callback_:Function
	playAnimation(callback?: Function) {
		this.target.active = true 
		if(callback) {
			setTimeout(()=>{
				if(this.isValid && this.target.active) {
					this.stop()
					callback()
				}
			})
		}
	}
	playLoopAnimation() {
		if(!this.target)return
		this.target.active = true 
	}
	
	stop() {
		if(!this.target)return
		this.target.active = false 
	}
}