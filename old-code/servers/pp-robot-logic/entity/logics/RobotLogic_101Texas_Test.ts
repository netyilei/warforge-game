import Decimal from "decimal.js";
import { GSUserMsg } from "../../../pp-base-define/GSUserMsg";
import { GSCommonMsg } from "../../../pp-game-base/GSCommonMsg";
import { TexasDefine, TexasGamePhase, TexasRule, TexasUserMsg } from "../../../pp-game-texas/TexasDefine";
import { BaseRobotLogic } from "../../base/BaseRobotLogic";


export class RobotLogic_101Texas_Test extends BaseRobotLogic {

	async onInitRobotLogic() {
		await super.onInitRobotLogic()	
		
	}

	private phase_:TexasGamePhase = null 
	get phase() {
		return this.phase_
	}
	set phase(v) {
		this.phase_ = v
	}
	onMessage(msgName: string, jsonObj: any): void {
		super.onMessage(msgName,jsonObj)
		switch(msgName) {
			case GSUserMsg.GameStart:{
				this.phase = null 
			} break 
			case GSUserMsg.GameEnd:{

			} break 
			case GSUserMsg.GameSync:{
				let msg:GSUserMsg.tGameSyncNT = jsonObj
				let data:TexasUserMsg.tSyncData = msg.syncData
				// todo
				if(msg.gameStartNT) {
					this.phase_ = data.phase
				}
				if(data.betTurnNT && data.betTurnNT.chairNo == this.selfChairNo) {
					this.doBetTurn(data.betTurnNT)
				}
			} break 
			case GSCommonMsg.Bet:{

			} break 
			case GSCommonMsg.BetTurn:{
				let msg:GSCommonMsg.tBetTurnNT = jsonObj
				if(msg.chairNo != this.selfChairNo) {
					break 
				}
				this.doBetTurn(msg)
				// todo 
			} break 
			case TexasUserMsg.PhaseChange:{
				let msg:TexasUserMsg.tPhaseChangeNT = jsonObj
				this.phase = msg.phase
				// todo 
				switch(this.phase) {
					case TexasGamePhase.Ante:{

					} break 
					case TexasGamePhase.BB:{

					} break 
					case TexasGamePhase.Pre:{

					} break 
					case TexasGamePhase.Flop:{

					} break 
					case TexasGamePhase.Turn:{

					} break 
					case TexasGamePhase.River:{

					} break 
					case TexasGamePhase.Show:{

					} break 
				}
			} break 
			case GSCommonMsg.GameResult:{
				let msg:GSCommonMsg.tGameResultNT = jsonObj
				let selfUser = msg.users.find(v=>v.userID == this.selfUserID)
				if(selfUser) {
					// todo
				}
			} break 
		}
	}

	doBetTurn(turnNT:GSCommonMsg.tBetTurnNT) {

		let lastScore = new Decimal(this.getSelfUser().score)
		if(this.phase <= TexasGamePhase.Pre) {
			let betValue = Decimal.sub(turnNT.maxValue,turnNT.prevValue)
			let betReq:GSCommonMsg.tBetReq = {
				value:null,
				type:null
			}
			if(betValue.greaterThan(0)) {
				if(betValue.greaterThan(lastScore)) {
					betReq.value = lastScore.toString()
					betReq.type = TexasDefine.BetType.Allin
				} else {
					betReq.value = betValue.toString()
					betReq.type = TexasDefine.BetType.Call
				}
			} else {
				betReq.value = "0"
				betReq.type = TexasDefine.BetType.Check
			}
			this.sendToGS(GSCommonMsg.Bet,betReq)
		} else {
			let betValue = Decimal.sub(turnNT.maxValue,turnNT.prevValue)
			let betReq:GSCommonMsg.tBetReq = {
				value:null,
				type:null
			}
			if(betValue.greaterThan(0)) {
				betReq.value = "0"
				betReq.type = TexasDefine.BetType.Abandon
			} else {
				betReq.value = "0"
				betReq.type = TexasDefine.BetType.Check
			}
			this.sendToGS(GSCommonMsg.Bet,betReq)
		}
	}

	handleUserEnter(msg: GSUserMsg.tUserEnterNT): void {
		super.handleUserEnter(msg)		
		this.log("handle user enter msg self = " + this.selfChairNo)
		if(this.isChairNoWatcher(this.selfChairNo)) {
			let toChairNo:number
			for(let i = 0 ; i < 8 ; i ++) {
				if(this.users.find(v=>v.chairNo == i)) {
					continue 
				}
				toChairNo = i 
				break 
			}
			if(toChairNo != null) {
				let minValue = new Decimal(this.gameSet.iSets[TexasRule.Group7_MinBuyin])
				let buyinReq:GSCommonMsg.tBuyinReq = {
					score:minValue.toString(),
					toChairNo,
				}
				this.worker_.sendToGS(this.selfUserID,GSCommonMsg.Buyin,buyinReq)
			}
		}
	}
}