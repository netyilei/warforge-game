import { CreateGame_Toggle } from "./CreateGame_Toggle";

const {ccclass, property} = cc._decorator;

@ccclass
export class CreateGame_Line extends cc.Component {
	@property(cc.Label)
	lblName:cc.Label = null
	@property(cc.Node)
	rootNode:cc.Node = null
	@property([cc.Float])
	countLayoutOffset:number[] = []
	setInfo(name?:string) {
		if(name) {
			this.lblName.string = name + ":"
		} else {
			this.lblName.string = " "
		}
	}

	setLineItemCount(count:number) {
		let offset = this.countLayoutOffset[count] || 0
		let layout = this.rootNode.getComponent(cc.Layout)
		if(layout) {
			layout.spacingX = offset
		}
	}

	private items_:CreateGame_Toggle[] = []
	get items() {
		return this.items_
	}

	addNode(node:cc.Node) {
		this.rootNode.addChild(node)
		let com = node.getComponent(CreateGame_Toggle)
		this.items_.push(com)
	}
}
