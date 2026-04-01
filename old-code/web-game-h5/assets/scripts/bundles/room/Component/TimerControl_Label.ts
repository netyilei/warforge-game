import Decimal from 'decimaljs'
import BaseTimer from "./BaseTimer"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/component/TimerControl_Label")
export default class TimerControl_Label extends BaseTimer {
	@property(cc.Label)
	lblTimer:cc.Label = null
	@property({tooltip:"小数"})
	decimal:number = 0
	@property({tooltip:"整数位数,不足补0\n0为不开启"})
	headFixedLen:number = 2
	@property({tooltip:"默认显示\ntrue显示\nfalse不显示"})
	defaultShow:boolean = false 
	@property({tooltip:"倒计时结束显示\ntrue显示\nfalse不显示"})
	countdownEndShow:boolean = false 
	@property(cc.Node)
	nodeShow:cc.Node = null

	onTimerUpdate() {
		let countdown = this.countdown || 0
		if(!countdown) {
			if(!this.startCountdown) {
				if(!this.defaultShow) {
					this.nodeShow.active = false 
					return 
				}
			} else if(!this.countdownEndShow) {
				this.nodeShow.active = false 
				return 
			}
		}
		this.nodeShow.active = true 
		let str = countdown.toFixed(this.decimal)
		if(this.headFixedLen > 0) {
			let arr = str.split(".")
			if(arr.length > 1) {
				let head = arr[0]
				if(head.length < this.headFixedLen) {
					head = "0".repeat(this.headFixedLen - head.length) + head 
				}
				str = head + arr[1]
			}
		}
		this.lblTimer.string = str
	}
	

}