import VMultiLangIgnoreLabel from "./VMultiLangIgnoreLabel"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('kcore/VMultiLangLabel')
export default class VMultiLangLabel extends cc.Component {
	lbl:cc.Label
	private prevSetupStr_:string = null
	private prevAfterStr_:string = null 
	onLoad() {
		if(this.node.getComponent(VMultiLangIgnoreLabel)) {
			return
		}
		this.lbl = this.node.getComponent(cc.Label)
		if(this.lbl) {
			this.prevSetupStr_ = this.lbl.string
			kcore.lang?.addLabel(this)
			this.prevAfterStr_ = this.lbl.string
		}
	}
	protected onDestroy(): void {
		if(this.lbl) {
			kcore.lang?.removeLabel(this)
		}
	}
	protected lateUpdate(dt: number): void {
		if(this.lbl && this.lbl.string !== this.prevAfterStr_) {
			this.prevSetupStr_ = this.lbl.string
			kcore.lang?.updateLabel(this)
			this.prevAfterStr_ = this.lbl.string
		}
	}
}