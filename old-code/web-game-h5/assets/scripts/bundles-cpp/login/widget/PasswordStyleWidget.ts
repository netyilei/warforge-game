

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/widgets/PasswordStyleWidget')
export default class PasswordStyleWidget extends cc.Component {
	@property([cc.Sprite])
	sprs:cc.Sprite[] = []
	@property(cc.Label)
	lbl:cc.Label = null

	private edit_:cc.EditBox = null
	link(edit:cc.EditBox) {
		this.edit_ = edit
		this.update(0)
	}

	protected update(dt: number): void {
		if(!this.edit_) {
			this.lbl.string = ""
			this.sprs.forEach((s)=>{
				s.node.active = false 
			})
			return 
		}
		let str = this.edit_ ? this.edit_.string : ""
		let strength:0|1|2|3 = 0
		if(str.length >= 6) {
			let hasLower = /[a-z]/.test(str)
			let hasUpper = /[A-Z]/.test(str)
			let hasNumber = /[0-9]/.test(str)
			let typeCount = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0)
			if(typeCount >= 3) {
				strength = 3
			} else if(typeCount == 2) {
				strength = 2
			} else {
				strength = 1
			}
		}
		for(let i = 0 ; i < this.sprs.length ; i ++) {
			this.sprs[i].node.active = i < strength ? true : false
		}
		let strengthStr = ["弱","中","强"]
		this.lbl.string = strength == 0 ? `${strengthStr[0]}` : `${strengthStr[strength-1]}`
	}
}