

class _Internal_UIActions implements kcore.IUIActions {
	focusIn(uibase: UIBaseInterface, func?: Function) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		uibase.node.scale = 0.9
		uibase.node.color = cc.Color.BLACK
		uibase.node.opacity = 0
		cc.tween(uibase.node)
			// .to(0.1, { scale: 1.05 }, { easing: 'quadOut' })
			.to(0.12, { scale: 1,opacity:255,color:cc.Color.WHITE }, { easing: 'quadIn' })
			.call(() => {
				uibase.onFocusDone(true);
				if (func != null) {
					func();
				}
				if (uibase.mask != null) {
					uibase.mask.active = true;
				}
			})
			.start();
	}
	focusOut(uibase: UIBaseInterface, func?: Function) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		uibase.node.scale = 1
		cc.tween(uibase.node)
			// .to(0.05, { scale: 1.05 })
			.to(0.12, { scale: 0.9,opacity:0,color:cc.Color.BLACK }, { easing: 'quadIn' }) // 'quadIn' 对应 cc.easeIn(2)
			.call(() => {
				uibase.onFocusDone(false);
				if (func != null) {
					func();
				}
			})
			.start();
	}

	moveInFromLeft(uibase: UIBaseInterface, func?: Function) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		uibase.node.position2 = cc.v2(-canvasSize.width, 0)
		// uibase.node.runAction(cc.sequence([
		// 	cc.moveTo(0.15, cc.v2(0, 0)).easing(cc.easeOut(3)),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(true)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 		if (uibase.mask != null) {
		// 			uibase.mask.active = true;
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.to(0.15, { x: 0, y: 0 }, { easing: 'cubicOut' }) // 'cubicOut' 对应 cc.easeOut(3)
			.call(() => {
				uibase.onFocusDone(true);
				if (func != null) {
					func();
				}
				if (uibase.mask != null) {
					uibase.mask.active = true;
				}
			})
			.start();

	}

	moveInFromRight(uibase: UIBaseInterface, func?: Function, offset?: number) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		uibase.node.position2 = cc.v2(offset || canvasSize.width, 0)
		// uibase.node.runAction(cc.sequence([
		// 	cc.moveTo(0.2, cc.v2(0, 0)).easing(cc.easeOut(2)),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(true)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 		if (uibase.mask != null) {
		// 			uibase.mask.active = true;
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.to(0.2, { x: 0, y: 0 }, { easing: 'quadOut' }) // 使用 'quadOut' 对应 easeOut(2)
			.call(() => {
				uibase.onFocusDone(true);
				if (func != null) {
					func();
				}
				if (uibase.mask != null) {
					uibase.mask.active = true;
				}
			})
			.start();

	}

	moveOutToRight(uibase: UIBaseInterface, func?: Function, offset?: number) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		// uibase.node.runAction(cc.sequence([
		// 	cc.moveTo(0.15, cc.v2(offset || canvasSize.width, 0)).easing(cc.easeOut(3)),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(false)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.to(0.15, { position: cc.v3(offset || canvasSize.width, 0) }, { easing: 'cubicOut' }) // 'cubicOut' 对应 cc.easeOut(3)
			.call(() => {
				uibase.onFocusDone(false);
				if (func != null) {
					func();
				}
			})
			.start();

	}

	moveOutToLeft(uibase: UIBaseInterface, func?: Function) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		// uibase.node.runAction(cc.sequence([
		// 	cc.moveTo(0.2, cc.v2(-canvasSize.width, 0)).easing(cc.easeOut(2)),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(false)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.to(0.2, { position: cc.v3(-canvasSize.width, 0) }, { easing: 'quadOut' }) // 'quadOut' 对应 cc.easeOut(2)
			.call(() => {
				uibase.onFocusDone(false);
				if (func != null) {
					func();
				}
			})
			.start();

	}

	moveInFromTop(uibase: UIBaseInterface, func?: Function, offset?: number) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		uibase.node.position2 = cc.v2(0, offset || canvasSize.height)
		// uibase.node.runAction(cc.sequence([
		// 	cc.moveTo(0.4, cc.v2(0, 0)).easing(cc.easeOut(2)),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(true)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 		if (uibase.mask != null) {
		// 			uibase.mask.active = true;
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.to(0.4, { position: cc.v3(0, 0) }, { easing: 'quadOut' }) // 'quadOut' 对应 cc.easeOut(2)
			.call(() => {
				uibase.onFocusDone(true);
				if (func != null) {
					func();
				}
				if (uibase.mask != null) {
					uibase.mask.active = true;
				}
			})
			.start();

	}
	moveOutToTop(uibase: UIBaseInterface, func?: Function) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		let pos = uibase.node.position2
		pos.y += canvasSize.height
		// uibase.node.runAction(cc.sequence([
		// 	cc.moveTo(0.4, pos).easing(cc.easeIn(2)),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(false)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.to(0.4, { position: cc.v3(pos.x, pos.y) }, { easing: 'quadIn' }) // 'quadIn' 对应 cc.easeIn(2)
			.call(() => {
				uibase.onFocusDone(false);
				if (func != null) {
					func();
				}
			})
			.start();

	}

	moveFadeInFromBottom(uibase: UIBaseInterface, func?: Function, offset?: number) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		uibase.node.position2 = cc.v2(0, offset || -canvasSize.height / 4)
		uibase.node.opacity = 140
		uibase.node.scale = 0.5
		// uibase.node.runAction(cc.sequence([
		// 	cc.spawn([
		// 		cc.moveTo(0.2, cc.v2(0, 0)).easing(cc.easeOut(2)),
		// 		cc.fadeIn(0.2).easing(cc.easeOut(2)),
		// 		cc.scaleTo(0.2, 1).easing(cc.easeOut(2)),
		// 	]),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(true)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 		if (uibase.mask != null) {
		// 			uibase.mask.active = true;
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.parallel(
				cc.tween().to(0.2, { position: cc.v2(0, 0) }, { easing: 'quadOut' }), // 对应 cc.moveTo
				cc.tween().to(0.2, { opacity: 255 }, { easing: 'quadOut' }), // 对应 cc.fadeIn
				cc.tween().to(0.2, { scale: 1 }, { easing: 'quadOut' }) // 对应 cc.scaleTo
			)
			.call(() => {
				uibase.onFocusDone(true);
				if (func != null) {
					func();
				}
				if (uibase.mask != null) {
					uibase.mask.active = true;
				}
			})
			.start();

	}
	moveFadeOutToBottom(uibase: UIBaseInterface, func?: Function, offset?: number) {
		if (uibase.mask != null) {
			uibase.mask.active = false;
		}
		uibase.node.stopAllActions()
		let canvasSize = kcore.utils.getCanvasSize()
		let pos = uibase.node.position2
		pos.y -= canvasSize.height / 4
		// uibase.node.runAction(cc.sequence([
		// 	cc.spawn([
		// 		cc.moveTo(0.2, pos).easing(cc.easeOut(2)),
		// 		cc.fadeOut(0.2).easing(cc.easeOut(2)),
		// 		cc.scaleTo(0.2, 0.5).easing(cc.easeOut(2)),
		// 	]),
		// 	cc.callFunc(function () {
		// 		uibase.onFocusDone(false)
		// 		if (func != null) {
		// 			func()
		// 		}
		// 	})
		// ]))
		cc.tween(uibase.node)
			.parallel(
				cc.tween().to(0.2, { position: pos }, { easing: 'quadOut' }), // 对应 cc.moveTo
				cc.tween().to(0.2, { opacity: 0 }, { easing: 'quadOut' }), // 对应 cc.fadeOut
				cc.tween().to(0.2, { scale: 0.5 }, { easing: 'quadOut' }) // 对应 cc.scaleTo
			)
			.call(() => {
				uibase.onFocusDone(false);
				if (func != null) {
					func();
				}
			})
			.start();
			
		}
}

export const UIActions = new _Internal_UIActions