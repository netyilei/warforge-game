import { CreateGame_Toggle } from "./CreateGame_Toggle";

const {ccclass, property} = cc._decorator;

@ccclass
export class CreateGame_Ju extends CreateGame_Toggle {
	@property(cc.Label)
	lblCount:cc.Label = null

	setInfo(name:string,money:number,func?:(b:boolean)=>void) {
		this.setToggleInfo(name,func)
		this.lblCount.string = `x${money}`
	}
}