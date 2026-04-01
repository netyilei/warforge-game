import { CreateGame_Line } from "./CreateGame_Line"
import { CreateGame_Toggle } from "./CreateGame_Toggle"

export interface ICreateGameDelegate {
	templateGameName:cc.Node
	templateLine:cc.Node
	templateCheckNormal:cc.Node
	templateCheckMutex:cc.Node
	templateJu:cc.Node
	nodeSetupLayout:cc.Node
	nodeCheckLayout:cc.Node

	addExtension(ext:tGameConfigExtension,isNew?:boolean);
	addSystemOption();
	refreshRenderer();
}
export namespace ICreateGameDelegate {
	export class SetupGroup {
		constructor(lineName:string,layer:ICreateGameDelegate,lineItemCount?:number) {
			this.layer_ = layer 

			this.curCount_ = 0
			this.lineItemCount_ = lineItemCount || 3
			
			this.curLine_ = this.addLine(lineName)
		}

		private layer_:ICreateGameDelegate
		private curLine_:CreateGame_Line
		private coms_:CreateGame_Toggle[] = []
		private curCount_ = 0
		private lineItemCount_:number
		addNode(nodeTemplate:cc.Node) {
			if(this.curLine_ == null) {
				this.curLine_ = this._addLine(null)
				this.curCount_ = 0
			}
			let node = kcore.display.instantiate(nodeTemplate)
			node.active = true 
			this.curLine_.addNode(node)
			let com = node.getComponent(CreateGame_Toggle)
			this.coms_.push(com)
			this.curCount_ ++
			if(this.curCount_ == this.lineItemCount_) {
				this.curLine_ = null 
			}
			return com 
		}

		addLine(name?:string,lineItemCount?:number) {
			this.curLine_ = this._addLine(name)
			this.curCount_ = 0
			if(lineItemCount) {
				this.lineItemCount_ = lineItemCount
			}
			return this.curLine_
		}
		private _addLine(name?:string) {
			let node = kcore.display.instantiate(this.layer_.templateLine)
			node.active = true 
			this.layer_.nodeSetupLayout.addChild(node)
			let ret = node.getComponent(CreateGame_Line)
			ret.setInfo(name)
			ret.setLineItemCount(this.lineItemCount_)
			return ret 
		}

		setMutexCheck(exceptCom?:CreateGame_Toggle) {
			for(let com of this.coms_) {
				if(com == exceptCom) {
					com.isChecked = true 
					continue 
				}
				com.isChecked = false 
			}
		}
	}
}
