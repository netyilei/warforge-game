import BaseAnimationRuntimeItem from "./BaseAnimationRuntimeItem"


const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("game/component/AnimationRuntimeItem_Spine")
export default class AnimationRuntimeItem_Spine extends BaseAnimationRuntimeItem {
	@property(sp.Skeleton)
	spine:sp.Skeleton = null

	private inited_ = false 
	private spTrack_:sp.spine.TrackEntry
	lazyInit() {
		if(this.inited_) {
			return 
		}
		this.inited_ = true 

		if(!this.spine.defaultAnimation) {
			let jsonAnimations = this.spine.skeletonData.skeletonJson.animations
			this.spine.defaultAnimation = Object.keys(jsonAnimations)[0]
		}
	}

	playAnimation(callback?: Function) {
		this.lazyInit()
		if(this.target) {
			this.target.active = true 
		}
		let track = this.spine.setAnimation(0,this.spine.defaultAnimation,false)
		this.spTrack_ = track
		this.spine.setTrackCompleteListener(track,(track,count)=>{
			if(callback) {
				try {
					callback()
				} catch (error) {
					kcore.log.error("",error)
				}
			}
		})
	}

	playLoopAnimation() {
		this.lazyInit()
		if(this.target) {
			this.target.active = true 
		}
		let track = this.spine.setAnimation(0,this.spine.defaultAnimation,false)
		this.spTrack_ = track
	}

	stop() {
		if(this.spine) {
			this.spine.clearTracks()
		}
		if(this.target && this.target.isValid) {
			this.target.active = false 
		}
	}
}