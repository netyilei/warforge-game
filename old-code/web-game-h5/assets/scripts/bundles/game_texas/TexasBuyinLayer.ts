import { UIBase } from '../../core/ui/UIBase'
import { GSCommonMsg } from '../../ServerDefines/GSCommonMsg'
import Decimal from 'decimaljs'
import { ItemDefine, ItemID } from '../../ServerDefines/ItemDefine'
import { RoomDefine } from '../../ServerDefines/RoomDefine'
import { GameSet } from '../../ServerDefines/GameSet'
import { TexasRule } from './TexasDefine'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu('game/texas/TexasBuyinLayer')
export default class TexasBuyinLayer extends UIBase {
	@property(cc.Label)
	lblLast: cc.Label = null
	@property(cc.Label)
	lblMin: cc.Label = null
	@property(cc.Label)
	lblMax: cc.Label = null
	@property(cc.Node)
	nodeTouch: cc.Node = null
	@property(cc.Node)
	nodeTag: cc.Node = null

	@property(cc.ProgressBar)
	bar: cc.ProgressBar = null
	@property(cc.EditBox)
	editBox: cc.EditBox = null
	@property(cc.Button)
	btnClick: cc.Button = null


	@property({ type: cc.Node })
	nodeTimeout: cc.Node = null
	@property({ type: cc.Node })
	timeout: cc.Node = null
	@property({ type: cc.Label })
	timeLbl: cc.Label = null

	private gameLayer_: kroom.IBaseGameLayer
	private chairNo_: number
	private items_: {
		id: string
		count: string
	}[]
	private func_: Function
	private block_: kcore.IBlocker

	private timeoutSec:number = null
	private buyinPop_ = false 
	onPush(param: {
		gameLayer,
		chairNo,
		func?: Function,
		timeoutSec: number//倒计时
	}): void {
		this.gameLayer_ = param.gameLayer
		this.chairNo_ = param.chairNo
		this.func_ = param.func
		this.timeoutSec = param.timeoutSec

		if (param.timeoutSec) {
			this.nodeTimeout.active = true
			let timeout = param.timeoutSec
			this.schedule(() => {
				this.timeLbl.string = String(timeout)
				this.timeout.stopAllActions()
				cc.tween(this.timeout.sprite)
					.to(1, { fillRange: timeout / param.timeoutSec })
					.start()
				timeout--
			}, 1, cc.macro.REPEAT_FOREVER, 0.01);
		}

		this.gameLayer_.dispMsg
			.addNode(this.node, null, this)
			.listen(GSCommonMsg.Buyin, (msg: GSCommonMsg.tBuyinRes) => {
				if (!msg.b) {
					kcore.tip.push('提示', '买入失败')
				}
				if (this.isValid) {
					if (this.block_) {
						this.block_.stop()
						this.block_ = null
					}
					if (this.func_) {
						this.func_(msg.b)
						this.func_ = null
					}
					this.buyinPop_ = true
					this.popSelf()
				}
			})

		this.initTouch()
		kcore.data.listenget('user/items', [], this.node, (items) => {
			this.items_ = items || []
			this.refreshData()
		})
	}

	private minValue_: Decimal
	private maxValue_: Decimal
	private itemCount_: Decimal
	initTouch() {
		let funcCalcPercent = (touch: cc.Touch) => {
			let pos = this.nodeTouch.parent.convertToNodeSpaceAR(touch.getLocation())
			let rect = this.nodeTouch.getBoundingBox()
			let per = (pos.x - rect.x) / rect.width
			this.setTouchPercent(per)
		}
		let self = this
		this.nodeTouch.on(cc.Node.EventType.TOUCH_START, (touch: cc.Touch) => {
			if (!self.inputValid_) {
				return
			}
			funcCalcPercent(touch)
		})
		this.nodeTouch.on(cc.Node.EventType.TOUCH_MOVE, (touch: cc.Touch) => {
			if (!self.inputValid_) {
				return
			}
			funcCalcPercent(touch)
		})
		let funcEnd = (touch: cc.Touch) => {
			if (!self.inputValid_) {
				return
			}
			funcCalcPercent(touch)
		}

		this.nodeTouch.on(cc.Node.EventType.TOUCH_END, funcEnd)
		this.nodeTouch.on(cc.Node.EventType.TOUCH_CANCEL, funcEnd)
	}

	refreshData() {
		if (!this.gameLayer_ || !this.gameLayer_.isValid) {
			return
		}
		let gameSet: GameSet = this.gameLayer_.gameSet
		let itemID = String(RoomDefine.getPayIndex(gameSet.getPayType()))
		console.log('itemID', itemID, ItemID[itemID])
		let payType = RoomDefine.getPayType(gameSet.getPayType())
		this.minValue_ = new Decimal(gameSet.iSets[TexasRule.Group7_MinBuyin])
		this.maxValue_ = new Decimal(gameSet.iSets[TexasRule.Group8_MaxBuyin])
		this.lblMin.string = '最小\n' + this.minValue_
		this.lblMax.string = '最大\n' + this.maxValue_
		if (payType == RoomDefine.PayType.Item) {
			this.itemCount_ = new Decimal(
				this.items_.find((v) => v.id == itemID)?.count || '0'
			)
			this.onEditBoxChanged()
		} else {
			this.itemCount_ = new Decimal(0)
		}
		this.lblLast.string = this.itemCount_.toString()
		this.onEditBoxChanged()
	}

	private inputValid_ = false
	onEditBoxChanged() {
		this.setTouchValue(this.editBox.string || '0')
		this.btnClick.interactable = this.inputValid_
	}

	setTouchValue(value: string) {
		let v = new Decimal(value)
			.toDecimalPlaces(0, Decimal.ROUND_DOWN)
			.clamp(this.minValue_, this.maxValue_)
		if (v.greaterThan(this.itemCount_)) {
			this.inputValid_ = false
			this.setTouchPercent(0.5)
			return
		}
		this.inputValid_ = true
		let per = v
			.sub(this.minValue_)
			.div(this.maxValue_.sub(this.minValue_))
			.toNumber()
		this.editBox.string = v.toString()
		this.setTouchPercent(per, true)
	}

	setTouchPercent(per: number, ignoreSetValue?: boolean) {
		per = cc.misc.clamp01(per)
		if (!ignoreSetValue) {
			if (!this.inputValid_) {
				this.editBox.string = '0'
			} else {
				let value = this.maxValue_
					.sub(this.minValue_)
					.mul(per)
					.add(this.minValue_)
					.toDecimalPlaces(0, Decimal.ROUND_DOWN)
				this.editBox.string = value.toString()
			}
		}
		let size = this.nodeTouch.getContentSize()
		let ap = this.nodeTouch.getAnchorPoint()
		let x = per * size.width - ap.x * size.width
		let y = (0.5 - ap.y) * size.height
		let pos = kcore.utils.convertPosition(
			this.nodeTouch,
			this.nodeTag,
			cc.v2(x, y)
		)
		this.nodeTag.position2 = pos

		this.btnClick.interactable = this.inputValid_
		this.bar.progress = per
	}

	async onClick() {
		kcore.click.playAudio()
		if (!this.inputValid_) {
			return
		}
		this.onEditBoxChanged()
		let req: GSCommonMsg.tBuyinReq = {
			score: this.editBox.string,
			toChairNo: this.chairNo_,
		}
		kcore.gnet.send(GSCommonMsg.Buyin, req)
		this.block_ = kcore.block.create('请稍后')
		this.btnClick.interactable = false
		this.scheduleOnce(() => {
			this.btnClick.interactable = this.inputValid_
		}, 2)
	}
	protected update(dt: number): void {
		if (!this.gameLayer_ || !this.gameLayer_.isValid) {
			return
		}
		if(this.timeoutSec)return;

		if (this.gameLayer_.players.find((v) => v.chairNo == this.chairNo_)) {
			this.popSelf()
			return
		}
	}

	onDead(): boolean {
		let b = super.onDead()

		if (this.block_) {
			this.block_.stop()
			this.block_ = null
		}
		if (this.func_) {
			this.func_(false)
			this.func_ = null
		}
		return b
	}
}
