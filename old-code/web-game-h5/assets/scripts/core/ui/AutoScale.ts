import { UIBase } from "./UIBase";

const {ccclass, property, executeInEditMode, menu} = cc._decorator;

export enum ScaleType {
	Bigger,
	Smaller,
	FullSize,
}
@ccclass
@executeInEditMode
@menu("kcore/AutoScale")
export default class AutoScale extends cc.Component {
	@property(cc.Node)
	target:cc.Node = null

	@property({type:cc.Enum(ScaleType),tooltip:"Bigger:保持宽高比，最大缩放\nSmaller:保持宽高比，最小缩放\nFullSize:宽高单独缩放"})
	scaleType:ScaleType = ScaleType.Bigger

	@property({tooltip:"只进行X轴缩放"})
	xOnly:boolean = false
	start() {
		if(this.target == null) {
			return 
		}
		let self = this 
		this.target.on(cc.Node.EventType.SIZE_CHANGED,function() {
			self.onRefreshScale()
		})
		this.node.on(cc.Node.EventType.SIZE_CHANGED,function() {
			self.onRefreshScale()
		})
		this.onRefreshScale()
	}

	onRefreshScale() {
		let targetSize = this.target.getContentSize()
		let thisSize = this.node.getContentSize()
		if(this.xOnly) {
			let scale = targetSize.width / thisSize.width
			this.node.scaleX = scale 
			return 
		}
		switch(this.scaleType) {
			case ScaleType.Bigger: {
				let sx = targetSize.width / thisSize.width
				let sy = targetSize.height / thisSize.height
				let s = sx > sy ? sx : sy 
				this.node.scale = s  
			} break;
			case ScaleType.Smaller: {
				let sx = targetSize.width / thisSize.width
				let sy = targetSize.height / thisSize.height
				let s = sx < sy ? sx : sy 
				this.node.scale = s  
			} break;
			case ScaleType.FullSize: {
				let sx = targetSize.width / thisSize.width
				let sy = targetSize.height / thisSize.height
				this.node.scaleX = sx 
				this.node.scaleY = sy 
			} break;
		}
	}

	update() {
		if(CC_EDITOR) {
			if(this.target == null) {
				return 
			}
			this.onRefreshScale()
		}
	}
}
