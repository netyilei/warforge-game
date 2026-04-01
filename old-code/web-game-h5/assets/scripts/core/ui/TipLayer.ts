import { TipFunc } from "./TipFunc";
import { UIBase } from "./UIBase";



const {ccclass, property} = cc._decorator;

@ccclass 
export class TipLayer extends UIBase {
	get uiType() {
		return UIType.Tip
	}

	@property(cc.Label)
	lblTitle:cc.Label = null
	@property(cc.Label)
	lblContent:cc.Label = null
	
	@property(cc.Node)
	nodeDoubleBtns:cc.Node = null
	@property(cc.Node)
	nodeSingleBtns:cc.Node = null

	@property(cc.Node)
	rootNode:cc.Node = null

	private func_:Function = null
	private block_ = false 
	private btnNum_ = 0
	onPush(title?:string,content?:string,btnNum?:number,func?:(b:boolean)=>any,ignoreBound?:boolean) {
		if(this.lblTitle) {
			this.lblTitle.string = title || "提示"
		}
		if(this.lblContent) {
			this.lblContent.string = content || "这里是提示内容"
		}

		this.func_ = func 
		if(btnNum == null) {
			btnNum = 1
		}
		if(btnNum == 0) {
			this.nodeDoubleBtns.active = false
			this.nodeSingleBtns.active = false
		} else if(btnNum == 2) {
			this.nodeDoubleBtns.active = true
			this.nodeSingleBtns.active = false
		} else {
			this.nodeDoubleBtns.active = false
			this.nodeSingleBtns.active = true
		}

		if(btnNum == 0) {
			this.block_ = true 
		} else {
			this.block_ = false
		}
		this.btnNum_ = btnNum
		if(ignoreBound) {
			this.setIgnoreOutBound()
		}
	}

	onClickOK() {
		kcore.click.playAudio()
		if(this.func_) {
			this.func_(true)
		}
		this.popSelf()
	}

	onClickCancel() {
		kcore.click.playAudio()
		if(this.func_) {
			this.func_(false)
		}
		this.popSelf()
	}

	setIgnoreOutBound() {
		this.block_ = true 
	}
	setTowards(seatNo){
		if(this.rootNode){
			this.rootNode.angle = seatNo*90
		}
		
	}
	
	public onMask() {
		if(this.block_) {
			return 
		}
		if(this.btnNum_ == 1) {
			this.onClickOK()
			return 
		}
		if(this.btnNum_ == 2) {
			this.onClickCancel()
			return 
		}
		this.popSelf()
	}
}

TipFunc.push = function push(title?:string,content?:string,btnNum?:number,func?:(b:boolean)=>any) {
	let node = kcore.ui.pushNoLoad("TipLayer",title,content,btnNum,func)
	if(node) {
		return node.getComponent(TipLayer)
	} else {
		kcore.log.info("tip: error push tipLayer name invalid = " + "TipLayer")
	}
	return null
}