import { ToastFunc } from "./ToastFactory";
import { UIBase } from "./UIBase";


const {ccclass, property} = cc._decorator;

@ccclass
export class ToastLayer extends UIBase { 
	@property(cc.Label)
	lblContent:cc.Label = null

	@property(cc.Node)
	nodeAni:cc.Node = null

	get uiType() {
		return UIType.Toast
	}

	onPush(content:string,duration:number) {
		this.maskPopEnabled = false 

		this.lblContent.string = content || "提示"

		this.nodeAni.opacity = 0
		let tpos = this.nodeAni.position2
		let fpos = cc.v2(tpos.x,tpos.y - 150)
		this.nodeAni.position2 = fpos 
		let time = 0.5
		let self = this 
		this.nodeAni.runAction(cc.sequence([
			cc.spawn([
				cc.moveTo(time,tpos).easing(cc.easeOut(2)),
				cc.fadeIn(time)
			]),
			cc.delayTime(duration || 2),
			cc.fadeOut(time),
			cc.callFunc(function() {
				if(self.isValid) {
					self.popSelf()
				}
			})
		]))
	}
}
ToastFunc.push = function(content?:string,duration?:number) {
	kcore.ui.push("ToastLayer",content,duration)
}