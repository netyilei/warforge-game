import BaseAnimationRuntimeItem from "./BaseAnimationRuntimeItem"


const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("game/component/AnimationRuntimeItem_AnimationClip")
export default class AnimationRuntimeItem_AnimationClip extends BaseAnimationRuntimeItem {
	@property(cc.Animation)
	animation:cc.Animation = null

	private inited_ = false 
	lazyInit() {
		if(this.inited_) {
			return 
		}
		this.inited_ = true 
		this.animation.on(cc.Animation.EventType.FINISHED,()=>{
			this.onAnimationDone()
		})
		this.animation.on(cc.Animation.EventType.LASTFRAME,()=>{
			this.onAnimationDone()
		})
	}

	private callback_:Function
	playAnimation(callback?: Function) {
		this.lazyInit()
		if(this.target) {
			this.target.active = true 
		}
		this.callback_ = callback
		this.animation.play(this.animation.getClips()[0].name)
	}
	playLoopAnimation() {
		if(this.target) {
			this.target.active = true 
		}
		this.animation.play(this.animation.getClips()[0].name)
	}
	
	stop() {
		if(this.animation) {
			this.animation.stop()
		}
		if(this.target) {
			this.target.active = false 
		}
	}

	onAnimationDone() {
		if(this.callback_) {
			try {
				this.callback_()
			} catch (error) {
				kcore.log.error("",error)
			}
		}
	}
}