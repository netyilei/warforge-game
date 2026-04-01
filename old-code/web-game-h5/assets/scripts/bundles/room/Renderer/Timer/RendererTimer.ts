
const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/renderer/RendererTimer")
export default class RendererTimer extends cc.Component implements krenderer.ITimer {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property()
	timerAutoUpdate = false 
	@property()
	timerAutoDisabled = false 

	private timers_:krenderer.IBaseTimer[] = []

	private autoDisabled_:boolean = false 
	get autoDisabled() {
		return this.autoDisabled_
	}
	set autoDisabled(v) {
		this.autoDisabled_ = v
		for(let timer of this.timers_) {
			timer.autoDisabled = v 
		}
	}
	private autoUpdate_:boolean = false 
	get autoUpdate() {
		return this.autoUpdate_
	}
	set autoUpdate(v) {
		this.autoUpdate_ = v
		for(let timer of this.timers_) {
			timer.autoUpdate = v 
		}
	}
	get startCountdown() {
		return this.timers_[0] ? this.timers_[0].startCountdown : 0
	}
	get countdown() {
		return this.timers_[0] ? this.timers_[0].countdown : 0
	}
	set countdown(v) {
		for(let timer of this.timers_) {
			timer.countdown = v 
		}
	}
	get paused() {
		return this.timers_[0] ? this.timers_[0].paused : false
	}
	set paused(v) {
		for(let timer of this.timers_) {
			timer.paused = v 
		}
	}
	setTimer(countdown?: number, paused?: boolean) {
		for(let timer of this.timers_) {
			timer.setTimer(countdown,paused)
		}
	}
	onTimerSetup(countdown?: number) {}
	onTimerStart() {}
	onTimerEnd() {}
	onTimerUpdate() {}
	onUpdate(dt: number) {}

	get type() {
		return krenderer.RType.Timer
	}

	private initParams_ = false 
	private lazyInitParams() {
		if(this.initParams_) {
			return 
		}
		this.initParams_ = true 
		this.autoUpdate = this.timerAutoUpdate
		this.autoDisabled = this.timerAutoDisabled
	}

	useSkin(skin: krenderer.ISkinTimer): boolean {
		this.lazyInitParams()
		
		let node = kcore.display.instantiate(skin.prefab)
		let newTimers:krenderer.IBaseTimer[] = kcore.utils.getComponentsByMethod(node,"onTimerSetup")
		if(!newTimers || newTimers.length == 0) {
			kcore.log.error("use timer skin failed com not found name = " + this.node.name)
			return false 
		}
		this.nodeRoot.addChild(node)
		for(let newTimer of newTimers) {
			newTimer.autoUpdate = this.autoUpdate
			newTimer.autoDisabled = this.autoDisabled
		}
		if(this.timers_[0]) {
			for(let newTimer of newTimers) {
				newTimer.paused = this.timers_[0].paused
				if(this.startCountdown) {
					newTimer.setTimer(this.startCountdown)
					newTimer.countdown = this.timers_[0].countdown
				}
			}
			for(let timer of this.timers_) {
				timer.node.destroy()
			}
			this.timers_.splice(0)
		}
		this.timers_ = newTimers
	}
	useSkin2(skin: krenderer.ISkin): boolean {
		return false
	}

	onInitRenderer() {}
}