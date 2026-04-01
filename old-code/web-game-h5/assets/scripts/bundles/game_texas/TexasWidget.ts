const { ccclass, property, requireComponent } = cc._decorator

@ccclass
@requireComponent(cc.Widget)
export default class TexasWidget extends cc.Component {
	_widget: cc.Widget = null
	get widget() {
		if (this._widget == null) {
			this._widget = this.node.widget
		}
		return this._widget
	}

	protected onLoad(): void {
		this.widget.target = this.node.parent.parent
		this.widget.updateAlignment()
	}
}
