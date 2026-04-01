

const { ccclass, property, menu } = cc._decorator


@ccclass
export default class FoldoutItemWidget extends cc.Component {
	@property(cc.Node)
	nodeSel:cc.Node = null
	@property(cc.Node)
	nodeUnSel:cc.Node = null
	@property(cc.Label)
	lblContent:cc.Label = null

	private sel_:boolean = false 
	get sel() {
		return this.sel_
	}
	set sel(v) {
		this.sel_ = v

		this.nodeSel && (this.nodeSel.active = v) 
		this.nodeUnSel && (this.nodeUnSel.active = !v)
	}

	private clickFunc_:(item:FoldoutItemWidget) => void = null 
	get clickFunc() {
		return this.clickFunc_
	}
	set clickFunc(v) {
		this.clickFunc_ = v
	}
	onClick() {
		if (this.clickFunc_) {
			this.clickFunc_(this)
		}
	}
}