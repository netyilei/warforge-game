import { PreloadManager } from "../utils/PreloadManager";
import { BlockTouch } from "./BlockTouch";
import { NodeUtils } from "./NodeUtils";
import { UIBase } from "./UIBase";


NodeUtils.init()
const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {
	@property(cc.Node)
	nodeTop: cc.Node = null
	@property(cc.Node)
	nodeRoot: cc.Node = null

	@property({ type: cc.Node })
	nodeDropdown: cc.Node = null;

	static get instance() {
		return UIManager.instance_
	}

	private static touchBlock_: boolean = false
	static get touchBlock() {
		return UIManager.touchBlock_
	}
	static set touchBlock(v) {
		UIManager.touchBlock_ = v
		UIManager.instance.blockNode_.active = v
	}

	get root() {
		return this.nodeRoot
	}

	protected time: number = 0;
	get dropdown() {

		let time: number = Date.now()

		if (this.time && time - this.time < 1000) {
			return this.nodeDropdown;
		}
		this.time = time;

		if (this.nodeDropdown.children.length) {
			this.nodeDropdown.destroyAllChildren();
		}
		return this.nodeDropdown;
	}

	get board() {
		let uis = this.uis_.get(UIType.Board)
		if (uis.length > 0) {
			return uis[0]
		}
		return null
	}

	private exceptionFunc_: Function = null
	get exceptionFunc() {
		return this.exceptionFunc_
	}
	set exceptionFunc(v) {
		this.exceptionFunc_ = v
	}

	private restartFunc_: Function = null
	get restartFunc() {
		return this.restartFunc_
	}
	set restartFunc(v) {
		this.restartFunc_ = v
	}

	restart() {
		if (this.restartFunc) {
			this.restartFunc()
		}
	}
	private staticZs_: number[] = []
	private overlapZs_: number[] = []

	private blockNode_: cc.Node = null
	private zs_: number[] = []
	init() {
		let root = this.nodeRoot || cc.Canvas.instance.node
		for (let i = UIType.Board; i < UIType.TypeEnd; i++) {
			this.uis_.set(i, []);
			this.zs_.push(i)
			let rootNode = new cc.Node(UIType[i])

			let widget: cc.Widget = rootNode.addComponent(cc.Widget);
			widget.isAlignTop = true;
			widget.top = 0;
			widget.isAlignBottom = true;
			widget.bottom = 0;
			widget.isAlignLeft = true;
			widget.left = 0;
			widget.isAlignRight = true;
			widget.right = 0;
			widget.alignMode = cc.Widget.AlignMode.ON_WINDOW_RESIZE;
			widget.target = root;
			widget.updateAlignment();


			root.addChild(rootNode, 10000 + i);
			this.rootNodes_.set(i, rootNode)
		}
		this.staticZs_.push(UIType.MatchTip)
		this.staticZs_.push(UIType.Drop)
		this.staticZs_.push(UIType.DropAni)
		this.staticZs_.push(UIType.Group)

		this.overlapZs_.push(UIType.Toast)

		let blockNode = new cc.Node("blockNode")
		blockNode.position2 = cc.v2(0, 0)
		blockNode.setContentSize(cc.Canvas.instance.designResolution)
		blockNode.addComponent(BlockTouch)
		blockNode.active = false
		root.addChild(blockNode, 20000)

		this.blockNode_ = blockNode
	}

	private uis_: Map<UIType, UIBase[]> = new Map<UIType, UIBase[]>();
	private rootNodes_: Map<UIType, cc.Node> = new Map<UIType, cc.Node>();

	private prevBoardInfo_: {
		prefabOrName: cc.Prefab | string,
		params: any[],
	} = null

	private ignoreBoardChangedNext_: boolean = false
	get ignoreBoardChangedNext() {
		return this.ignoreBoardChangedNext_
	}
	set ignoreBoardChangedNext(v) {
		this.ignoreBoardChangedNext_ = v
	}

	getUIClazz<T extends UIBase>(clazz: { new(): T }) {
		for (let z of this.zs_) {
			let uis = this.uis_.get(z)
			for (let ui of uis) {
				if (ui instanceof clazz) {
					return ui
				}
			}
		}
		return null
	}
	getUI(uiName: string) {
		for (let z of this.zs_) {
			let uis = this.uis_.get(z)
			for (let ui of uis) {
				if (ui.uiName == uiName) {
					return ui
				}
			}
		}
		return null
	}
	popUIClazz<T extends UIBase>(clazz: { new(): T }) {
		for (let z of this.zs_) {
			let uis = this.uis_.get(z)
			for (let ui of uis) {
				if (ui instanceof clazz) {
					ui.popSelf()
					return true
				}
			}
		}
		return false
	}
	popUI(uiName: string) {
		for (let z of this.zs_) {
			let uis = this.uis_.get(z)
			for (let ui of uis) {
				if (ui.uiName == uiName) {
					ui.popSelf()
					return true
				}
			}
		}
		return false
	}
	async push(prefabOrName: cc.Prefab | string, ...params: any[]): Promise<cc.Node> {
		return await kcore.async.queueFunc(async (prefabOrName:cc.Prefab | string,params:any[])=>{
			let prefab: cc.Prefab = null
			let bIgnoreBoardChanged = this.ignoreBoardChangedNext_
			this.ignoreBoardChangedNext_ = false
			let bundle = false 
			let uiName = null
			let curBoard = this.board
			if (typeof (prefabOrName) == "string") {
				if (prefabOrName.length == 0) {
					return null
				}
				uiName = prefabOrName
				bundle = true 
				prefab = kcore.prefab.getPrefab(prefabOrName)
				if (prefab == null) {
					prefab = await this.loadPrefab(prefabOrName)
					if (prefab == null) {
						kcore.log.info("push ui failed loadPrefab failed = " + prefabOrName)
						return null
					}
				}
				
				let rt:{
					com:UIBase,
				} = {
					com:null,
				}
				this.uis_.forEach((arr, key) => {
					for(let com of arr) {
						if(com.isPoped) {
							continue 
						}
						if(com.prefab == prefab) {
							rt.com = com
							return 
						}
					}
				})
				if(rt.com) {
					try {
						if(rt.com.onRePush.apply(rt.com,params)) {
							kcore.log.info("push ui repush success name = " + uiName)
							return rt.com.node 
						}
					} catch(e) {
						kcore.log.info("push ui repush error = " + e)
					}
				}
			} else {
				prefab = prefabOrName
				uiName = prefab.name
			}
			if (prefab == null) {
				kcore.log.info("push ui failed = " + prefabOrName)
				return null
			}
			if(!bIgnoreBoardChanged && this.board != curBoard) {
				kcore.log.info("board changed, abandon push name = " + uiName)
				return null 
			}
			let node = this._pushPrefab(prefab, params, {
				bundle: bundle,
				uiName: uiName,
			})
			return node
		},this)(prefabOrName,params)
	}
	pushNoLoad(prefabOrName: cc.Prefab | string, ...params: any[]): cc.Node {
		let prefab: cc.Prefab = null
		let bIgnoreBoardChanged = this.ignoreBoardChangedNext_
		this.ignoreBoardChangedNext_ = false
		let bundle = false 
		let uiName = null
		let curBoard = this.board
		if (typeof (prefabOrName) == "string") {
			if (prefabOrName.length == 0) {
				return null
			}
			uiName = prefabOrName
			bundle = true 
			prefab = kcore.prefab.getPrefab(prefabOrName)
			if (prefab == null) {
				kcore.log.info("push ui failed ignore load = " + prefabOrName)
				return null
			}
			
			let rt:{
				com:UIBase,
			} = {
				com:null,
			}
			this.uis_.forEach((arr, key) => {
				for(let com of arr) {
					if(com.isPoped) {
						continue 
					}
					if(com.prefab == prefab) {
						rt.com = com
						return 
					}
				}
			})
			if(rt.com) {
				try {
					if(rt.com.onRePush.apply(rt.com,params)) {
						kcore.log.info("push ui repush success name = " + uiName)
						return rt.com.node 
					}
				} catch(e) {
					kcore.log.info("push ui repush error = " + e)
				}
			}
		} else {
			prefab = prefabOrName
			uiName = prefab.name
		}
		if (prefab == null) {
			kcore.log.info("push ui failed = " + prefabOrName)
			return null
		}
		if(!bIgnoreBoardChanged && this.board != curBoard) {
			kcore.log.info("board changed, abandon push name = " + uiName)
			return null 
		}
		let node = this._pushPrefab(prefab, params, {
			bundle: bundle,
			uiName: uiName,
		})
		return node
	}
	// no used
	private _push(prefabOrName: cc.Prefab | string, ...params: any[]): cc.Node {
		console.log("🕸️=>" + prefabOrName)
		let prefab: cc.Prefab = null
		let bIgnoreBoardChanged = this.ignoreBoardChangedNext_
		this.ignoreBoardChangedNext_ = false
		if (typeof (prefabOrName) == "string") {
			if (prefabOrName.length == 0) {
				return null
			}
			prefab = kcore.prefab.getPrefab(prefabOrName)
			if (prefab == null) {
				let runPreload = PreloadManager.instance.run("uip-" + prefabOrName, (...rets: any[]) => {
					kcore.log.info("[ui] preload end name = " + prefabOrName)
					this._continuePushPrefab(prefabOrName, rets, bIgnoreBoardChanged)
				}, ...params)
				if (!runPreload) {
					this._continuePushPrefab(prefabOrName, params, bIgnoreBoardChanged)
				} else {
					kcore.log.info("[ui] start preload name = " + prefabOrName)
				}
				return null
			}
		} else {
			prefab = prefabOrName
		}
		if (prefab == null) {
			kcore.log.info("push ui failed = " + prefabOrName)
			return null
		}
		let node = this._pushPrefab(prefab, params, {})
		return node
	}
	private _continuePushPrefab(prefabName: string, params: any[], ignoreBoardChanged: boolean) {
		let curBoard = this.board
		let self = this
		//this.loadPrefab(prefabOrName)
		kcore.async.queueFunc(this.loadPrefab)(prefabName)
			.then(function (prefab) {
				if (prefab == null) {
					if (self.exceptionFunc) {
						self.exceptionFunc()
					}
					return
				}
				if (!ignoreBoardChanged && self.board != curBoard) {
					kcore.log.info("board changed, abandon push name = " + prefabName)
					return
				}
				//self.push(prefab,...params)
				self._pushPrefab(prefab, params, {
					bundle: true,
					uiName: prefabName,
				})
			})
	}

	private _pushPrefab(prefab: cc.Prefab, params: any[], opt?: {
		bundle?: boolean,
		uiName?: string,
	}) {
		opt = opt || {}
		let node: cc.Node = kcore.display.instantiate(prefab)
		node.position2 = cc.v2(0, 0)
		node.setContentSize(cc.Canvas.instance.node.getContentSize())
		let coms = node.getComponents(cc.Component)
		let com: UIBase
		for (let c of coms) {
			if (c["_onPush"]) {
				com = <any>c
			}
		}
		if (!com) {
			console.error("ui layer have no uibase com")
			return
		}
		if (opt.bundle) {
			com.activePrefab = true
			//prefab.addRef()
			kcore.nodeCycle.listenDestroy(node, function () {
				//prefab.decRef()
			})
		}
		let type = com.uiType
		if (type == UIType.Board) {
			this.popAll()

			if (com.boardCacheEnabled) {
				this.prevBoardInfo_ = {
					prefabOrName: prefab,
					params: com.getBoardCacheParams(...params),
				}
			} else {
				this.prevBoardInfo_ = null
			}
		}
		let uiName = opt.uiName || prefab.name
		com.uiName = uiName
		com.prefab  = prefab

		let rootNode = this.rootNodes_.get(type)
		rootNode.addChild(node)

		let self = this
		com._onPush(function () {
			self.pop(com)
		}, ...params)
		com.setActive(false)


		this.uis_.get(type).push(com)
		kcore.data.set("ui/push", uiName)
		kcore.data.set("ui/push", null, true)
		this.refreshFocus();
		return node
	}

	repushBoard() {
		if (this.prevBoardInfo_) {
			kcore.log.info("repush success", JSON.stringify(this.prevBoardInfo_.params))
			let params = this.prevBoardInfo_.params.slice()
			params.splice(0, 0, this.prevBoardInfo_.prefabOrName)
			this.push.apply(this, params)
			return true
		}
		return false
	}

	clearReush() {
		this.prevBoardInfo_ = null
	}

	async loadPrefab(name: string) {
		if (kcore.bundle) {
			let assetName = "layers/" + name
			let prefab = await kcore.bundle.loadAsset(assetName, cc.Prefab)
			if (prefab) {
				return prefab
			}
			prefab = await kcore.bundle.loadAsset(name, cc.Prefab)
			if (prefab) {
				return prefab
			}
		}
		// let url = "ui/" + name
		// prefab = await kcore.prefab.loadPrefab(url)
		// return prefab
		return null
	}

	pop(com: UIBase): boolean {
		console.log("UIManager.pop " + com.uiName + " " + com.node.name)
		let type = com.uiType
		let arr = this.uis_.get(type)
		let idx = arr.findIndex(function (value, index, obj) {
			return value == com
		})
		if (idx < 0) {
			return false;
		}
		arr.splice(idx, 1)
		this.refreshFocus();

		com.isPoped = true 
		com.onPop()
		kcore.data.set("ui/pop", com.uiName)
		kcore.data.set("ui/pop", null, true)
		if (com.onDead()) {
			return true;
		}
		com.node.destroy()
		//rcPool.destroy(com.node)
		return true
	}

	popSingle(type: UIType): boolean {
		let arr = this.uis_.get(type)
		if (arr.length > 0) {
			return this.pop(arr[arr.length - 1])
		}
		return false
	}

	popAll() {
		let self = this
		this.uis_.forEach(function (arr, key) {
			if (self.staticZs_.includes(key)) {
				return
			}
			for (let com of arr) {
				com.isPoped = true 
				com.onPop()
				if (!com.onDead()) {
					//rcPool.destroy(com.node)
					com.node.destroy()
				}
			}
			arr.splice(0)
		})
	}

	popStaticAll() {
		let self = this
		this.uis_.forEach(function (arr, key) {
			if (!self.staticZs_.includes(key)) {
				return
			}
			for (let com of arr) {
				com.isPoped = true 
				com.onPop()
				if (!com.onDead()) {
					//rcPool.destroy(com.node)
					com.node.destroy()
				}
			}
			arr.splice(0)
		})
	}

	popType(type: UIType) {
		let arr = this.uis_.get(type)
		for (let com of arr) {
			com.isPoped = true 
			com.onPop()
			if (com.onDead() == false) {
				//rcPool.destroy(com.node)
				com.node.destroy()
			}
		}
		arr.splice(0)
	}

	getCount(type: UIType) {
		let arr = this.uis_.get(type)
		return arr.length
	}

	private refreshFocus() {
		//console.log("refreshFocues " + this.uis_.size)
		let topCom: UIBase = null
		for (let i = UIType.TypeEnd - 1; i >= UIType.Board; i--) {
			let key = i
			let arr = this.uis_.get(key)
			if (!arr || arr.length == 0) {
				continue
			}
			let length = arr.length;
			let lastCom = arr[length - 1]
			if (!topCom) {
				for (let j = arr.length - 1; j >= 0; j--) {
					let com = arr[j]
					if (com.topEnabled) {
						topCom = com
						break
					}
				}
			}
			if (key == UIType.Top || this.overlapZs_.includes(key)) {
				for (let com of arr) {
					if (!com._Focus) {
						com.setActive(true)
						com.onFocus(true)
					}
					if (!com.isTop) {
						com.isTop = true
						com._onTop(true)
					}
				}
				continue
			}
			if (!lastCom._Focus) {
				lastCom.setActive(true)
				lastCom.onFocus(true)
			}
			if (topCom == lastCom) {
				topCom = lastCom
				if (!lastCom.isTop) {
					lastCom.isTop = true
					lastCom._onTop(true)
				}
			} else {
				// if (lastCom.isTop) {
				// 	lastCom.isTop = false
				// 	lastCom._onTop(false)
				// }
			}
			for (let i = 0; i < length - 1; i++) {
				let com = arr[i]
				// if (com._Focus) {
				// 	com._Focus = false
				// 	if (!com.onFocus(false)) {
				// 		com.setActive(false)
				// 	}
				// }
				// if (com.isTop) {
				// 	com.isTop = false
				// 	com._onTop(false)
				// }
			}
		}
	}
	private static instance_: UIManager = null;
	onLoad() {
		UIManager.instance_ = this;
		window["kcore"] = window["kcore"] || <any>{}
		kcore.ui = <any>this

		this.init()
	}

	start() {

	}
	update(dt) {
		let a: tGameConfigExtension = {

		}
	}
}
