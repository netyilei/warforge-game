import { UIBase } from "../../core/ui/UIBase"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/EnterCodeLayer")
export default class EnterCodeLayer extends UIBase {

	@property(cc.Node)
	nodePlaceHolder:cc.Node = null
	@property([cc.Label])
	lbls:cc.Label[] = []

	onPush(...params: any[]): void {
		this.code_ = ""
		this.updateCodeShow()
	}
	private code_:string 
	private updateCodeShow() {
		for(let i = 0; i < this.lbls.length; ++i) {
			if(this.code_ && i < this.code_.length) {
				this.lbls[i].string = this.code_.charAt(i)
			} else {
				this.lbls[i].string = ""
			}
		}
		this.nodePlaceHolder.active = !(this.code_ && this.code_.length > 0)
	}
	onClickNum(_,num:string) {
		kcore.click.playAudio()
		if(this.code_ == null) {
			this.code_ = ""
		}
		if(this.code_.length >= 6) {
			return
		}
		this.code_ += num.toString()
		this.updateCodeShow()
	}

	onClickClear() {
		kcore.click.playAudio()
		this.code_ = ""
		this.updateCodeShow()
	}

	onClickDel() {
		kcore.click.playAudio()
		if(CC_DEV) {
			let roomID = kcore.storage.getValue("dev_cache_roomid")
			if(roomID) {
				kcore.layer.enterGameByRoomID(roomID)
				return
			}
		}
		if(this.code_ && this.code_.length > 0) {
			this.code_ = this.code_.substring(0, this.code_.length - 1)
			this.updateCodeShow()
		}
	}

	onClickEnter() {
		kcore.click.playAudio()
		if(this.code_ == null || this.code_.length != 6) {
			kcore.toast.push("请输入6位房间码")
			return
		}
		kcore.layer.enterGame(this.code_)
	}
}