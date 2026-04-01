const { ccclass, property, requireComponent ,executeInEditMode} = cc._decorator

@ccclass
@requireComponent(cc.Slider)
@requireComponent(cc.ProgressBar)
@executeInEditMode()
export default class SliderProgressBar extends cc.Component {
	protected onLoad(): void {}

	_slider: cc.Slider = null
	get slider(): cc.Slider {
		if (this._slider == null) {
			this._slider = this.node.getComponent(cc.Slider)
		}
		return this._slider
	}

	_progressBar: cc.ProgressBar = null
	get progressBar(): cc.ProgressBar {
		if (this._progressBar == null) {
			this._progressBar = this.node.getComponent(cc.ProgressBar)
		}
		return this._progressBar
	}


	protected update(dt: number): void {
        this.progressBar.progress = this.slider.progress
    }
}
