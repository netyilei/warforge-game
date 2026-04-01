import { UIClickHelper } from "../../../core/ui/ClickHelper";
import { rcApis } from "../../../core/utils/Utils";

const {ccclass, property} = cc._decorator;


@ccclass
export class CreateGame_Toggle extends cc.Component {
	@property(cc.Button)
	checkBtn:cc.Button = null
	@property(cc.Node)
	nodeCheckMark:cc.Node = null
	@property(cc.Label)
	lblContent:cc.Label = null

	onLoad() {
		let self = this
		this.isChecked_ = this.nodeCheckMark.active
		UIClickHelper.click(this.checkBtn,rcApis.handler(this,this.onToggleChanged))

		this.lblContent.node.on(cc.Node.EventType.TOUCH_END,function() {
			UIClickHelper.playAudio()
			self.onToggleChanged()
		})
	}
	private func_:Function
	setToggleInfo(name:string,func:(b:boolean)=>void) {
		this.lblContent.string = name
		this.func_ = func
	}

	setFunc(func:(b:boolean)=>void) {
		this.func_ = func
	}

	onToggleChanged() {
		if(this.isMutex && this.nodeCheckMark.active) {
			this.nodeCheckMark.active = true
			return
		}
		this.isChecked = !this.nodeCheckMark.active
		if(this.func_) {
			this.func_(this.isChecked)
		}
	}

	private isChecked_ = false
	get isChecked() {
		return this.isChecked_
	}

	set isChecked(b) {
		this.isChecked_ = b
		this.refreshMark()
	}

	private isMutex_:boolean = false
	get isMutex() {
		return this.isMutex_
	}
	set isMutex(v) {
		this.isMutex_ = v
	}

	private touchEnabled_:boolean = true
	get touchEnabled() {
		return this.touchEnabled_
	}
	set touchEnabled(v) {
		this.touchEnabled_ = v
		this.refreshMark()
	}

	private touchDisableSelectEnabled_:boolean = false
	get touchDisableSelectEnabled() {
		return this.touchDisableSelectEnabled_
	}
	set touchDisableSelectEnabled(v) {
		this.touchDisableSelectEnabled_ = v
	}
	refreshMark() {
		if(this.touchEnabled) {
			this.nodeCheckMark.active = this.isChecked
			this.checkBtn.interactable = true
		} else {
			this.nodeCheckMark.active = this.touchDisableSelectEnabled ? this.isChecked : false
			this.checkBtn.interactable = false
		}
	}
}
