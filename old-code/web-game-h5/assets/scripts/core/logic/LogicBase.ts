import { rcLogic } from "./LogicInterface";


export class LogicBase extends cc.Component {

	onLogicStart(...params:any[]) {}
	onLogicStop() {}
	onLogicBlock() { return "" }
	onLogicUpdate(dt) {}

	stopSelf() {
		rcLogic.stop(this)
	}

	private blockVisible_ = true 
	setBlockVisible(b:boolean) {
		this.blockVisible_ = b 
		rcLogic.getInstance().contentDirty = true 
	}

	isBlockVisible() {
		return this.blockVisible_
	}

	isLogicValid() {
		return cc.isValid(this)
	}
}