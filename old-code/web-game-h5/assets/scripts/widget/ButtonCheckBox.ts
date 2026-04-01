import { UIClickHelper } from "../core/ui/ClickHelper";
import { rcApis } from "../core/utils/Utils";


const {ccclass, property} = cc._decorator;


@ccclass
export class ButtonCheckBox extends cc.Component {
	@property(cc.Button)
	checkBtn:cc.Button = null
	@property(cc.Node)
	nodeCheckMark:cc.Node = null
	@property([cc.Node])
	nodeUnCheckOthers:cc.Node[] = []
	@property([cc.Node])
	nodeCheckOthers:cc.Node[] = []
	@property()
	isMutex:boolean = false

	onLoad() {
		let self = this 
		UIClickHelper.click(this.checkBtn,rcApis.handler(this,this.onToggleChanged),true)
	}
	private func_:Function
	setFunc(func:(b:boolean)=>void) {
		this.func_ = func 
	}

	onToggleChanged() {
        kcore.click.playAudio()
		if(this.isMutex && this.nodeCheckMark.active) {
			this.nodeCheckMark.active = true 
			return 
		}
		this.isChecked = !this.nodeCheckMark.active
		if(this.func_) {
			this.func_(this.isChecked)
		}
	}

	get isChecked() {
		return this.nodeCheckMark.active
	}

	set isChecked(b) {
		this.nodeCheckMark.active = b 
		//this.checkBtn.isChecked = b
		if(this.nodeUnCheckOthers) {
			for(let n of this.nodeUnCheckOthers) {
				n.active = !this.isChecked	
			}
		}
		if(this.nodeCheckOthers) {
			for(let n of this.nodeCheckOthers) {
				n.active = this.isChecked	
			}
		}
	}
}
