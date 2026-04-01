import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { BaseGameLayerExtension } from "../../room/BaseGameLayerExtension";
import { TexasPool, TexasPoolManager } from "../TexasPool";
import { TexasDefine, TexasUserMsg } from "../TexasDefine";
import TexasPlayerExt_BoardPoolsWidget_SinglePool from "./TexasPlayerExt_BoardPoolsWidget_SinglePool";
import { TexasClientDefine } from "../TexasClientDefine";
import Decimal from 'decimaljs'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/texas/TexasGameLayerExt_BoardPools")
export default class TexasGameLayerExt_BoardPools extends BaseGameLayerExtension {
	@property(cc.Node)
	nodeRoot:cc.Node = null
	@property(cc.Node)
	nodeSidePoolTemplate:cc.Node = null
	@property(cc.Node)
	nodeSidePoolLayout:cc.Node = null
	@property()
	showOtherSidePool = true 

	@property(TexasPlayerExt_BoardPoolsWidget_SinglePool)
	totalPool:TexasPlayerExt_BoardPoolsWidget_SinglePool = null
	@property(TexasPlayerExt_BoardPoolsWidget_SinglePool)
	phasePool:TexasPlayerExt_BoardPoolsWidget_SinglePool = null

	protected curPhasePoolSerial_:number
	protected poolMgr_:TexasClientPoolManager
	protected sidePools_:{
		com:TexasPlayerExt_BoardPoolsWidget_SinglePool
		pool:TexasPool
	}[] = []
	onInitLayerExtension(): void {
		this.nodeRoot.active = false 
		this.nodeSidePoolTemplate.active = false 
		this.nodeSidePoolLayout.destroyAllChildren()

		this.gameLayer.dispMsg.addNode(this.node,null,this)
		.listen(GSUserMsg.GameStart,()=>{
			this.nodeRoot.active = true 

			this.nodeSidePoolLayout.destroyAllChildren()
			this.sidePools_.splice(0)
			this.phasePool.pool = null 

			this.poolMgr_ = new TexasClientPoolManager(this.gameLayer.playingChairNos)
			this.poolMgr_.funcRemoveAllSidePool = ()=>{
				this.nodeSidePoolLayout.removeAllChildren();
			}
			this.poolMgr_.funcOnSidePool = (pool)=>{

				let node = kcore.display.instantiate(this.nodeSidePoolTemplate)
				node.active = true 
				let com = node.getComponent(TexasPlayerExt_BoardPoolsWidget_SinglePool)
				this.nodeSidePoolLayout.addChild(node)
				this.sidePools_.push({
					com,
					pool,
				})
				com.pool = pool
			}
			this.totalPool.pool = this.poolMgr_.totalPool
			this.poolMgr_.stepPhase()
		})
		.listen(GSCommonMsg.Bet,(msg:GSCommonMsg.tBetNT)=>{
			for(let bet of msg.bets) {
				this.poolMgr_.onBet(bet.chairNo,new Decimal(bet.value),bet.type) 

				this.phasePool.refreshPool()
				for(let side of this.sidePools_) {
					side.com.refreshPool()
				}
			}
		})
		.listen(TexasUserMsg.PhaseChange,(msg:TexasUserMsg.tPhaseChangeNT)=>{
			if(TexasClientDefine.flyChipPhases.includes(msg.phase)) {
				let chairNos:number[] = []
				for(let i = this.poolMgr_.phasePoolStartIdx ; i < this.poolMgr_.stacks.length ; i ++) {
					let pool = this.poolMgr_.stacks[i]
					for(let user of pool.users) {
						if(chairNos.includes(user.chairNo)) {
							continue 
						}
						chairNos.push(user.chairNo)
					}
				}

				let rt = {
					count:0
				}
				for(let chairNo of chairNos) {
					let player = this.gameLayer.players.find(v=>v.chairNo == chairNo)
					if(!player) {
						continue 
					}
					let totalValue = this.poolMgr_.getUserCurPhaseTotalValue(chairNo)
					if(totalValue.lessThanOrEqualTo(0)) {
						continue 
					}
					let pool = player.getPotByPos(TexasClientDefine.PlayerPotPos.BetPool)
					let aniNode = this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Middle) || this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Top)
					rt.count ++
					this.gameLayer.dispMsg.dispatch(TexasClientDefine.Event_FlyChip,pool,this.totalPool.node,aniNode,1,()=>{
						rt.count --
						if(rt.count <= 0) {
							this.totalPool.refreshPool()
						}
					})
				}
				this.poolMgr_.stepPhase()
				// this.totalPool.refreshPool()
				this.phasePool.pool = this.poolMgr_.topPhasePool

				if(krenderer.asset.audio && rt.count > 0) {
					krenderer.asset.audio.play(TexasClientDefine.AUDIO_PHASE)
				}
			}
		})
		.listen(GSCommonMsg.GameResult,(resultNT:GSCommonMsg.tGameResultNT)=>{
			let aniNode = this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Middle) || this.gameLayer.getAniPosNode(kroom.GameLayerAniPos.Top)
			for(let user of resultNT.users) {
				if(new Decimal(user.scoreChanged).lessThanOrEqualTo(0)) {
					continue 
				}
				let player = this.gameLayer.players.find(v=>v.chairNo == user.chairNo)
				if(!player) {
					continue 
				}
				let pool = player.getPotByPos(TexasClientDefine.PlayerPotPos.BetPool)
				this.gameLayer.dispMsg.dispatch(TexasClientDefine.Event_FlyChip,this.totalPool.node,pool,aniNode,1)
			}

			if(krenderer.asset.audio) {
				krenderer.asset.audio.play(TexasClientDefine.AUDIO_RESULT)
			}
		})
		.listen(GSUserMsg.GameSync,(syncNT:GSUserMsg.tGameSyncNT)=>{
			let data:TexasUserMsg.tSyncData = syncNT.syncData
			
			this.nodeSidePoolLayout.destroyAllChildren()
			this.sidePools_.splice(0)
			this.phasePool.pool = null 

			if(syncNT.gameStartNT) {
				this.poolMgr_ = new TexasClientPoolManager(this.gameLayer.playingChairNos)
				this.poolMgr_.fromSync(data.pool)

				this.totalPool.pool = this.poolMgr_.totalPool
				let stackLength = this.poolMgr_.stacks.length
				this.phasePool.pool = stackLength > 1 ? this.poolMgr_.stacks[stackLength - 1] : null
				for(let i = 1 ; i < stackLength - 1 ; i ++) {
					let pool = this.poolMgr_.stacks[i]
					this.poolMgr_.funcOnSidePool(pool)
				}
			}
		}) 
	}
	onUserDataChanged(): void {
	}


	onPoolScaleAnimation(node:cc.Node) {
		node.stopAllActions()
		node.runAction(cc.sequence([
			cc.scaleTo(0.1,1.1).easing(cc.easeIn(2)),
			cc.scaleTo(0.1,1).easing(cc.easeOut(2)),
		]))
	}

}

class TexasClientPoolManager extends TexasPoolManager {
	private funcOnSidePool_:(pool:TexasPool)=>any = null 
	get funcOnSidePool() {
		return this.funcOnSidePool_
	}
	set funcOnSidePool(v) {
		this.funcOnSidePool_ = v
	}
	private funcRemoveAllSidePool_ = null
	set funcRemoveAllSidePool(v) {
		this.funcRemoveAllSidePool_ = v
	}
	get funcRemoveAllSidePool() {
		return this.funcRemoveAllSidePool_	
	}
	onCreateSidePool(pool: TexasPool): void {
		if(this.funcOnSidePool) {
			this.funcOnSidePool(pool)
		}
	}
	onRemoveAllSidePool(){
		if(this.funcRemoveAllSidePool) {
			this.funcRemoveAllSidePool()	
		}
	}
}