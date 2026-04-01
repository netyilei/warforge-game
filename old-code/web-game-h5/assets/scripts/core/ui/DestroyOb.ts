
const {ccclass, property} = cc._decorator;

let eventName = "_onDestroy_"
export class DestroyOb extends cc.Component {
	static getCom(node:cc.Node):DestroyOb {
		let com = node.getComponent(DestroyOb)
		if(com == null) {
			com = node.addComponent(DestroyOb)
		}
		return com
	}

	private disp_:kcore.IEventDispatcher
	get disp() {
		this.disp_ = this.disp_ || kcore.disp()
		return this.disp_
	}
	listen(func:Function) {
		// let disp = this.disp_.addNode(this.node,"__destroy_ob__" + Date.now())
		// disp.listen(eventName,function() {
		// 	func()
		// })
		this.disp.listen(eventName,function(...params) {
			func(...params)
		})
	}

	protected onDestroy() {
		this.disp.dispatch(eventName)
		this.disp.clear()
	}
}

export function rcDestroy(node:cc.Node,func:Function) {
	DestroyOb.getCom(node).listen(func)
}

class _Internal_NodeCycle implements kcore.INodeCycle {
	listenDestroy(node: cc.Node, func: Function) {
		DestroyOb.getCom(node).listen(func)
	}
}

export let NodeCycle = new _Internal_NodeCycle()