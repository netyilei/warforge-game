import FoldoutItemWidget from "./FoldoutItemWidget"


const { ccclass, property, menu } = cc._decorator


@ccclass
export default class Foldout extends cc.Component {
	@property(cc.Node)
	nodeTagUnShow:cc.Node = null
	@property(cc.Node)
	nodeTagShow:cc.Node = null
	@property(cc.Node)
	nodeFoldout:cc.Node = null
	@property(cc.Node)
	nodeLayout:cc.Node = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property(cc.Label)
	lblContent:cc.Label = null

	protected onLoad(): void {
		this.nodeTemplate.active = false 
	}

	private selFunc_:(idx:number,content:any) => void = null
	setup(contents:string[],defaultIdx?:number,selFunc?:(idx:number,content:string) => void) {
		this.selFunc_ = selFunc
		this.nodeLayout.destroyAllChildren()
		this.items_.splice(0)
		for(let content of contents) {
			let node = kcore.display.instantiate(this.nodeTemplate)
			node.active = true 
			let com = node.getComponent(FoldoutItemWidget)
			this.items_.push(com)
			this.nodeLayout.addChild(node)
			com.lblContent.string = content

			com.clickFunc = (item)=>{
				let idx = this.items_.findIndex(v=>v == item)
				this.idx = idx
				selFunc && selFunc(idx,content)
				this.showFoldout = false 
			}
		}
		this.idx = defaultIdx
		this.showFoldout = false 
	}

	private contentFunc_:(data:any,node:cc.Node,com:FoldoutItemWidget,idx:number)=>void = null
	setupCustom<T>(datas:T[],contentFunc:(data:T,node:cc.Node,com:FoldoutItemWidget,idx:number)=>void,defaultIdx?:number,selFunc?:(idx:number,data:T)=>void) {
		this.selFunc_ = selFunc
		this.contentFunc_ = contentFunc
		this.nodeLayout.destroyAllChildren()
		this.items_.splice(0)
		for(let i = 0 ; i < datas.length ; i ++) {
			let data = datas[i]
			let node = kcore.display.instantiate(this.nodeTemplate)
			node.active = true 
			let com = node.getComponent(FoldoutItemWidget)
			this.items_.push(com)
			this.nodeLayout.addChild(node)
			contentFunc(data,node,com,i)
			com.clickFunc = (item)=>{
				let idx = this.items_.findIndex(v=>v == item)
				this.idx = idx
				selFunc && selFunc(idx,data)
				this.showFoldout = false 
			}
		}
		this.idx = defaultIdx
		this.showFoldout = false 
	}
	
	changeContents(contents:string[]) {
		let idx = this.idx
		this.nodeLayout.destroyAllChildren()
		this.items_.splice(0)
		for(let content of contents) {
			let node = kcore.display.instantiate(this.nodeTemplate)
			node.active = true 
			let com = node.getComponent(FoldoutItemWidget)
			this.items_.push(com)
			this.nodeLayout.addChild(node)
			com.lblContent.string = content

			com.clickFunc = (item)=>{
				let idx = this.items_.findIndex(v=>v == item)
				this.idx = idx
				this.selFunc_ && this.selFunc_(idx,content)
				this.showFoldout = false 
			}
		}
		this.idx = idx
		this.showFoldout = false 
	}
	changeCustom<T>(contents:T[]) {
		let idx = this.idx
		this.nodeLayout.destroyAllChildren()
		this.items_.splice(0)
		for(let i = 0 ; i < contents.length ; i ++) {
			let content = contents[i]
			let node = kcore.display.instantiate(this.nodeTemplate)
			node.active = true 
			let com = node.getComponent(FoldoutItemWidget)
			this.items_.push(com)
			this.nodeLayout.addChild(node)
			this.contentFunc_ && this.contentFunc_(content,node,com,i)

			com.clickFunc = (item)=>{
				let idx = this.items_.findIndex(v=>v == item)
				this.idx = idx
				this.selFunc_ && this.selFunc_(idx,content)
				this.showFoldout = false 
			}
		}
		this.idx = idx
		this.showFoldout = false 
	}
	private items_:FoldoutItemWidget[] = []
	private idx_:number = -1
	get idx() {
		return this.idx_
	}
	set idx(v) {
		if(v == null || v < 0) {
			v = 0
		}
		if(v >= this.items_.length) {
			v = this.items_.length - 1
		}
		this.idx_ = v
		for(let i = 0 ; i < this.items_.length ; i ++) {
			let item = this.items_[i]
			item.sel = (i == this.idx_)
			if(item.sel) {
				this.lblContent.string = item.lblContent.string 
			}
		}
	}
	private showFoldout_:boolean = false 
	get showFoldout() {
		return this.showFoldout_
	}
	set showFoldout(v) {
		this.showFoldout_ = v

		this.nodeTagUnShow.active = !v
		this.nodeTagShow.active = v
		this.nodeFoldout.active = v
	}

	onClickShow() {
		kcore.click.playAudio()
		this.showFoldout = !this.showFoldout
	}
}