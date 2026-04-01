import { kdutils } from "kdweb-core/lib/utils";
import { GSUserMsg } from "../../../pp-base-define/GSUserMsg";
import { GSCommonMsg } from "../../../pp-game-base/GSCommonMsg";
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../../../pp-game-texas/TexasDefine";
import { BaseRobotLogic } from "../../base/BaseRobotLogic";
import { TexasGameTreeLogic } from "../../game/texas/TexasGameTreeLogic";
import { Log } from "../../log";
import Decimal from "decimal.js";


export class RobotLogic_101Texas extends BaseRobotLogic {

	private gameLogicTree_:TexasGameTreeLogic = null;

	async onInitRobotLogic() {
		super.onInitRobotLogic()
		this.initListener();
		this.gameLogicTree_ = new TexasGameTreeLogic()
		this.gameLogicTree_.init();
		this.gameLogicTree_.saveWorker(this.worker_);
		this.gameLogicTree_.saveGameSet(this.gameSet);
		this.gameLogicTree_.saveSelfUserID(this.selfUserID);
		this.gameLogicTree_.saveStrategy(this.strategy,this.strategyData,this.personality);
	}

	private phase_:TexasGamePhase = null 
	get phase() {
		return this.phase_
	}
	set phase(v) {
		this.phase_ = v
	}
	private initListener() {
		this.listen(GSCommonMsg.Bet,kdutils.handler(this,this.handleBet))
		this.listen(GSCommonMsg.BetTurn,kdutils.handler(this,this.handleBetTurn))
		this.listen(TexasUserMsg.PhaseChange,kdutils.handler(this,this.handlePhaseChange))
		this.listen(GSCommonMsg.GameResult,kdutils.handler(this,this.handleGameResult))
		this.listen(GSCommonMsg.Deal,kdutils.handler(this,this.handleDeal))
		
	}
	
	private handleBet(msg:GSCommonMsg.tBetNT) {
		if(!msg || !msg.bets){
			return;
		}
		if(!this.gameLogicTree_){
			return;
		}
		
		for (const item of msg.bets) {
			let _user = this.users.find(v=>v.chairNo == item.chairNo)
			if(_user){
				this.gameLogicTree_.saveBetOpponentAction(_user.userID,item.type,item.value,this.phase);
			}
		}
	}
	private handleBetTurn(msg:GSCommonMsg.tBetTurnNT) {
		// todo
		if(msg.chairNo != this.selfChairNo) {
			Log.oth.info(`handleBetTurn not self userID = ${this.selfUserID} chairNo = ${this.selfChairNo} msg.chairNo = ${msg.chairNo}`)
			return 
		}
	
		//随机时间 不立刻响应操作
		let _randTime = Math.floor(Math.random() * Math.min(msg.timeoutSec,3)+1);
		if(this.gameLogicTree_){
			//this.gameLogicTree_.saveBetTurn(msg)

			setTimeout(() => {
				this.gameLogicTree_.saveUsers(this.users);
				this.gameLogicTree_.saveRobotList(this.robotMarkList);
				if(!this.gameLogicTree_.tick({betTurn:msg})){
					//如果运行失败 则放弃
					this.worker_.sendToGS(this.selfUserID,GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
						value:"0",
						type:TexasDefine.BetType.Abandon,
					})	
				}
			}, _randTime * 1000);
			
		}
	}
	private handleDeal(msg:GSCommonMsg.tDealNT) {
		// todo
		if(this.gameLogicTree_ && msg){
			this.gameLogicTree_.saveCards(msg)
		}
	}
	private handlePhaseChange(msg:TexasUserMsg.tPhaseChangeNT) {
		this.phase = msg.phase
		if(this.gameLogicTree_){
			this.gameLogicTree_.savePhase(msg.phase);
		}

	}
	private handleGameResult(msg:GSCommonMsg.tGameResultNT) {
		let selfUser = msg.users.find(v=>v.userID == this.selfUserID)
		if(selfUser) {
			// todo
		}
		for (const user of msg.users) {
			if(new Decimal(user.scoreChanged).greaterThan(0)){
				if(this.robotMarkList.includes(user.userID)){
					// 清理强制allin
					this.gameLogicTree_.clearForceAllIn(user.userID);
				}
			}
		}
	}
	
	handleGameStart(msg: GSUserMsg.tGameStartNT): void {
		super.handleGameStart(msg);
		if(this.gameLogicTree_){
			if(msg.playingChairNos && msg.playingChairNos.length > 0){
				this.gameLogicTree_.savePlayingChairNos(msg.playingChairNos);
				for (const item of msg.playingChairNos) {
					let _user = this.users.find(v=>v.chairNo == item)
					if(_user){
						this.gameLogicTree_.saveStartOpponentAction(_user.userID);
					}
				}
			}
			
		}
	}
	handleGameStartData(msg: GSUserMsg.tGameStartNT): void {
		super.handleGameStartData(msg);
		this.phase = null
		let gameStartData_:TexasUserMsg.tGameStartData = msg.data
		if(this.gameLogicTree_){
			this.gameLogicTree_.saveGameStartData(gameStartData_);
		}
	}

	handleGameSync(msg:GSUserMsg.tGameSyncNT){
		super.handleGameSync(msg);
		let syncData_:TexasUserMsg.tSyncData = msg.syncData
		if(syncData_){
			this.handlePhaseChange({phase:syncData_.phase})
			if(syncData_.betTurnNT){
				this.handleBetTurn(syncData_.betTurnNT)
			}
			if(syncData_.pool && syncData_.pool.stacks){
				for (const item of syncData_.pool.stacks) {
					for (const user of item.users) {
						if(this.gameLogicTree_){
							let _selfUser = this.users.find(v=>v.chairNo == user.chairNo)
							this.gameLogicTree_.saveUserBetScore(_selfUser.userID,user.value)
						}
					}
					
				}
			}
			if(syncData_.users){
				let _syncDeal = syncData_.users.map(v=>{
					return {
						type:0,
						chairNo:v.chairNo,
						cards:v.cards
					}
				})
				this.handleDeal({deals:_syncDeal});
				if(this.gameLogicTree_){
					this.gameLogicTree_.saveUserPostitions(syncData_.users);
				}
			}
		}

		//this.quickSitDown();
	}

	handleRoundEnd(msg: GSUserMsg.tRoundEndNT): void {
		
	}
	handleResetDatas(){
		if(this.gameLogicTree_){
			this.gameLogicTree_.clearAll();
		}
	}
	setTreeConfig(key:string,value:any) {
		if(this.gameLogicTree_){
			this.gameLogicTree_.saveConfigByKey(key,value);
		}
	}
	// quickSitDown(){
	// 	let _selfUser = this.getSelfUser();
	// 	if(_selfUser.chairNo < 100000) {
	// 		return;
	// 	}
	// 	let _chairs = this.playingChairNos;
	// 	let _canSitDownChair = [0,1,2,3,4,5,6,7].filter(v=>!_chairs.includes(v));

	// 	let _randChair = _canSitDownChair[Math.floor(Math.random() * _canSitDownChair.length)];
	// 	let req: GSCommonMsg.tBuyinReq = {
	// 		score: "100",
	// 		toChairNo: _randChair,
	// 	}
	// 	this.worker_.sendToGS(this.selfUserID,GSCommonMsg.Buyin, req)
	// }
}