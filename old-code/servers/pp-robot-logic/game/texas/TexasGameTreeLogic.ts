import { CardArray, tCard } from "../../../pp-base-define/CardDefine";
import { GameSet } from "../../../pp-base-define/GameSet";
import { GSUserMsg } from "../../../pp-base-define/GSUserMsg";
import { GSCommonMsg } from "../../../pp-game-base/GSCommonMsg";
import { TexasDefine, TexasGamePhase, TexasRule, TexasUserMsg } from "../../../pp-game-texas/TexasDefine";
import { IRobotProcessWorker } from "../../entity/IRobotProcessWorker";
import * as b3 from "../tree/b3"
import { TexasTreeClsRegister } from "./TexasTreeClsRegister";
import { TexasGameTreeJson } from "./configs/TexasGameTreeJson";
import { IRobotUserOpponentRecord, TexasTickRealtimeData, TexasTreeExtraDefine } from "./define/TexasTreeExtraDefine";
import { Poker } from "../../../pp-base-define/PokerDefine";
import { TexasPower } from "../../../pp-game-texas/TexasPower";
import Decimal from "decimal.js";
import { Log } from "../../log";
import { TexasOpponentRecord } from "./calc/TexasOpponentRecord";
import { RobotDefine } from "../../../pp-base-define/RobotDefine";

export class TexasGameTreeLogic {
    private _tree: b3.BehaviorTree;
    private _blackboard: b3.Blackboard<TexasTreeExtraDefine>;
    private _oppenteRecord: TexasOpponentRecord;
    init() {
        this._blackboard = new b3.Blackboard<TexasTreeExtraDefine>();
        this._tree = new b3.BehaviorTree();
        this._tree.openLog();
        this._tree.load(TexasGameTreeJson, TexasTreeClsRegister);
        this._oppenteRecord = new TexasOpponentRecord(this._blackboard);
        this._blackboard.setRuntime("oppenteActionCls",this._oppenteRecord)
    }
    tick(data:TexasTickRealtimeData){
        data = data || {};
        if(!this._tree){
            Log.oth.error("[BehaviorTree]","TexasGameTreeLogic _tree is null")
            return false;
        }
        Log.oth.info("[BehaviorTree]","TexasGameTreeLogic tick",data)
        try {
            this._tree.tick(data, this._blackboard)
            return true
        } catch (error) {
            Log.oth.error("[BehaviorTree]","TexasGameTreeLogic _tree run error",error)
            return false;
        }
    }

    saveWorker(worker:IRobotProcessWorker){
        this._blackboard.setRuntime("worker",worker)
    }
    saveGameSet(gameSet:GameSet){
        this._blackboard.setRuntime("gameSet",gameSet)
        Log.oth.info("[BehaviorTree]","TexasGameTreeLogic saveGameSet",gameSet)
        let cards = new CardArray
		if(gameSet.checkRule(TexasRule.Group1,TexasRule.Group1_Long)) {
			for(let i = Poker.Value.V1 ; i <= Poker.Value.K ; i ++) {
				for(let j = Poker.Suit.Begin ; j < Poker.Suit.End ; j ++) {
					cards.push({value:i,suit:j})
				}
			}
		} else {
			for(let i = Poker.Value.V6 ; i <= Poker.Value.K ; i ++) {
				for(let j = Poker.Suit.Begin ; j < Poker.Suit.End ; j ++) {
					cards.push({value:i,suit:j})
				}
			}
			for(let j = Poker.Suit.Begin ; j < Poker.Suit.End ; j ++) {
				cards.push({value:Poker.Value.V1,suit:j})
			}
		}
        let _power = new TexasPower(gameSet)
        this._blackboard.setRuntime("cardsPower",_power)
        this._blackboard.set("allCards",cards)
    }

    saveGameStartData(data:TexasUserMsg.tGameStartData){
        this.saveUserPostitions(data.users)
        this._blackboard.set("userBetScore",{})
        this.clearCards();
    }
    saveUserPostitions(data:{chairNo:number,position:TexasDefine.PositionType}[]){
        this._blackboard.set("userPostitions",data)
    }
    saveConfigByKey(key:string,value:any){
        this._blackboard.set<any>(key,value)
    }

    saveCards(msg:GSCommonMsg.tDealNT){
        let _handcards = this._blackboard.get("handCards")
        let _desktopCards = this._blackboard.get("desktopCards")
        let _allDiCards = this._blackboard.get("allDiCards")

        if(!_handcards){
            _handcards = []
        }

        for (const deal of msg.deals) {
            if(deal.chairNo == -1){
                //桌面牌
                if(deal.type == TexasDefine.DealType.Di){
                    _allDiCards = deal;
                }else{
                    if(!_desktopCards){
                        _desktopCards = deal;
                    }else{
                        _desktopCards.cards.push(...deal.cards)

                    }
                }
                
                continue
            }
            let _handcard = _handcards.find(v=>v.chairNo == deal.chairNo)
            if(!_handcard){
            	_handcards.push(deal)
            }else{
                if(deal.chairNo == -1 && _handcard.cards.length == 5){
                    continue;
                }
                _handcard.cards.push(...deal.cards)
            }
            
        }

        this._blackboard.set("handCards",_handcards)
        this._blackboard.set("desktopCards",_desktopCards)
        this._blackboard.set("allDiCards",_allDiCards)
    }
    clearCards(){
        this._blackboard.set("handCards",[])
        this._blackboard.set("desktopCards",null)
        this._blackboard.set("allDiCards",null)
    }
    savePhase(phase:TexasGamePhase){
        this._blackboard.set("phase",phase)
        this._blackboard.set("phaseChairNos",[])
    }
    // saveBetTurn(msg:GSCommonMsg.tBetTurnNT){
    //     this._blackboard.set("betTurn",msg)
    // }
    saveUsers(users:GSUserMsg.tUserEnterData[]){
        this._blackboard.set("users",users) 
        let _userID = this._blackboard.get("selfUserID")
        let _selfUser = users.find(v=>v.userID == _userID)
		if(_selfUser){
            this._blackboard.set("selfUser",_selfUser)
            this._oppenteRecord.setUser(_selfUser.userID)
        }
    }

    saveSelfUserID(userID:number){
        this._blackboard.set("selfUserID",userID) 
    }
    savePlayingChairNos(chairNos:number[]){
        this._blackboard.set("playingChairNos",chairNos)
    }
    saveStrategy(strategy:RobotDefine.RuntimeStrategy,strategyData:any,personality:any){
        let data = {
            strategy:strategy,
            strategyData:strategyData,
            personality:personality,
        }
        this._blackboard.set("strategy",data)
    }
    saveUserBetScore(userID:number,score:string){
        //记录用户分数
        let userBtnScores_ = this._blackboard.get("userBetScore")
        if(!userBtnScores_){
            userBtnScores_ = {}

        }
        if(userBtnScores_[userID]){
        	userBtnScores_[userID] = Decimal.add(userBtnScores_[userID],score).toString()	
        }else{
        	userBtnScores_[userID] = score;
        }
       
        this._blackboard.set("userBetScore",userBtnScores_)
    }

    /**
     * 游戏开始行为
     * @param userID 
     */
    saveStartOpponentAction(userID:number){
        
        if(this._oppenteRecord){
            this._oppenteRecord.saveStartOpponentAction(userID)
            this._oppenteRecord.save();
        }
       
    }
    /**
     * 下注行为
     * @param userID 
     * @param action 
     * @param score 
     * @param phase 
     */
    saveBetOpponentAction(userID:number,action:TexasDefine.BetType,score:string,phase:TexasGamePhase){

        let _phaseChairs = this._blackboard.get("phaseChairNos")
        if(!_phaseChairs){
            _phaseChairs = [];
        }
        if(!_phaseChairs.includes(userID)){
            _phaseChairs.push(userID)
        }
        this.saveUserBetScore(userID,score)

        if(this._oppenteRecord){
            this._oppenteRecord.saveBetOpponentAction(userID,action,score,phase)
            this._oppenteRecord.save();
        }
    }

    clearAll(){
        this._blackboard = new b3.Blackboard<TexasTreeExtraDefine>();
    }
    saveRobotList(users:number[]){
        this._oppenteRecord.saveRobotList(users)
        this._blackboard.set("robotUserIDs",users)
    }
    clearForceAllIn(robotID){   
        if(this._oppenteRecord){
            Log.oth.info("clearForceAllIn","userID = ",robotID)
            this._oppenteRecord.clearForceAllIn()
            // let _user = this._oppenteRecord.getUser(robotID)
            // let _allin = _user.phaseRecord.find(v=>v.action == TexasDefine.BetType.Allin);
            // if(_allin && _allin.count > 0){
                
            // }
        }
    }
}