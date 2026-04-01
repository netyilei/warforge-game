const { ccclass, property, menu } = cc._decorator

@ccclass
@menu('ui/ListView')
export class ListView extends cc.Component {
	private rootNode: cc.Node = null
	private view: cc.ScrollView = null
	private item: cc.Node = null
	private func: SetupCall = null
	private _count: number = 0
	private nodePool: cc.NodePool = null
	private shoing: number[] = []
	public set count(v: number) {
		this._count = v
		this.setRootNodeHeight(v)
		this.onRefreshView()
		// if (v == 0) {
		//     this.bottomCall && this.bottomCall();
		// }
	}

	public get count(): number {
		return this._count
	}

	private bottomCall: () => void = null
	public getLoadNext(call: () => void) {
		this.bottomCall = call
	}

	public initView(view: cc.ScrollView, item: cc.Node, func: SetupCall) {
		this.view = view
		this.item = item
		this.func = func
		this.createRootNode()
		this.createNodePool()

		this.view.content.on(
			cc.Node.EventType.POSITION_CHANGED,
			this.onRefreshView.bind(this)
		)
		this.view.node.on('scroll-to-bottom', () => {
			this.bottomCall && this.bottomCall()
		})
	}

	private createNodePool() {
		this.nodePool = new cc.NodePool()
	}

	private createRootNode() {
		let content: cc.Node = this.view.content
		this.rootNode = cc.instantiate(content)
		try {
			this.rootNode.removeComponent(cc.Layout)
		} catch (error) {
			// Log.attention("滚动视窗的content节点上没有cc.Layout组件");
		}
		this.rootNode.parent = content
	}

	private onRefreshView() {
		let height: number = this.view.node.height
		let y: number = this.view.content.y
		let itemHeight: number = this.item.height
		let from: number = Math.floor(y / itemHeight)
		let to: number = Math.ceil((height + y) / itemHeight)
		let start: number = 0
		let end: number = 0
		for (let a = from; a <= to; a++) {
			if (a == from) {
				start = -(itemHeight * a + itemHeight / 2)
			} else if (a == to) {
				end = -(itemHeight * a + itemHeight / 2)
			}
			if (this.shoing.indexOf(a) == -1) {
				let node: cc.Node = this.getItem()
				node.idx = a
				let status: boolean = this.func(a, node)
				if (status) {
					let vec2: cc.Vec2 = cc.Vec2.ZERO
					vec2.y = -(itemHeight * a + itemHeight / 2)
					node.setPosition(vec2)
					node.parent = this.rootNode
					this.shoing.push(a)
				} else {
					this.recycleItem(node)
				}
			}
		}
		//回收超出范围的节点
		this.rootNode.children.forEach((item: cc.Node) => {
			if (item.y > start || item.y < end) {
				this.recycleItem(item)
				let index: number = this.shoing.indexOf(item.idx)
				if (index != -1) this.shoing.splice(index, 1)
			}
		})
	}

	private setRootNodeHeight(count: number) {
		this.rootNode.height = count * this.item.height
	}

	private getItem(): cc.Node {
		let enemy: cc.Node = null
		if (this.nodePool.size() > 0) {
			// 通过 size 接口判断对象池中是否有空闲的对象
			enemy = this.nodePool.get()
		} else {
			// 如果没有空闲对象，也就是对象池中备用对象不够时，我们就用 cc.instantiate 重新创建
			enemy = cc.instantiate(this.item)
		}
		return enemy
	}

	public recycleItem(enemy: cc.Node) {
		this.nodePool.put(enemy)
	}

	private recycleAllItem() {
		this.rootNode.children.forEach((enemy: cc.Node) => {
			this.nodePool.put(enemy)
		})
	}
	public async clear(force: boolean = true) {

        if(force){
            this.recycleAllItem()
            this.view.content.y = 0
        }
		this.rootNode.destroyAllChildren()
		this.shoing = []
		// let tag: string = 'ListView'
		// Loading.instance.begin(tag);
		return new Promise<void>((resolve, reject) => {
			this.scheduleOnce(() => {
				resolve()
				// Loading.instance.stop(tag);
			}, 0.1)
		})

		// this._count = 0;
		// this.rootNode.destroy();
		// this.rootNode = null;
		// this.view = null;
		// this.item = null;
		// this.func = null;
		// this.nodePool.clear();
		// this.nodePool = null;
	}
}
export namespace ListView {
	export function create(view: cc.ScrollView, item: cc.Node, func: SetupCall) {
		let com: ListView = view.node.getComponent(ListView)
		if (com) {
			// Log.attention('不能创建两次ListView');
			return com
		}
		com = view.node.addComponent(ListView)
		view.elastic = false
		com.initView(view, item, func)
		let count: number = 50
		for (let a = 0; a < count; a++) {
			let node: cc.Node = cc.instantiate(item)
			com.recycleItem(node)
		}
		return com
	}
}
export type SetupCall = (
	idx: number,
	node: cc.Node,
	forClean?: boolean
) => boolean
