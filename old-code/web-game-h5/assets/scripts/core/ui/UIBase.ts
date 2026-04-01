import VMultiLangLabel from "../vmulti/VMultiLangLabel";


const {ccclass, property, requireComponent} = cc._decorator;

function findNodeDeep(root:cc.Node,name:string) {
	for(let node of root.children) {
		if(node.name == name) {
			return node 
		}
		let ret = findNodeDeep(node,name)
		if(ret) {
			return ret 
		}
	}
	return null
} 

export class UIBase extends cc.Component implements UIBaseInterface {
	onPush(...params:any[]) {}
	onRePush(...params:any[]) { return false }
	onPop() {}
	onMask() {
		if((this.uiType == UIType.Normal || this.uiType == UIType.Normal2) && this.maskPopEnabled_) {
			this.popSelf()
		}
	}
	/**
	 * 当默认的Focus动画执行完毕时
	 */
	onFocusDone(b:boolean) {}
	/**
	 * 返回true表示要自己对cc.Node.active进行赋值
	 */
	onFocus(b:boolean):boolean {
		if(b) {
			kcore.uiactions.focusIn(this)
		} else {
			let self = this 
			kcore.uiactions.focusOut(this,function() {
				self.node.active = false
			})
		}
		return true 
		//return false 
	}

	// 在onPush后调用
	onTop(b:boolean) {
		// rcLog.info("onTop b = " + b)
	}

	/**
	 * 返回true表示要自己调用destroy
	 */
	onDead() {
		let self = this
		kcore.uiactions.focusOut(this,function() {
			self.node.destroy()
		})
		return true 
		//return false 
	}

	get uiType():UIType {
		return UIType.Normal
	}

	get boardCacheEnabled() {
		return true 
	}

	getBoardCacheParams(...params:any[]) {
		return params
	}

	private hideFocus_:boolean = true;
	get _Focus() {
		return this.hideFocus_
	}

	set _Focus(value:boolean) {
		this.hideFocus_ = value
	}

	private isTop_:boolean = false 
	get isTop() {
		return this.isTop_
	}
	set isTop(v) {
		this.isTop_ = v
	}

	private maskPopEnabled_:boolean = true 
	get maskPopEnabled() {
		return this.maskPopEnabled_
	}
	set maskPopEnabled(v) {
		this.maskPopEnabled_ = v 
	}

	private activePrefab_:boolean = false 
	get activePrefab() {
		return this.activePrefab_
	}
	set activePrefab(v) {
		this.activePrefab_ = v
	}

	private hasbeenFindMask:boolean = false;
	private mask_:cc.Node = null
	get mask():cc.Node {
		if(this.mask_ == null && this.hasbeenFindMask == false) {
			this.mask_ = this.node.getChildByName("mask")
			this.hasbeenFindMask = true 
		}
		if(this.mask_ == null && this.hasbeenFindMask == true) {
			this.mask_ = this.node 
		}
		return this.mask_
	}

	private uiName_:string = null 
	get uiName() {
		return this.uiName_
	}
	set uiName(v) {
		this.uiName_ = v
	}

	private prefab_:cc.Prefab = null 
	get prefab() {
		return this.prefab_
	}
	set prefab(v) {
		this.prefab_ = v
	}
	
	private isPoped_:boolean = false 
	get isPoped() {
		return this.isPoped_
	}
	set isPoped(v) {
		this.isPoped_ = v
	}
	private popFunc_:Function = null
	popSelf() {
		if(!this.isValid) {
			return 
		}
		if(this.popFunc_) {
			this.popFunc_()
		} else {
			this.node.destroy()
		}
	}
	setActive(b:boolean) {
		this.node.active = b 
		this.hideFocus_ = b
	}

	_onPush(popFunc:Function,...params:any[]) {
		if(kcore.lang) {
			let lbls = this.node.getComponentsInChildren(cc.Label)
			for(let lbl of lbls) {
				lbl.addComponent(VMultiLangLabel)
			}
		}
		this.popFunc_ = popFunc
		if(this.mask != null) {
			let canvasSize = cc.Canvas.instance.node.getContentSize()
			let maskSize = this.mask.getContentSize()
			this.mask.scaleX = canvasSize.width / maskSize.width 
			this.mask.scaleY = canvasSize.height / maskSize.height 
			// 触摸屏蔽
			// TODO
			let self = this 
			this.mask.on(cc.Node.EventType.TOUCH_START,function() {
				self.onMask()
				return true
			})
		}
		try {
			this.onPush(...params)
		} catch (error) {
			kcore.log.error("error in onPush ",error)
		}
	}
	_onRePush(...params:any[]) {
		try {
			this.onRePush(...params)
		} catch (error) {
			kcore.log.error("error in onRePush ",error)
		}
	}
	
	get topEnabled() {
		return true 
	}
	_onTop(b:boolean) {
		kcore.log.info("onTop name = " + this.node.name + " b = " + b)
		this.node.emit(UINodeEvent.OnTop,b)
		this.onTop(b)
	}

	// private clickHelper_:UIClickHelper = null
	// get clicked() {
	// 	if(this.clickHelper_ == null) {
	// 		this.clickHelper_ = new UIClickHelper(this.node)
	// 	}
	// 	return this.clickHelper_
	// }

	// private childCache_:{}
	// child(name) {
	// 	let node:cc.Node = this.childCache_[name]
	// 	if(node == null) {
	// 		node = findNodeDeep(this.node,name)
	// 		if(node) {
	// 			this.childCache_[name] = node 
	// 		}
	// 	}
	// 	return node 
	// }

	// childCom<T extends cc.Component>(name,comType: {prototype: T}):T {
	// 	let node = this.child(name)
	// 	if(node) {
	// 		return node.getComponent(comType)
	// 	}
	// 	return null
	// }

	setIgnoreOutBound() {}

	private currentFocusNode_:cc.Node = null
	get currentFocusNode() {
		return this.currentFocusNode_
	}
	private currentFocusNodeOriginPos_:cc.Vec2 = null
	get currentFocusNodeOriginPos() {
		return this.currentFocusNodeOriginPos_
	}

	private focusMaskSprite_:cc.Sprite
	private focusMaskOriginOpacity_:number = null
	lazyInitFocus() {
		if(!this.currentFocusNodeOriginPos_) {
			this.currentFocusNodeOriginPos_ = this.node.position2
			this.focusMaskSprite_ = this.mask?.getComponent(cc.Sprite)
			if(this.mask) {
				this.focusMaskOriginOpacity_ = this.mask.opacity
			}
			let widget = this.mask?.getComponent(cc.Widget)
			if(widget) {
				let contentSize = cc.Canvas.instance.node.getContentSize()
				widget.bottom = -contentSize.height
				widget.top = -contentSize.height
				widget.left = -contentSize.width
				widget.right = -contentSize.width
				widget.updateAlignment()
			}
		}
	}
	focusNode(node:cc.Node,targetWorldY:number) {
		this.lazyInitFocus()

		this.unFocusNode()


		this.currentFocusNode_ = node
		let wCurNodeOrigin = this.node.parent.convertToWorldSpaceAR(this.currentFocusNodeOriginPos_)
		let wpos = node.parent.convertToWorldSpaceAR(node.position2)
		wpos = wpos.sub(wCurNodeOrigin)
			.add(this.node.parent.convertToWorldSpaceAR(this.node.position2))

		let offset = targetWorldY - wpos.y
		if(offset > 0) {
			let targetPos = this.node.parent.convertToNodeSpaceAR(cc.v2(0,wCurNodeOrigin.y + offset))
			this.node.stopAllActions()
			this.node.runAction(
				cc.moveTo(0.2,this.currentFocusNodeOriginPos.x,targetPos.y).easing(cc.easeOut(2))
			)
			if(this.focusMaskSprite_) {
				this.focusMaskSprite_.node.opacity = 255
			}
		} else {
			if(this.focusMaskSprite_) {
				this.focusMaskSprite_.node.opacity = this.focusMaskOriginOpacity_
			}
		}
	}

	get focusEnabled() {
		return cc.sys.platform == cc.sys.ANDROID || cc.sys.os == cc.sys.OS_IOS
	}

	unFocusNode(node?:cc.Node) {
		if(!this.focusEnabled) {
			return 
		}
		if(!this.currentFocusNode || this.currentFocusNode != node) {
			return 
		}
		this.node.stopAllActions()
		this.node.runAction(cc.sequence([
			cc.moveTo(0.2,this.currentFocusNodeOriginPos_).easing(cc.easeOut(2)),
			cc.callFunc(()=>{
				// if(this.focusMaskSprite_) {
				// 	this.focusMaskSprite_.node.opacity = this.focusMaskOriginOpacity_
				// }
			})
		]))
		this.currentFocusNode_ = null
	}

	onEditBoxFocusStart(editBox:cc.EditBox) {
		if(!this.focusEnabled) {
			return 
		}
		let node = editBox.node
		let contentSize = cc.Canvas.instance.node.getContentSize()
		// this.focusNode(node,contentSize.height / 2 + contentSize.height / 8)
		this.focusNode(node,contentSize.height / 2)
	}

	onEditBoxFocusEnd(editBox:cc.EditBox) {
		if(!this.focusEnabled) {
			return 
		}
		let node = editBox.node
		this.unFocusNode(node)
	}
}
