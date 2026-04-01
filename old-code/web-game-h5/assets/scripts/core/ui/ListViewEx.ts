

const {ccclass, property} = cc._decorator;

export type LVSetupFunction = (idx:number,node:cc.Node,forClean?:boolean)=>boolean
@ccclass
export class ListViewEx extends cc.Component {

	private view_:cc.ScrollView = null
	get view() {
		return this.view_
	}
	set view(v) {
		this.view_ = v
	}
	private prefab_:cc.Prefab | (()=>cc.Node) = null 
	get prefab() {
		return this.prefab_
	}
	set prefab(v) {
		this.prefab_ = v
	}

	private itemCount_:number = 0
	get itemCount() {
		return this.itemCount_
	}
	set itemCount(v) {
		this.itemCount_ = v
		this.onItemCount()
	}

	private startIndex_:number = -1
	get startIndex() {
		return this.startIndex_
	}
	set startIndex(v) {
		this.startIndex_ = v
	}

	private maxIndexInView_:number = 0
	get maxIndexInView() {
		return this.maxIndexInView_
	}
	set maxIndexInView(v) {
		this.maxIndexInView_ = v
	}

	private itemSize_:cc.Size = null
	get itemSize() {
		return this.itemSize_
	}
	set itemSize(v) {
		this.itemSize_ = cc.size(v)
	}

	private itemAp_:cc.Vec2 = null 
	get itemAp() {
		return this.itemAp_
	}
	set itemAp(v) {
		this.itemAp_ = cc.v2(v)
	}

	private rootNode_:cc.Node = null 
	get rootNode() {
		return this.rootNode_
	}
	set rootNode(v) {
		this.rootNode_ = v
	}

	private layoutNode_:cc.Node = null 
	get layoutNode() {
		return this.layoutNode_
	}
	set layoutNode(v) {
		this.layoutNode_ = v
	}

	private unusedActive_:boolean = false
	get unusedActive() {
		return this.unusedActive_
	}
	set unusedActive(v) {
		this.unusedActive_ = v
	}

	private setupFunction_:LVSetupFunction = null
	get setupFunction() {
		return this.setupFunction_
	}
	set setupFunction(v) {
		this.setupFunction_ = v
	}

	private createItem() {
		if(typeof(this.prefab) == "function") {
			let node = this.prefab()
			node.active = true 
			return node 
		}
		let node = kcore.display.instantiate(this.prefab)
		node.active = true 
		return node 
	}
	private nodeInfos_:{
		itemNode:cc.Node,
		idx:number,
	}[] = []
	initWithView(view:cc.ScrollView,itemPrefab:cc.Prefab | (()=>cc.Node),func:LVSetupFunction) {
		this.view = view 
		this.prefab = itemPrefab
		this.setupFunction = func 

		view.content.destroyAllChildren()

		let nodeTest = this.createItem()
		this.itemSize = nodeTest.getContentSize()
		this.itemAp = nodeTest.getAnchorPoint()

		this.layoutNode = this.view.content

		this.rootNode = new cc.Node()
		this.layoutNode.addChild(this.rootNode)
		
		let viewSize = this.view.node.getContentSize()
		if(this.view.horizontal) {
			this.rootNode.setAnchorPoint(0,0.5)
			let maxCount = Math.ceil(viewSize.width / this.itemSize.width) 
			this.maxIndexInView = maxCount + 1
		} else {
			this.rootNode.setAnchorPoint(0.5,1)
			let maxCount = Math.ceil(viewSize.height / this.itemSize.height) 
			this.maxIndexInView = maxCount + 1
		}

		for(let i = 0 ; i < this.maxIndexInView ; i ++) {
			let itemNode:cc.Node = null 
			if(i == 0) {
				itemNode = nodeTest 
			} else {
				itemNode = this.createItem()
			}
			this.nodeInfos_.push({
				itemNode:itemNode,
				idx:-1,
			})
			this.rootNode.addChild(itemNode)
			itemNode.active = false 
		}
	}
	onItemCount() {
		let size:cc.Size = null 
		if(this.view_.horizontal) {
			size = cc.size(this.itemSize.width * this.itemCount,this.itemSize.height)
		} else {
			size = cc.size(this.itemSize.width,this.itemSize.height * this.itemCount)
		}
		this.rootNode.setContentSize(size)
		this.refreshCallItems(true)
	}

	refreshIndex(idx:number) {
		let info = this.nodeInfos_.find(v=>v.idx == idx)
		if(info) {
			if(this.setupFunction) {
				this.setupFunction(idx,info.itemNode)
			}
		}
	}

	refreshRange(start:number,count:number) {
		for(let i = start ; i < start + count ; i ++) {
			this.refreshIndex(i)
		}
	}
	
	refreshCallItems(force?:boolean) {
		if(this.startIndex < 0) {
			return 
		}
		// 先交换
		for(let idx = this.startIndex ; idx < this.startIndex + this.maxIndexInView ; idx ++) {
			let nodeIndex = idx - this.startIndex
			let info = this.nodeInfos_[nodeIndex]

			if(idx < this.itemCount) {
				if(force) {
				} else {
					if(info.idx == idx) {
					} else {
						let otherIdx = this.nodeInfos_.findIndex(v=>v.idx == idx && v.itemNode.active)
						if(otherIdx >= 0) {
							let otherInfo = this.nodeInfos_[otherIdx]
							let pos = otherInfo.itemNode.position2
							otherInfo.itemNode.position2 = info.itemNode.position2
							info.itemNode.position2 = pos 
							
							this.nodeInfos_[otherIdx] = info 
							this.nodeInfos_[nodeIndex] = otherInfo

							// info.itemNode.active = this.unusedActive_ 
							// info.idx = -1
							
							// info = otherInfo
						} else {
						}
					}
				}
			}
		}
		// 再设置
		for(let idx = this.startIndex ; idx < this.startIndex + this.maxIndexInView ; idx ++) {
			let nodeIndex = idx - this.startIndex
			let info = this.nodeInfos_[nodeIndex]
			let setup = false 
			let clearWhenNoSetup = true 
			if(idx < this.itemCount) {
				let posChange = true 
				if(force) {
					setup = true 
				} else {
					if(info.idx == idx) {
						setup = false 
						clearWhenNoSetup = false 
					} else {
						// let otherIdx = this.nodeInfos_.findIndex(v=>v.idx == idx && v.itemNode.active)
						// if(otherIdx >= 0) {
						// 	setup = false 
						// 	clearWhenNoSetup = false 
						// 	let otherInfo = this.nodeInfos_[otherIdx]
						// 	let pos = otherInfo.itemNode.position2
						// 	otherInfo.itemNode.position2 = info.itemNode.position2
						// 	info.itemNode.position2 = pos 
							
						// 	this.nodeInfos_[otherIdx] = info 
						// 	this.nodeInfos_[nodeIndex] = otherInfo

						// 	info.itemNode.active = this.unusedActive_ 
						// 	info.idx = -1
							
						// 	info = otherInfo
						// } else {
							setup = true 
						//}
					}
				}
				if(setup) {
					if(this.setupFunction) {
						setup = this.setupFunction(idx,info.itemNode)
					}
					info.itemNode.active = true 
					info.idx = idx 
				}
				if(posChange) {
					info.itemNode.position2 = this.getIndexPosition(idx)
					//rcLog("change pos idx = " + idx + " | pos = " + this.getIndexPosition(idx))
				}
			}
			if(!setup && clearWhenNoSetup) {
				info.itemNode.active = this.unusedActive_ 
				info.idx = -1
				this.setupFunction(idx,info.itemNode,true)
			}
		}
	}

	getIndexPosition(idx:number) {
		let x = 0
		let y = 0
		if(this.view.horizontal) {
			x = (idx + this.itemAp.x) * this.itemSize.width
		} else {
			y = -(idx + 1 - this.itemAp.y) * this.itemSize.height
		}
		return cc.v2(x,y)
	}

	getCurStartIndex() {
		let offset = this.view.getScrollOffset()
		let idx = 0
		if(this.view.horizontal) {
			idx = Math.floor((-offset.x / this.itemSize.width))
		} else {
			idx = Math.floor((offset.y / this.itemSize.height))
		}
		return idx 
	}

	jumpToTop() {
		if(this.view.horizontal) {
			this.view.scrollToLeft()
		} else {
			this.view.scrollToTop()
		}
		this.startIndex = 0
		this.refreshCallItems()
	}

	update() {
		let startIdx = this.getCurStartIndex()
		if(startIdx < 0) {
			startIdx = 0
		}
		if(this.startIndex != startIdx) {
			//rcLog("start idx change to " + startIdx + " | cur = " + this.startIndex)
			this.startIndex = startIdx
			this.refreshCallItems()
		}
	}
}

export namespace ListViewEx {
	export function create(view:cc.ScrollView,itemPrefab:cc.Prefab | (()=>cc.Node),func:LVSetupFunction) {
		let com = view.node.getComponent(ListViewEx)
		if(com) {
			kcore.log.info("[list] cannot add listview twice")
			return com 
		}
		com = view.node.addComponent(ListViewEx)
		com.initWithView(view,itemPrefab,func)
		return com 
	}
}