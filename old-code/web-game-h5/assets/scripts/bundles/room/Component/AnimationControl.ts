import _ = require("underscore");
import BaseAnimationRuntimeItem from "./BaseAnimationRuntimeItem";


const { ccclass, property, menu } = cc._decorator

enum AniStatus {
	Idle,
	Move,
	End,
}
const ccAnimationControlRuntimeDefine = cc.Class({
	name: "ccAnimationControlRuntimeDefine",
	properties: {
		status: {
			type: cc.Enum(AniStatus),
			default: AniStatus.Idle,
		},
		playSync: {
			tooltip: "同时播放items",
			default: false,
		},
		items: {
			type: [BaseAnimationRuntimeItem],
			default: [],
		},
	}
})
type AnimationControlRuntimeDefine = {
	status: krenderer.AniStatus,
	playSync: boolean,
	items: krenderer.IAniRuntimeItem[],
}
@ccclass
@menu("game/component/AnimationControl")
export default class AnimationControl extends cc.Component implements krenderer.IAniControl {
	@property([ccAnimationControlRuntimeDefine])
	runtimes: AnimationControlRuntimeDefine[] = []

	private curDefIdx_ = -1
	private singleDef_ = false
	private curItemIdx_ = -1
	private curSyncPlay_ = false
	private curSyncTotalCount = 0
	private curSyncEndedCount_ = 0
	private type_: krenderer.AniPlayType
	playSeqs(type: krenderer.AniPlayType) {
		this.stopAll()
		if (this.runtimes.length == 0) {
			if (type == krenderer.AniPlayType.Destroy) {
				this.node.destroy()
				return
			}
			return
		}
		this.curDefIdx_ = 0
		this.curItemIdx_ = -1
		this.singleDef_ = true
		this.type_ = type

		this.curSyncPlay_ = false
		this.curSyncTotalCount = 0
		this.curSyncEndedCount_ = 0
		this.step()
	}
	playStatus(status: krenderer.AniStatus, type: krenderer.AniPlayType) {
		this.stopAll()
		let idx = this.runtimes.findIndex(v => v.status == status)
		if (idx < 0) {
			if (type == krenderer.AniPlayType.Destroy) {
				this.node.destroy()
				return
			}
			return
		}
		this.curDefIdx_ = idx
		this.curItemIdx_ = -1
		this.singleDef_ = true
		this.type_ = type

		this.curSyncPlay_ = false
		this.curSyncTotalCount = 0
		this.curSyncEndedCount_ = 0
		this.step()
	}

	protected step() {
		if (this.curDefIdx_ < 0) return
		if (!this.runtimes) return
		if (this.curDefIdx_ >= this.runtimes.length) return
		let def = this.runtimes[this.curDefIdx_]
		let allDone = false
		do {
			if (this.curSyncPlay_) {
				if (this.curSyncEndedCount_ >= this.curSyncTotalCount) {
					this.curSyncPlay_ = false
					if (this.singleDef_) {
						allDone = true
						break
					}
					this.curDefIdx_++
					if (!this.runtimes[this.curDefIdx_]) {
						allDone = true
						break
					} else {
						this.step()
						return
					}
				}
				return
			}
			if (!def || def.items.length == 0) {
				allDone = true
				break
			}
			if (def.playSync) {
				this.curSyncPlay_ = true
				this.curSyncTotalCount = def.items.length
				this.curSyncEndedCount_ = 0
				for (let item of def.items) {
					item.playAnimation(() => {
						this.curSyncEndedCount_++
						this.step()
					})
				}
			} else {
				this.curSyncPlay_ = false

				let prevItem = this.curItemIdx_ >= 0 ? def.items[this.curItemIdx_] : null
				this.curItemIdx_++
				if (prevItem) {
					prevItem.stop()
				}
				let item = def.items[this.curItemIdx_]
				if (!item) {
					if (this.singleDef_) {
						allDone = true
						break
					}
					this.curDefIdx_++
					if (!this.runtimes[this.curDefIdx_]) {
						allDone = true
						break
					} else {
						this.step()
						return
					}
				} else {
					item.playAnimation(() => {
						this.step()
					})
				}
			}
		} while (false)
		if (allDone) {
			this.stopAll()
			if (this.type_ == krenderer.AniPlayType.Loop) {
				if (this.singleDef_) {
					this.curItemIdx_ = -1
				} else {
					this.curDefIdx_ = 0
					this.curItemIdx_ = -1
				}
				this.step()
			} else if (this.type_ == krenderer.AniPlayType.Destroy) {
				this.node.destroy()
			}
		}
	}

	protected stopAll() {
		_.each(this.runtimes, v => _.each(v.items, k => k.stop()))
	}





	comid_IAniControl() { }
}