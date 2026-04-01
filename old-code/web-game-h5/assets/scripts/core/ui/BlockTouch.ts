
const {ccclass, property} = cc._decorator;

@ccclass
export class BlockTouch extends cc.Component {

	onLoad() {
		this.node.on(cc.Node.EventType.TOUCH_START,function() {
			
		})
	}
}