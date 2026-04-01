import { UIClickHelper } from "../../../core/ui/ClickHelper";

const {ccclass, property} = cc._decorator;

@ccclass
export class CreateGame_GameName extends cc.Component {

	@property(cc.Label)
	lblSelName:cc.Label = null
	@property(cc.Label)
	lblUnSelName:cc.Label = null

	@property(cc.Node)
	nodeSel:cc.Node = null
	@property(cc.Node)
	nodeUnSel:cc.Node = null

	private func_:Function 
	setInfo(name:string,func:Function) {
		this.func_ = func 

		this.lblSelName.string = name 
		this.lblUnSelName.string = name 
	}

	onClick() {
		UIClickHelper.playAudio()
		this.func_()
	}

	setSelected(b:boolean) {
		this.nodeSel.active = b 
		this.nodeUnSel.active = !b
	}
}