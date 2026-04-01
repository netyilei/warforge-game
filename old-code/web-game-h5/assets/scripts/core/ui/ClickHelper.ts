
export class UIClickHelper {
	constructor(node:cc.Node) {
		this.root_ = node 
	}
	private root_:cc.Node

	r(nodeName:string | cc.Node | cc.Button,func,silence?:boolean) {
		let node:cc.Node = null 
		if(typeof(nodeName) == "string") {
			node = this.root_.child(nodeName)
		} else if(nodeName instanceof cc.Node) {
			node = nodeName
		} else if(nodeName instanceof cc.Button) {
			node = nodeName.node 
		} 
		if(node == null) {
			return this 
		}
		let btn = node.getComponent(cc.Button)
		if(btn) {
			// let clickEventHandler = new cc.Component.EventHandler();
			// clickEventHandler.target = node; //这个 node 节点是你的事件处理代码组件所属的节点
			// clickEventHandler.component = "MyComponent";//这个是代码文件名
			// clickEventHandler.handler = "callback";
			// clickEventHandler.customEventData = "foobar";
		
			// let button = node.getComponent(cc.Button);
			// button.clickEvents.push(clickEventHandler);
			node.on("click",function() {
				if(!silence) {
					kcore.audio.playEffect("effect_btn_click")
				}
				func()
			})
		} else {
			node.on(cc.Node.EventType.TOUCH_END,function() {
				if(!silence) {
					kcore.audio.playEffect("effect_btn_click")
				}
				func()
			})
		}
		return this 
	}
	
	static create(node:cc.Node) {
		return new UIClickHelper(node)
	}

	private static defaultHelper = new UIClickHelper(null)
	static click(node:cc.Node | cc.Button,func,silence?:boolean) {
		return UIClickHelper.defaultHelper.r(node,func,silence)
	}

	static playAudio() {
		kcore.audio.playEffect("effect_btn_click")
	}
}