import { UIBase } from "./UIBase";


const { ccclass, property } = cc._decorator;

@ccclass
export class BlockLayer extends UIBase {
	get uiType() {
		return UIType.Block
	}

	@property({ type: cc.Label })
	lblContent: cc.Label = null
 
	@property(cc.Node)
	nodeDelay: cc.Node = null

	@property()
	delayTime: number = 0

	@property(cc.Node)
	nodeMask: cc.Node = null
	@property(cc.Node)
	nodeCircle: cc.Node = null

	private func_: Function = null
	private angle_ = 0
	private contentStr_ = ""
	onPush(content?: string, func?: Function) {


		this.func_ = func

		this.setForceShow(false)


	}
	initView() {
		this.setContent(this.contentStr_)
		this.lblContent.node.stopAllActions()
		this.lblContent.node.runAction(cc.repeatForever(cc.sequence([
			cc.delayTime(0.4),
			cc.fadeTo(0.4, 100),
			cc.fadeIn(0.2),
		])))
		if (this.nodeMask && this.nodeCircle) {
			this.nodeMask.runAction(cc.repeatForever(cc.sequence([
				cc.delayTime(0.1),
				cc.callFunc(() => {
					this.angle_ += 30
					if (this.angle_ >= 360) {
						this.angle_ = 0
					}
					this.nodeMask.angle = -this.angle_
					this.nodeCircle.angle = this.angle_
				})
			])))
		} else {
			this.nodeDelay.runAction(cc.repeatForever(cc.sequence([
				cc.fadeTo(0.5, 120),
				cc.fadeTo(0.5, 255),
				cc.delayTime(1),
			])))
		}
	}

	setContent(content?: string) {
		this.contentStr_ = content
		this.lblContent.string = content || "正在加载";
		// let arr: string[] = content.split("|");
		// let str: string = arr[0];
		// arr.shift();
		// if (arr.length) {
		// 	arr.forEach((_, index: number) => {
		// 		str += ` {%${index}}`;
		// 	});
		// }
		// console.log(str, arr.join(","));
		// this.lblContent.string = "";
		// this.lblContent.string = str || "正在加载";
		// this.lblContent.setValue(...arr);

	}

	setForceShow(forceShow?: boolean) {
		if (forceShow) {
			if (this.nodeDelay) {
				this.node.stopAllActions()
				this.nodeDelay.active = true
			}
		} else {
			if (this.nodeDelay && this.delayTime > 0) {
				this.node.stopAllActions()

				this.nodeDelay.active = false
				let self = this
				this.node.runAction(cc.sequence([
					cc.delayTime(this.delayTime),
					cc.callFunc(function () {
						self.nodeDelay.active = true
						self.initView();
					})
				]))
			}
		}
	}


	onFocus(b: boolean): boolean {
		return false
	}

	onDead() {
		if (this.func_) {
			this.func_()
		}
		return false
	}

	get topEnabled() {
		return false
	}
}

type BlockHandleType = {
	content: string,
	forceShow: boolean,
}
class BlockManager {
	static get instance() {
		if (BlockManager.instance_ == null) {
			BlockManager.instance_ = new BlockManager()
		}
		return BlockManager.instance_
	}
	private static instance_: BlockManager = null
	constructor() {
		BlockManager.instance_ = this
	}


	private caches_: BlockHandleType[] = []
	private blockLayer_: BlockLayer = null
	push(content: string, forceShow?: boolean): BlockHandleType {
		let ret: BlockHandleType = {
			content: content,
			forceShow: forceShow,
		}
		this.caches_.push(ret)
		this.refresh()

		return ret
	}

	pop(h: BlockHandleType) {
		let idx = this.caches_.findIndex((v) => v == h)
		if (idx >= 0) {
			let bRefresh = idx == this.caches_.length - 1
			this.caches_.splice(idx, 1)

			if (bRefresh) {
				this.refresh()
			}
		}
	}

	clear() {
		this.caches_.splice(0)
		this.refresh()
	}

	refresh() {
		if (this.caches_.length == 0) {
			if (this.blockLayer_) {
				let layer = this.blockLayer_
				this.blockLayer_ = null
				layer.popSelf()
			}
		} else {
			let last = this.caches_[this.caches_.length - 1]
			if (last.content == null) {
				if (this.blockLayer_) {
					let layer = this.blockLayer_
					this.blockLayer_ = null
					layer.popSelf()
				}
				return
			}
			if (this.blockLayer_ == null) {
				let self = this
				this.blockLayer_ = kcore.ui.pushNoLoad("BlockLayer", null, function () {
					if (self.blockLayer_) {
						self.blockLayer_ = null
						self.clear()
					}
				}).getComponent(BlockLayer)
				this.blockLayer_.setForceShow(last.forceShow)
			}
			this.blockLayer_.setContent(last.content)
		}
	}
}

export class Blocker {
	private h_: BlockHandleType = null

	private content_: string = null
	constructor(content?: string, node?: cc.Node) {
		this.content_ = content
		if (node) {
			let self = this
			kcore.nodeCycle.listenDestroy(node, function () {
				self.stop()
			})
		}
	}

	start(forceShow?: boolean) {
		this.stop()
		this.h_ = BlockManager.instance.push(this.content_, forceShow)
	}

	stop() {
		if (this.h_) {
			BlockManager.instance.pop(this.h_)
			this.h_ = null
		}
	}

	isStart() {
		return this.h_ != null
	}

	setContent(content: string) {
		this.content_ = content
		if (this.h_) {
			this.h_.content = content
			BlockManager.instance.refresh()
		}
	}
}