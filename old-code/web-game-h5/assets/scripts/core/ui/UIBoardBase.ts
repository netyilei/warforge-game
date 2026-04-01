import { UIBase } from "./UIBase";

const {ccclass, property, requireComponent} = cc._decorator;

export class UIBoardBase extends UIBase {
	get uiType() {
		return UIType.Board
	}
	
	onFocus(b:boolean):boolean {
		return false 
	}
	onDead() {
		return false 
	}
	_onPush(popFunc:Function,...params:any[]) {
		if(kcore.cache) {
			kcore.cache.pushStack(this.node)
		}
		super._onPush(popFunc,...params)
	}
}