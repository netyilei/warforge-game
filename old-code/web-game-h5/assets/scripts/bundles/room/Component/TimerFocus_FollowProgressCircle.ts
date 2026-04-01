import Decimal from 'decimaljs'
import BaseTimer from "./BaseTimer"
import ValueFocus from "../../../core/value/ValueFocus"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/component/TimerFocus_FollowProgressCircle")
export default class TimerFocus_FollowProgressCircle extends cc.Component {
	@property(ValueFocus)
	focus:ValueFocus = null
	@property(cc.Node)
	nodeMoved:cc.Node = null	
	@property(cc.Sprite)
	sprFocus:cc.Sprite = null

	protected start(): void {
		if(!this.focus) {
			return 
		}
		if(!this.sprFocus) {
			this.sprFocus = this.focus.node.getComponent(cc.Sprite)
		}
		if(!this.focus || this.nodeMoved || !this.sprFocus) {
			return 
		}
		this.focus.listenget(this.node,null,(value:number)=>{
			let size = this.sprFocus.node.getContentSize()
			let ap = this.sprFocus.node.getAnchorPoint()
			let rx = size.width * this.sprFocus.fillCenter.x
			let ry = size.height * this.sprFocus.fillCenter.y
			let radian = 2 * Math.PI * value 
			let x = rx * Math.cos(radian) + (0.5 - ap.x) * size.width
			let y = ry * Math.sin(radian) + (0.5 - ap.y) * size.height

			this.nodeMoved.position2 = kcore.utils.convertPosition(this.sprFocus.node,this.nodeMoved,cc.v2(x,y))
		})
	}
}