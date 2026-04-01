import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox";
import { BaseGameLayerExtension } from "../../room/BaseGameLayerExtension";
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../TexasDefine";
import _ = require("underscore");
import { TexasClientDefine } from "../TexasClientDefine";
import TexasGameLayer from "../TexasGameLayer";
import { TexasLocalData } from "../TexasLocal";
import { TexasQuickBet } from "../TexasQuickSetView";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator

const ccTexasGameLayerExt_BetBar_ButtonDefine = cc.Class({
	name:"ccTexasGameLayerExt_BetBar_ButtonDefine",
	properties:{
		btnCount:{ default:5,tooltip:"按钮数量" },
		nodeRoot:{ type:cc.Node,default:null,tooltip:"按钮根节点" },
	}
})
type TexasGameLayerExt_BetBar_ButtonDefine = {
	btnCount:number,
	nodeRoot:cc.Node,
}
@ccclass
@menu("game/texas/TexasGameLayerExt_BetBar")
export default class TexasGameLayerExt_BetBar extends BaseGameLayerExtension<TexasGameLayer> {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property(cc.Button)
	btnRCheck:cc.Button = null
	@property(cc.Button)
	btnRCall:cc.Button = null
	@property(cc.Label)
	lblRCallValue:cc.Label = null
	@property(cc.Button)
	btnRAllinToCall:cc.Button = null
	@property(cc.Label)
	lblRAllinToCallValue:cc.Label = null
	@property(cc.Button)
	btnLAbandon:cc.Button = null

	@property(ButtonCheckBox)
	btnLAutoCheckAbandon:ButtonCheckBox = null
	@property(ButtonCheckBox)
	btnLAutoAbandon:ButtonCheckBox = null
	@property(ButtonCheckBox)
	btnRAutoCheck:ButtonCheckBox = null
	@property(ButtonCheckBox)
	btnRAutoCall:ButtonCheckBox = null
	@property(cc.Label)
	lblRAutoCallValue:cc.Label = null

	@property(cc.Node)
	nodeRaise:cc.Node = null
	@property(cc.Node)
	nodeRaiseActive:cc.Node = null
	@property(cc.Node)
	nodeRaiseShow:cc.Node = null
	@property(cc.Node)
	nodeRaiseBarNormal:cc.Node = null
	@property(cc.Node)
	nodeRaiseBarAllIn:cc.Node = null
	@property(cc.Node)
	nodeRaiseTag:cc.Node = null
	@property()
	touchTopOffset:number = 10
	@property()
	touchDownOffset:number = 10
	@property(cc.Node)
	nodeRaiseTouch:cc.Node = null
	@property(cc.Label)
	lblRaiseMaxValue:cc.Label = null
	@property(cc.Label)
	lblRaiseAllMaxValue:cc.Label = null
	@property(cc.Label)
	lblRaiseCurValue:cc.Label = null
	@property(cc.Node)
	nodeRaiseAllin:cc.Node = null
	@property(cc.ProgressBar)
	raiseBar:cc.ProgressBar = null
	
	@property(cc.Node)
	nodeTimer:cc.Node = null

	@property([ccTexasGameLayerExt_BetBar_ButtonDefine])
	btnDefines:TexasGameLayerExt_BetBar_ButtonDefine[] = []

	private timer_:krenderer.ITimer
	
	private curPhase_:{
		chairNo:number,
		value:Decimal,
		allin:boolean,
	}[] = []
	private hasAllin_ = false 
	private selfAllin_ = false 
	private selfPlaying_ = false 
	private totalValue_:Decimal
	onInitLayerExtension(): void {
		this.node.zIndex = 999

		let skin = krenderer.atlas.getSkin(TexasClientDefine.Skin_TimerBet)
		this.timer_ = krenderer.atlas.createRendererBySkin(skin)
		this.timer_.autoUpdate = true 
		this.nodeTimer.addChild(this.timer_.node)
		this.nodeRoot.active = false 

		this.lblRAutoCallValue.string = "0"
		if(this.gameLayer.isFupan) {
			return 
		}
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,(msg:GSUserMsg.tGameStartNT)=>{
				this.curPhase_ = []	
				this.hasAllin_ = false 
				this.selfAllin_ = false 
				this.nodeRoot.active = false 
				this.touchInfo_ = null 
				this.totalValue_ = new Decimal(0)
				this.timer_.setTimer()
				this.selfPlaying_ = msg.playingChairNos.includes(this.gameLayer.selfChairNo)

				this.btnRAllinToCall.node.active = false 
				
				this.btnLAutoCheckAbandon.isChecked = false 
				this.btnLAutoAbandon.isChecked = false 
				this.btnRAutoCheck.isChecked = false 
				this.btnRAutoCall.isChecked = false 
			})
			.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
				if(!this.selfPlaying_) {
					return 
				}
				this.nodeRoot.active = false 

				let selfChairNo = this.gameLayer.selfChairNo
				for(let bet of msg.bets) {
					this.totalValue_ = this.totalValue_.add(bet.value)
					if(bet.chairNo == selfChairNo && bet.type == TexasDefine.BetType.Abandon) {
						this.selfPlaying_ = false 
						continue 
					}
					let p = this.curPhase_.find(v=>v.chairNo == bet.chairNo)
					if(!p) {
						p = {
							chairNo:bet.chairNo,
							value:new Decimal(bet.value),
							allin:bet.type == TexasDefine.BetType.Allin,
						}
						this.curPhase_.push(p)
					} else {
						p.value = p.value.add(bet.value)
						p.allin = bet.type == TexasDefine.BetType.Allin
					}
					this.hasAllin_ = this.hasAllin_ || p.allin
					if(bet.chairNo == selfChairNo && p.allin) {
						this.selfAllin_ = true
					}
				}
				if(this.gameLayer.phase >= TexasGamePhase.BB) {
					// this.resetToAuto_Bet()
				}
			})
			.listen(GSCommonMsg.BetTurn,(msg:GSCommonMsg.tBetTurnNT)=>{
				this.handleBetTurn(msg)
			})
			.listen(TexasUserMsg.PhaseChange,(msg:TexasUserMsg.tPhaseChangeNT)=>{
				if(TexasClientDefine.flyChipPhases.includes(msg.phase)) {
					if(!this.selfPlaying_) {
						return 
					}
					this.curPhase_.splice(0)
					if(this.gameLayer.phase >= TexasGamePhase.BB) {
						this.resetToAuto_Bet()
					}
				}
			})
			.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{
				if(!this.selfPlaying_) {
					return 
				}
				this.nodeRoot.active = false 
				this.timer_.setTimer()
			})
			.listen(GSUserMsg.GameEnd,(msg:GSUserMsg.tGameEndNT)=>{
				if(!this.selfPlaying_) {
					return 
				}
				this.nodeRoot.active = false 
				this.timer_.setTimer()
			})
			.listen(GSUserMsg.GameSync,(msg:GSUserMsg.tGameSyncNT)=>{
				if(!msg.gameStartNT) {
					return 
				}
				this.totalValue_ = new Decimal(0)
				let data:TexasUserMsg.tSyncData = msg.syncData
				let pool = data.pool
				for(let stack of pool.stacks) {
					for(let user of stack.users) {
						this.totalValue_ = this.totalValue_.add(user.value)
					}
				}
				let selfPlayer = this.gameLayer.selfPlayer
				if(selfPlayer) {
					let userType = data.pool.userTypes.find(v=>v.chairNo == selfPlayer.chairNo)
					if(userType?.lastType == TexasDefine.BetType.Abandon) {
						this.selfPlaying_ = false 
					}
				}
				for(let userType of data.pool.userTypes) {
					if(userType.lastType == TexasDefine.BetType.Allin) {
						this.hasAllin_ = true
						if(userType.chairNo == selfPlayer?.chairNo) {
							this.selfAllin_ = true
						}
					}
				}
				let phase = data.phase
				let users = data.pool.stacks[data.pool.stacks.length - 1]?.users || []
				for(let chairNo of msg.gameStartNT.playingChairNos) {
					let user = users.find(v=>v.chairNo == chairNo)
					if(user) {
						this.curPhase_.push({
							chairNo:chairNo,
							value:new Decimal(user.value),
							allin:data.pool.userTypes.find(ut=>ut.chairNo == chairNo)?.lastType == TexasDefine.BetType.Allin
						})
					} else {
						let userType = data.pool.userTypes.find(v=>v.chairNo == chairNo)
						this.curPhase_.push({
							chairNo:chairNo,
							value:new Decimal(0),
							allin:userType?.lastType == TexasDefine.BetType.Allin
						})
					}
				}

				if(data.betTurnNT) {
					this.handleBetTurn(data.betTurnNT)
				}
			})
		kcore.data.listen("texas/local/data",this.node,(data)=>{
			this.refreshBet();
		})
	}
	handleBetTurn(msg:GSCommonMsg.tBetTurnNT) {
		if(!this.selfPlaying_) {
			return 
		}
		if(msg.chairNo != this.gameLayer.selfChairNo) {
			this.btnLAbandon.node.active = false 
			this.btnRAllinToCall.node.active = false
			this.btnRCall.node.active = false
			this.btnRCheck.node.active = false
			this.resetToAuto_Turn(msg)
			return 
		}
		this.resetToSelfTurn(msg)

		this.btnRAutoCall.isChecked = false
		this.btnRAutoCheck.isChecked = false
		this.btnLAutoCheckAbandon.isChecked = false
		this.btnLAutoAbandon.isChecked = false

		this.lblRAutoCallValue.string = "0"
	}

	getCurMaxValue(containsSelf?:boolean) {
		let maxValue:Decimal = new Decimal(0)
		if(containsSelf) {
			for(let p of this.curPhase_) {
				if(p.value.greaterThan(maxValue)) {
					maxValue = p.value
				}
			}
		} else {
			for(let p of this.curPhase_) {
				if(p.value.greaterThan(maxValue) && p.chairNo != this.gameLayer.selfChairNo) {
					maxValue = p.value
				}
			}
		}
		return maxValue
	}

	isSelfMaxValue(maxValue?:Decimal) {
		maxValue = maxValue || this.getCurMaxValue()
		let selfp = this.curPhase_.find(v=>v.chairNo == this.gameLayer.selfChairNo)
		return !maxValue || (selfp && selfp.value.greaterThanOrEqualTo(maxValue))
	}

	isSelfAllin() {
		return this.selfAllin_
	}

	// phase changed
	resetToAuto_Bet() {
		this.nodeRoot.active = true 
		this.nodeRaise.active = false 
		this.touchInfo_ = null 
		this.timer_.setTimer()
		for(let def of this.btnDefines) {
			def.nodeRoot.active = false 
		}
		if(this.gameLayer.phase < TexasGamePhase.BB) {
			this.nodeRoot.active = false 
			return 
		}
		if(this.selfAllin_) {
			this.nodeRoot.active = false 
			return 
		}

		let p = this.curPhase_.find(v=>v.chairNo != this.gameLayer.selfChairNo && v.value.greaterThan(0))
		let selfp = this.curPhase_.find(v=>v.chairNo == this.gameLayer.selfChairNo)
		
		let maxValue = this.getCurMaxValue()
		if(this.isSelfMaxValue(maxValue)) {
			p = null 
		}
		if(p) {
			// 自动跟/弃
			let callValue = Decimal.sub(maxValue,selfp ? selfp.value : "0")
			if(callValue.greaterThan(this.gameLayer.selfPlayer.score)) {
				// 如果需要AllInToCall取消自动
				this.btnRAutoCall.node.active = false 
				this.btnRAutoCall.isChecked = false 
			} else {
				// 如果比上次大，自动取消
				if(this.btnRAutoCall.node.active) {
					if(callValue.toString() != this.lblRAutoCallValue.string) {
						this.btnRAutoCall.isChecked = false 
					}
				}
				this.btnRAutoCall.node.active = true
				this.lblRAutoCallValue.string = callValue.toString()
			}
			this.btnRAutoCheck.node.active = false 

			this.btnLAutoAbandon.node.active = true 
			this.btnLAutoCheckAbandon.node.active = false 
		} else {
			// 自动让弃/让
			this.btnRAutoCall.node.active = false 
			this.btnRAutoCheck.node.active = true 
			this.btnLAutoCheckAbandon.node.active = true 
			this.btnLAutoAbandon.node.active = false 
		}
	}

	resetToAuto_Turn(msg:GSCommonMsg.tBetTurnNT) {
		this.nodeRoot.active = true 
		this.nodeRaise.active = false 
		this.touchInfo_ = null 
		this.timer_.setTimer()
		for(let def of this.btnDefines) {
			def.nodeRoot.active = false 
		}
		if(this.gameLayer.phase < TexasGamePhase.BB) {
			this.nodeRoot.active = false 
			return 
		}
		// let p = this.curPhase_.find(v=>v.chairNo != this.gameLayer.selfChairNo && v.value.greaterThan(0))
		let selfp = this.curPhase_.find(v=>v.chairNo == this.gameLayer.selfChairNo)
		if(selfp && selfp.allin) {
			this.nodeRoot.active = false 
			return 
		}
		let maxValue = new Decimal(msg.maxValue)
		if(maxValue.greaterThan(0) && !this.isSelfMaxValue(maxValue)) {
			// 自动跟/弃
			// 如果比上次大，自动取消
			let selfp = this.curPhase_.find(v=>v.chairNo == this.gameLayer.selfChairNo)
			let callValue = Decimal.sub(msg.maxValue,selfp ? selfp.value : "0")
			if(callValue.greaterThan(this.gameLayer.selfPlayer.score)) {
				this.btnRAutoCall.node.active = false 
				this.btnRAutoCall.isChecked = false 
				this.btnRAutoCheck.node.active = false 
			} else {
				if(this.btnRAutoCall.node.active) {
					if(callValue.toString() != this.lblRAutoCallValue.string) {
						this.btnRAutoCall.isChecked = false 
					}
				}
				this.btnRAutoCall.node.active = true
				this.lblRAutoCallValue.string = callValue.toString()
			}
			this.btnRAutoCheck.node.active = false 

			this.btnLAutoAbandon.node.active = true 
			this.btnLAutoCheckAbandon.node.active = false 
		} else {
			// 自动让弃/让
			this.btnRAutoCall.node.active = false 
			this.btnRAutoCheck.node.active = true 
			this.btnLAutoCheckAbandon.node.active = true 
			this.btnLAutoAbandon.node.active = false 
		}
	}

	private initTouch_ = false 
	private touchInfo_:{
		minValue:Decimal,
		maxValue:Decimal,
		curValue:Decimal,
		curPer:number,
		lastScore:Decimal,
	}
	resetToSelfTurn(msg:GSCommonMsg.tBetTurnNT) {
		this.nodeRoot.active = true 
		this.nodeRaise.active = false 
		this.touchInfo_ = null 
		if(msg.chairNo == this.gameLayer.selfChairNo) {
			this.timer_.setTimer(msg.timeoutSec)
		}
		for(let def of this.btnDefines) {
			def.nodeRoot.active = false 
		}

		let selfp = this.curPhase_.find(v=>v.chairNo == this.gameLayer.selfChairNo)
		let callValue = Decimal.sub(msg.maxValue,selfp ? selfp.value : "0")
		do {
			// 自动跟
			if(this.btnRAutoCall.node.active && this.btnRAutoCall.isChecked) {
				let value = new Decimal(this.lblRAutoCallValue.string)
				if(value.equals(callValue)) {
					kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
						value:this.lblRAutoCallValue.string,
					})	
					this.nodeRoot.active = false 
					this.timer_.setTimer()
					break 
				}
			}
			// 自动过
			if(this.btnRAutoCheck.node.active && this.btnRAutoCheck.isChecked) {
				kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
					value:"0",
					type:TexasDefine.BetType.Check,
				})	
				this.nodeRoot.active = false 
				this.timer_.setTimer()
				break 
			}
			// 自动过/弃
			if(this.btnLAutoCheckAbandon.node.active && this.btnLAutoCheckAbandon.isChecked) {
				if(!this.isSelfMaxValue() && new Decimal(msg.maxValue).greaterThan(0)) {
					kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
						value:"0",
						type:TexasDefine.BetType.Abandon,
					})	
					this.nodeRoot.active = false 
					this.timer_.setTimer()
				} else {
					kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
						value:"0",
						type:TexasDefine.BetType.Check,
					})	
					this.nodeRoot.active = false 
					this.timer_.setTimer()
				}
				break 
			}
			// 自动弃
			if(this.btnLAutoAbandon.node.active && this.btnLAutoAbandon.isChecked) {
				kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
					value:"0",
					type:TexasDefine.BetType.Abandon,
				})	
				this.nodeRoot.active = false 
				this.timer_.setTimer()
				break 
			}
			
			this.btnRCheck.node.active = false 
			this.btnRCall.node.active = false 
			this.btnRAllinToCall.node.active = false 

			this.btnLAbandon.node.active = true  
			this.nodeRaise.active = false 

			for(let def of this.btnDefines) {
				def.nodeRoot.active = false 
			}
			this.touchInfo_ = null 

			// let callValue = Decimal.sub(msg.maxValue,msg.prevValue)
			// allin to call
			if(callValue.greaterThan(this.gameLayer.selfPlayer.score)) {
				this.btnRAllinToCall.node.active = true 
				this.lblRAllinToCallValue.string = this.gameLayer.selfPlayer.score
			} else {
				if(callValue.lessThanOrEqualTo(0)) {
					this.btnRCheck.node.active = true 
				} else {
					this.btnRCall.node.active = true 
					this.lblRCallValue.string = callValue.toString() 
				}

				this.nodeRaise.active = true 
				this.nodeRaiseShow.active = false 
				let selfScore = new Decimal(this.gameLayer.selfPlayer.score)
				this.touchInfo_ = {
					minValue:callValue,
					maxValue:new Decimal(this.gameLayer.selfPlayer.score),
					curValue:callValue,
					curPer:0,
					lastScore:selfScore, 
				}
				// if(this.touchInfo_.maxValue.greaterThan(selfScore)) {
				// 	this.touchInfo_.maxValue = selfScore
				// 	if(this.touchInfo_.maxValue.lessThan(this.touchInfo_.minValue)) {
				// 		this.touchInfo_ = null 
				// 	}
				// }

				// this.lblRaiseMaxValue.string = this.touchInfo_.maxValue.toString()
				this.lblRaiseAllMaxValue.string = this.touchInfo_.maxValue.toString()
				// 加注
				if(!this.initTouch_) {
					this.initTouch_ = true 
					let funcOnTouch = (touch:cc.Touch)=>{
						let pos = this.nodeRaiseTouch.parent.convertToNodeSpaceAR(touch.getLocation())
						let realRect = this.nodeRaiseTouch.getBoundingBox()
						let offsetRect = realRect.clone()
						{
							offsetRect.y -= this.touchDownOffset
							offsetRect.height += (this.touchDownOffset + this.touchTopOffset)
							kcore.log.info("downoffset " + this.touchDownOffset)
							kcore.log.info("topoffset " + this.touchTopOffset)
							kcore.log.info("real " + realRect.toString())
							kcore.log.info("rect " + offsetRect.toString())
							let per = (pos.y - offsetRect.y) / offsetRect.height
							kcore.log.info("per " + per + " pos = " + pos.toString())
							per = cc.misc.clamp01(per)
							let curValue:Decimal
							this.nodeRaiseAllin.active = false 
							this.nodeRaiseBarNormal.active = true
							this.nodeRaiseBarAllIn.active = false 
							if(per == 0) {
								curValue = this.touchInfo_.minValue
							} else if(per == 1) {
								curValue = this.touchInfo_.maxValue
								this.nodeRaiseAllin.active = true 
								this.nodeRaiseBarNormal.active = false
								this.nodeRaiseBarAllIn.active = true
							} else {
								curValue = this.touchInfo_.maxValue.sub(this.touchInfo_.minValue).mul(per).add(this.touchInfo_.minValue)
								curValue = curValue.toDecimalPlaces(1,Decimal.ROUND_DOWN)
							}
							this.touchInfo_.curValue = curValue
							this.touchInfo_.curPer = per 
							// this.lblRaiseCurValue.string = curValue.toString()
							this.lblRaiseCurValue.string = Math.floor(per * 100) + "%"
							this.lblRaiseMaxValue.string = curValue.toString()
						}
						{
							let per = (pos.y - offsetRect.y) / offsetRect.height
							per = cc.misc.clamp01(per)
							
							let x = 0.5 * offsetRect.width + offsetRect.x
							let y = per * offsetRect.height + offsetRect.y
							let tagPos = kcore.utils.convertPositionPS(this.nodeRaiseTouch,this.nodeRaiseTag,cc.v2(x,y))
							this.nodeRaiseTag.position2 = tagPos 

							this.raiseBar.progress = per
						}
					}
					this.nodeRaiseActive.on(cc.Node.EventType.TOUCH_START,(touch:cc.Touch)=>{
						if(!this.touchInfo_ || !this.nodeRaise.active) {
							this.nodeRaiseShow.active = false 
							return 
						}
						let pos = this.nodeRaiseActive.parent.convertToNodeSpaceAR(touch.getLocation())
						if(!this.nodeRaiseActive.getBoundingBox().contains(pos)) {
							this.nodeRaiseShow.active = false 
							return 
						}
						this.nodeRaiseShow.active = true 
						funcOnTouch(touch)
					})
					this.nodeRaiseActive.on(cc.Node.EventType.TOUCH_MOVE,(touch:cc.Touch)=>{
						if(!this.touchInfo_) {
							this.nodeRaiseShow.active = false 
							this.nodeRaise.active = false 
							return 
						}
						funcOnTouch(touch)
					})
					let funcEnd = (touch:cc.Touch)=>{
						if(!this.touchInfo_) {
							this.nodeRaiseShow.active = false 
							return 
						}
						if(!this.nodeRaiseShow.active) {
							return 
						}
						if(this.touchInfo_.curPer > 0) {
							kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
								value:this.touchInfo_.curValue.toString(),
								type:TexasDefine.BetType.Raise,
							})	
							this.touchInfo_ = null 
							this.nodeRoot.active = false 
						}
						this.nodeRaiseShow.active = false 
					}
					this.nodeRaiseActive.on(cc.Node.EventType.TOUCH_END,funcEnd)
					this.nodeRaiseActive.on(cc.Node.EventType.TOUCH_CANCEL,funcEnd)
					// this.nodeRaiseActive.on(cc.Node.EventType.TOUCH_CANCEL,()=>{
					// 	if(!this.touchInfo_) {
					// 		this.nodeRaiseShow.active = false 
					// 		return 
					// 	}
					// 	this.nodeRaiseShow.active = false 
					// })
				}
				this.nodeRaise.active = true 
				this.nodeRaiseShow.active = false 
				this.nodeRaiseAllin.active = false 
				this.nodeRaiseBarNormal.active = true
				this.nodeRaiseBarAllIn.active = false
				this.raiseBar.progress = 0
				// 5档位
				// let selfScore = new Decimal(this.gameLayer.selfPlayer.score)
				this.refreshBet();
				// let _localSet:TexasLocalData = rcData.get('texas/local/data');
				// let _curSet = _localSet?_localSet.quickBetSettings.find(v=>v.buttonCount == _localSet.quickBetSelect).betValues:[]
				// for (let i = 0; i < this.betDefines.length; i++) {
				// 	let def = this.betDefines[i];
					
				// 	let value = new Decimal(0);
				// 	if(_localSet){
				// 		let _curV = _curSet[i];
				// 		def.btn.node.active = (i<_localSet.quickBetSelect)
				// 		if(Math.ceil(def.numUp/def.numDown*100) == _curV){
				// 			if(def.numDown == 1) {
				// 				def.lblDesc.string = "" + def.numUp
				// 			} else {
				// 				def.lblDesc.string = "" + def.numUp + "/" + def.numDown
				// 			}
				// 		}else{
				// 			def.lblDesc.string = (_curV/100).toFixed(2)
				// 		}
				// 		value = this.totalValue_.mul(_curV).div(100).toDecimalPlaces(1,Decimal.ROUND_DOWN)
				// 	}
				// 	else{
				// 		value = this.totalValue_.mul(def.numUp).div(def.numDown).toDecimalPlaces(1,Decimal.ROUND_DOWN)
				// 		def.btn.node.active = true 
						
				// 		if(def.numDown == 1) {
				// 			def.lblDesc.string = "" + def.numUp
				// 		} else {
				// 			def.lblDesc.string = "" + def.numUp + "/" + def.numDown
				// 		}
						
				// 	}
				// 	if(value.lessThanOrEqualTo(callValue) || selfScore.lessThan(value)) {
				// 		def.btn.interactable = false 
				// 	} else {
				// 		def.btn.interactable = true 
				// 	}
				// 	def.lblValue.string = value.toString()
				// }
			}



		} while (false);


		this.btnRAutoCall.node.active = false 
		this.btnRAutoCheck.node.active = false 
		this.btnLAutoCheckAbandon.node.active = false 
		this.btnLAutoAbandon.node.active = false 
	}
	refreshBet(){
		if(!this.touchInfo_){
			return null;
		}
		let selfScore = new Decimal(this.gameLayer.selfPlayer.score)
		let _localSet:TexasLocalData = kcore.data.get('texas/local/data');
		let _curSet = _localSet?_localSet.quickBetSettings.find(v=>v.buttonCount == _localSet.quickBetSelect).betValues:[]
		for(let def of this.btnDefines) {
			def.nodeRoot.active = false
		}
		let useDef = this.btnDefines.find(v=>v.btnCount == _localSet.quickBetSelect) || this.btnDefines[0]
		useDef.nodeRoot.active = true 
		useDef.nodeRoot.stopAllActions()
		useDef.nodeRoot.opacity = 0
		useDef.nodeRoot.runAction(cc.fadeIn(0.1))
		for (let i = 0; i < useDef.btnCount; i++) {
			let child = useDef.nodeRoot.children[i];
			if(!child){
				continue;
			}
			let lblDesc = child.childCom("desc",cc.Label)
			let lblValue = child.childCom("value",cc.Label)
			let btn = child.getComponent(cc.Button)
			let value = new Decimal(0);
			if(_localSet){
				
				let _curV = _curSet[i];
				// if(Math.ceil(def.numUp/def.numDown*100) == _curV){
				// 	if(def.numDown == 1) {
				// 		def.lblDesc.string = "" + def.numUp
				// 	} else {
				// 		def.lblDesc.string = "" + def.numUp + "/" + def.numDown
				// 	}
				// }else{
				// 	def.lblDesc.string = (_curV/100).toFixed(2)
				// }
				lblDesc.string = TexasQuickBet.convert(_curV)
				value = this.totalValue_.mul(_curV).div(100).toDecimalPlaces(1,Decimal.ROUND_DOWN)
			}
			if(value.lessThanOrEqualTo(this.touchInfo_.curValue) || selfScore.lessThan(value)) {
				btn.interactable = false 
			} else {
				btn.interactable = true 
			}
			lblValue.string = value.toString()
		}
	}

	onClickCheck() {
		kcore.click.playAudio()
		kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
			value:"0",
			type:TexasDefine.BetType.Check,
		})	
		this.nodeRoot.active = false 
		this.timer_.setTimer()
	}

	onClickAbandon() {
		kcore.click.playAudio()
		kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
			value:"0",
			type:TexasDefine.BetType.Abandon,
		})	
		this.nodeRoot.active = false 
		this.timer_.setTimer()
	}

	onClickCall(_,value:string) {
		kcore.click.playAudio()
		if(value) {
			kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
				value:value,
				type:TexasDefine.BetType.Call,
			})
		} else if(this.btnRCall.node.active) {
			kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
				value:this.lblRCallValue.string,
				type:TexasDefine.BetType.Call,
			})	
		} else if(this.btnRAllinToCall.node.active) {
			kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
				value:this.lblRAllinToCallValue.string,
				type:TexasDefine.BetType.Allin,
			})	
		}
		this.nodeRoot.active = false 
		this.timer_.setTimer()
	}

	onClickBetDefineButton(_,s:string) {
		kcore.click.playAudio()
		let idx = parseInt(s)
		
		let _localSet:TexasLocalData = kcore.data.get('texas/local/data');
		let useDef = this.btnDefines.find(v=>v.btnCount == _localSet.quickBetSelect) || this.btnDefines[0]
		let child = useDef.nodeRoot.children[idx];
		if(!child){
			return;
		}
		let btn = child.getComponent(cc.Button)
		let lblValue = child.childCom("value",cc.Label)
		kcore.log.info("on click bet define idx = " + idx + " value = " + lblValue.string)
		if(btn.node.active && btn.interactable) {
			kcore.gnet.send(GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
				value:lblValue.string,
				type:TexasDefine.BetType.Raise,
			})	
			this.nodeRoot.active = false 
			this.timer_.setTimer()
		}
	}
}