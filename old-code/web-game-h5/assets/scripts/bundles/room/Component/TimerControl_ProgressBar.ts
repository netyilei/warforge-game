import Decimal from 'decimaljs'
import BaseTimer from "./BaseTimer"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/component/TimerControl_ProgressBar")
export default class TimerControl_ProgressBar extends BaseTimer {
	@property([cc.ProgressBar])
	bars:cc.ProgressBar[] = []
	@property({tooltip:"方向\ntrue正向0->1\nfalse反向1-0"})
	direction:boolean = true 
	@property({tooltip:"默认状态\ntrue进度条为满\nfalse进度条为空"})
	defaultProgress1Or0:boolean = true 

	fixDirection(progress:number) {
		return this.direction ? progress : 1 - progress
	}
	onTimerUpdate() {
		let countdown = this.countdown || 0
		if(!countdown) {
			if(!this.startCountdown) {
				this.bars.forEach(bar => {
					bar.progress = this.fixDirection(this.defaultProgress1Or0 ? 1 : 0)
				})
			} else {
				this.bars.forEach(bar => {
					bar.progress = this.fixDirection(1)
				})
			}
			return 
		}
		// progress 0->1
		let progress = this.fixDirection(1 - cc.misc.clamp01(this.countdown / this.startCountdown))
		this.bars.forEach(bar => {
			bar.progress = progress
		})
	}
	

}