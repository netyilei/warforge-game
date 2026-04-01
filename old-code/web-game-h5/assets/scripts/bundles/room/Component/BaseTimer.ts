

const { ccclass, property } = cc._decorator


@ccclass
export default class BaseTimer extends cc.Component implements krenderer.IBaseTimer {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property()
	autoUpdate:boolean = false 
	@property()
	autoDisabled:boolean = false 
	
	protected onLoad(): void {
		this.schedule((dt)=>{
			this.onScheduleUpdate(dt)
		})
		this.onTimerUpdate()
	}

	private startCountdown_:number = null 
	get startCountdown() {
		return this.startCountdown_
	}

	private countdown_:number = null 
	get countdown() {
		return this.countdown_
	}
	set countdown(v) {
		this.countdown_ = v
	}

	private paused_:boolean = false 
	get paused() {
		return this.paused_
	}
	set paused(v) {
		this.paused_ = !!v
	}
	setTimer(countdown?:number,paused?:boolean) {
		this.startCountdown_ = countdown
		this.countdown = countdown
		this.paused = paused
		this.onTimerSetup(countdown)
		if(!this.countdown) {
			this.onTimerEnd()
			this.onTimerUpdate()
		} else {
			this.onTimerStart()
			this.onTimerUpdate()
		}
	}

	onTimerSetup(countdown?:number) {

	}

	onTimerStart() {

	}

	onTimerEnd() {

	}

	onTimerUpdate() {

	}

	onUpdate(dt:number) {
		if(!this.countdown) {
			this.nodeRoot.active = !this.autoDisabled
			return 
		}
		if(this.paused) {
			return 
		}
		if(this.countdown <= 0) {
			this.nodeRoot.active = !this.autoDisabled
			return 
		}
		this.nodeRoot.active = true 
		this.countdown -= dt 
		if(this.countdown <= 0) {
			this.countdown = 0
			this.onTimerUpdate()
			this.onTimerEnd()
		} else {
			this.onTimerUpdate()
		}
	}

	protected onScheduleUpdate(dt:number) {
		if(this.autoUpdate) {
			this.onUpdate(dt)
		}
	}
}