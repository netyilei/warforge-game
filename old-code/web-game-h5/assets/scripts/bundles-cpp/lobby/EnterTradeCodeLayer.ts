import { UIBase } from "../../core/ui/UIBase"
import { ButtonCheckBox } from "../../widget/ButtonCheckBox"

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/EnterTradeCodeLayer')
export default class EnterTradeCodeLayer extends UIBase {
	@property(cc.EditBox)
	editCode:cc.EditBox = null
	@property(ButtonCheckBox)
	check:ButtonCheckBox = null

	private func_:Function = null
	onPush(func:Function) {
		this.maskPopEnabled = false 
		this.func_ = func
		this.editCode.string = ""

		this.check.isChecked = false
		this.check.setFunc(()=>{
			this.onToggleChanged()
		})
		this.onToggleChanged()
	}

	onToggleChanged() {
		this.editCode.inputFlag = this.check.isChecked ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD
	}

	onClickConfirm() {
		kcore.click.playAudio()
		let code = this.editCode.string.trim()
		if(!code) {
			kcore.tip.push("提示","请输入交易密码")
			return 
		}
		this.func_(code)
		this.popSelf()
	}
}
