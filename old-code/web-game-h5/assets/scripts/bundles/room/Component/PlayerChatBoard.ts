import Decimal from 'decimaljs'
import _ = require("underscore")


const { ccclass, property, menu } = cc._decorator

enum PlayerChatBoardDirection {
	TopLeft,
	TopRight,
	BottomLeft,
	BottomRight,
}

const ccPlayerChatBoardViewDefine = cc.Class({
	name: "ccPlayerChatBoardViewDefine",
	properties: {
		viewID: {
			default: -1
		},
		direction: {
			type: cc.Enum(PlayerChatBoardDirection),
			default: PlayerChatBoardDirection.TopLeft
		}
	}
})
type PlayerChatBoardViewDefine = {
	viewID: number,
	direction: PlayerChatBoardDirection
}

const ccPlayerChatBoardLabelDefine = cc.Class({
	name: "ccPlayerChatBoardLabelDefine",
	properties: {
		direction: {
			type: cc.Enum(PlayerChatBoardDirection),
			default: PlayerChatBoardDirection.TopLeft
		},
		node: {
			type: cc.Node,
			default: null,
		},
		nodeBG: {
			type: cc.Node,
			default: null,
		},
		lbl: {
			type: cc.Label,
			default: null,
		},
		nodeEmoji: {
			type: cc.Node,
			default: null,
		},
		nodeAudio: {
			type: cc.Node,
			default: null,
		},
		sizeOffset: {
			default: cc.size(0, 0)
		},
	}
})
type PlayerChatBoardLabelDefine = {
	direction: PlayerChatBoardDirection
	node: cc.Node,
	nodeBG: cc.Node,
	lbl: cc.Label,
	nodeEmoji: cc.Node,
	nodeAudio: cc.Node,
	sizeOffset: cc.Size
}
@ccclass
@menu("game/component/PlayerChatBoard")
export default class PlayerChatBoard extends cc.Component {
	@property([ccPlayerChatBoardViewDefine])
	viewDefines: PlayerChatBoardViewDefine[] = []
	@property([ccPlayerChatBoardLabelDefine])
	labelDefines: PlayerChatBoardLabelDefine[] = []

	protected onLoad(): void {
		_.each(this.labelDefines, v => v.node.active = false)
		let self = this
		for (let def of this.labelDefines) {
			def.node.active = false
			def.lbl.node.on(cc.Node.EventType.SIZE_CHANGED, function () {
				self.setupBGSize(def, def.lbl.node.getContentSize())
			})
		}
	}



	private viewID_: number = null
	get viewID() {
		return this.viewID_
	}
	set viewID(v) {
		this.viewID_ = v
	}


	setupEmoji(delaySec?: number) {
		let viewDef = this.viewDefines.find(v => v.viewID == this.viewID)
		if (!viewDef) {
			kcore.log.error("chat board: cannot find view define viewID = " + this.viewID)
			return
		}
		let def = this.labelDefines.find(v => v.direction == viewDef.direction)
		if (!def) {
			kcore.log.error("chat board: cannot find label define", viewDef)
			return
		}

		def.node.stopAllActions()
		def.nodeEmoji.stopAllActions()
		def.nodeBG.active = false
		def.lbl.node.active = false
		def.nodeEmoji.active = true
		def.node.active = true

		def.nodeEmoji.scale = 1
		cc.tween(def.nodeEmoji)
			.to(0.1, { scale: 1 })
			.delay(delaySec || 4)
			.call(() => {
				console.log("!@?#!?@#!?@#?!@?#!@?#!?@#?!@?#!")
				def.node.active = false
			})
			.start()
		return def.nodeEmoji
	}

	setup(lbl: string, delaySec?: number) {
		_.each(this.labelDefines, v => (v.node.stopAllActions(), v.node.active = false))
		let viewDef = this.viewDefines.find(v => v.viewID == this.viewID)
		if (!viewDef) {
			kcore.log.error("chat board: cannot find view define viewID = " + this.viewID)
			return false
		}
		let def = this.labelDefines.find(v => v.direction == viewDef.direction)
		if (!def) {
			kcore.log.error("chat board: cannot find label define", viewDef)
			return false
		}
		def.node.stopAllActions()
		def.nodeBG.active = true
		def.lbl.node.active = true
		def.nodeEmoji.active = false
		def.lbl.string = lbl
		def.node.active = true
		def.node.opacity = 0
		def.node.runAction(cc.sequence([
			cc.fadeIn(0.2),
			cc.delayTime(delaySec || 4),
			cc.fadeOut(0.2),
			cc.callFunc(() => {
				def.node.active = false
			})
		]))

		// let lblSize = def.lbl.node.getContentSize()
		// this.setupBGSize(def,lblSize)
	}

	setupBGSize(def: PlayerChatBoardLabelDefine, size: cc.Size) {
		def.nodeBG.setContentSize(cc.size(
			size.width + def.sizeOffset.width,
			size.height + def.sizeOffset.height,
		))
	}
}