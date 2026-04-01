import Decimal from 'decimaljs'
import { TexasPool } from "../TexasPool"


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasPlayerExt_BoardPoolsWidget_SinglePool")
export default class TexasPlayerExt_BoardPoolsWidget_SinglePool extends cc.Component {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property(cc.Label)
	lblPool:cc.Label = null
	
	private pool_:TexasPool = null 
	get pool() {
		return this.pool_
	}
	set pool(v) {
		this.pool_ = v
		this.refreshPool()
	}

	/**
	 * 
	 * @returns true - 如果跟上次不一样
	 */
	refreshPool() {
		if(this.pool) {
			let str = this.pool.totalValue.toString()
			let b = this.lblPool.string != str
			this.lblPool.string = str	
			this.nodeRoot.active = true 
			if(b) {
				this.onPoolScaleAnimation(this.nodeRoot)
			}
			return b 
		} else {
			this.nodeRoot.active = false 
		}
		return false 
	}

	onPoolScaleAnimation(node:cc.Node) {
		node.stopAllActions()
		node.runAction(cc.sequence([
			cc.scaleTo(0.1,1.1).easing(cc.easeIn(2)),
			cc.scaleTo(0.1,1).easing(cc.easeOut(2)),
		]))
	}
}