import { GSUserMsg } from "../../../pp-base-define/GSUserMsg";
import { GameSet } from "../../../pp-base-define/GameSet";
import { RobotDefine } from "../../../pp-base-define/RobotDefine";
import { IRobotProcessWorker } from "../../entity/IRobotProcessWorker";
import { Log } from "../../log";
import * as b3 from "../tree/b3"
import { TexasTreeClsRegister } from "./TexasTreeClsRegister";
import { TexasStrategyJson } from "./configs/TexasStrategyJson";
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "./define/TexasTreeExtraDefine";

export class TexasStrategyLogic {
    private _tree: b3.BehaviorTree;
    private _blackboard: b3.Blackboard<TexasTreeExtraDefine>;
    
    init() {
        this._blackboard = new b3.Blackboard<TexasTreeExtraDefine>();
        this._tree = new b3.BehaviorTree();
        this._tree.openLog();
        this._tree.load(TexasStrategyJson, TexasTreeClsRegister);
    }
    tick(data:TexasTickRealtimeData){
        data = data || {};
        if(!this._tree){
            Log.oth.error("[BehaviorTree]","TexasStrategyLogic _tree is null")
            return false;
        }
        try {
            //this._blackboard.dumpLog();
            this._tree.tick(data, this._blackboard)
            return true
        } catch (error) {
            Log.oth.error("[BehaviorTree]","TexasStrategyLogic _tree run error",error)
            return false;
        }
    }
    saveStrategy(strategy:RobotDefine.RuntimeStrategy,strategyData:any,personality:any){
        let data = {
            strategy:strategy,
            strategyData:strategyData,
            personality:personality,
        }
        this._blackboard.set("strategy",data)
    }
    saveWorker(worker:IRobotProcessWorker){
        this._blackboard.setRuntime("worker",worker)
    }
    saveGameSet(gameSet:GameSet){
        this._blackboard.setRuntime("gameSet",gameSet)
    }
    saveUsers(users:GSUserMsg.tUserEnterData[]){
        this._blackboard.set("users",users) 
        let _userID = this._blackboard.get("selfUserID")
        let _selfUser = users.find(v=>v.userID == _userID)
		if(_selfUser){
            this._blackboard.set("selfUser",_selfUser)
        }
    }

    saveSelfUserID(userID:number){
        this._blackboard.set("selfUserID",userID) 
    }
    saveGameStart(){
        let _strategy =  this._blackboard.get("strategy")
        if(_strategy && _strategy.strategyData){
            if(!_strategy.strategyData.curJuCount){
                _strategy.strategyData.curJuCount = 0;
            }
            _strategy.strategyData.curJuCount ++
        }
    }

    savePlayingChairNos(chairNos:number[]){
        this._blackboard.set("playingChairNos",chairNos)
    }
    saveBuyinStatus(isBuyin:boolean){
        this._blackboard.set("readyBuyIn",isBuyin)
    }
    saveAttackTargetIDs(attackTargetIDs:number[]){
        this._blackboard.set("attackTargetUserIDs",attackTargetIDs)
    }
    saveRobotList(users:number[]){
        this._blackboard.set("robotUserIDs",users)
    }
}