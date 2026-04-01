import { GameConfigSerialize } from "../../../games/GameConfigSerialize";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import BaseGameLayer from "../BaseGameLayer";
import { BaseGameLayerExtension } from "../BaseGameLayerExtension";
import { GameLayerEvents } from "../GameLayerEvents";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/GameLayerExt_FupanControl")
export default class GameLayerExt_FupanControl extends BaseGameLayerExtension<BaseGameLayer> {
	@property()
	stepIntervalSec:number = 1
	@property(cc.Button)
	btnPause:cc.Button = null
	@property(cc.Button)
	btnResume:cc.Button = null
	private msgs_:{
		msgName:string,
		jsonObj:any,
	}[]

	private autoStep_:boolean = false 
	get autoStep() {
		return this.autoStep_
	}
	set autoStep(v) {
		this.autoStep_ = v
		
		this.btnPause.node.active = v 
		this.btnResume.node.active = !v 
	}
	private intervalSec_ = 0
	private isEnd_ = false 
	private nextIdx_ = 0
	onInitLayerExtension(): void {
		if(!this.gameLayer.isFupan) {
			this.node.active = false 
			return 
		}
		this.autoStep = true 
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GameLayerEvents.ON_FUPANSTART,(zipData:string)=>{
				try {
					let str = kcore.api.gunzip(zipData)
					this.msgs_ = JSON.parse(str)
					this.goStep()
				} catch (error) {
					kcore.log.error("decode fupan error",error)
					this.onClickBack()
				}
			})
	}

	protected update(dt: number): void {
		if(this.isEnd_) {
			return 
		}
		if(!this.msgs_) {
			return 
		}
		if(!this.autoStep) {
			return 
		}
		this.intervalSec_ -= dt 
		if(this.intervalSec_ <= 0) {
			this.intervalSec_ = this.stepIntervalSec
			this.goStep()
		}
	}

	goStep() {
		if(this.isEnd_) {
			return false 
		}
		if(!this.msgs_) {
			return false 
		}
		while(true) {
			let msg = this.msgs_[this.nextIdx_ ++]
			kcore.log.info("step msg idx = " + (this.nextIdx_ - 1),msg)
			if(!msg || msg.msgName == GSUserMsg.FupanEnd) {
				this.isEnd_ = true 
				kcore.tip.push("提示","复盘已结束",1,()=>{
					this.onClickBack()
				}).setIgnoreOutBound()
				return false 
			}
			if(msg.msgName == GSUserMsg.Online) {
				continue 
			}
			kcore.gnet.dispatchTcp(msg.msgName,msg.jsonObj)
			this.gameLayer.dispMsg.dispatch(msg.msgName,msg.jsonObj)
			if(msg.msgName == GSUserMsg.ScoreChange 
				|| msg.msgName == GSCommonMsg.Wait
				|| msg.msgName == GSCommonMsg.BetTurn) {
				continue 
			}
			break 
		}
		return true 
	}

	onClickPause() {
		kcore.click.playAudio()
		this.autoStep = false 
	}
	onClickResume() {
		kcore.click.playAudio()
		this.autoStep = true 
	}
	onClickNext() {
		kcore.click.playAudio()
		this.goStep()
	}
	onClickBack() {
		kcore.click.playAudio()
		kcore.layer.lobby()
	}
}