import _ from "underscore";
import { Poker } from "../../../../pp-base-define/PokerDefine";
import * as b3 from "../../tree/b3"
import { TexasRobotRateCalc } from "../calc/TexasRobotRateCalc";
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
import { RobotDefine } from "../../../../pp-base-define/RobotDefine";

/*
    随机概率
*/
export class B3RandomSuccess extends b3.Decorator {
   
    public enter(tick: b3.Tick): void {
        
    }
    public open(tick: b3.Tick): void {
        
    }
    public tick(tick: b3.Tick): b3.Status {
        if(!this.child){
            b3.Status.ERROR;
        }
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let status = this.child._execute(tick);
        if(status == b3.Status.SUCCESS){

            let _prop = this.properties || {};
            let _key = _prop["action"]
            if(!_key){
                return b3.Status.FAILURE;
            }
            let _randType = _prop["randomKey"] || "max"
            let _force = blackboard.get("forceWinRate") || 0
            if(_key == "allin"){
                _force *= 0.3;
            }
            let _randForce = _.random(0,100);
            if(_randForce<_force){
                
                tick.tree.B3Log("B3RandomSuccess allin _force = ",_force," _randForce = ",_randForce," key = ",_key)
                return b3.Status.SUCCESS;
            }

            let _rand = 10
            let _isBet = this.getIsBet(blackboard)
            if(_isBet){
                if(_key == "raise"){
                    _key = "bet"
                }
               
            }
            if(_randType == "max"){
                let _config = this.getConfigByAction(_key,blackboard)
                if(_config && _config.maxToForcePercent){
                    _rand = _config.maxToForcePercent;
                }
                if(_key == "allin"){
                    let opppentCls = blackboard.getRuntime("oppenteActionCls")
                    if(opppentCls.getForceAllIn()){
                        return b3.Status.SUCCESS;
                    }
                }
            }
            
            if(_key == "allin"){
                _rand = Math.pow(_rand,2)/100
            }
            let _randConfig = _.random(0,100);
            tick.tree.B3Log("B3RandomSuccess",_key," _rand = ",_rand," _randConfig = ",_randConfig," key = ",_key)
            if(_randConfig<_rand){
                
                return b3.Status.SUCCESS;
            }
        }

        return b3.Status.FAILURE;
    }
    
    public close(tick: b3.Tick): void {
        
    }
    public exit(tick: b3.Tick): void {
        
    }


    getIsBet(blackboard:b3.Blackboard<TexasTreeExtraDefine>){
        let _phaseChairs = blackboard.get("phaseChairNos")
        let _isBet = false
        if(_phaseChairs && _phaseChairs.length == 0){
            _isBet = true;
        }
        return _isBet;
    }

    getConfigByAction(aciton:string,blackboard:b3.Blackboard<TexasTreeExtraDefine>){
        let strategy = blackboard.get("strategy")
        if(!strategy||!strategy.personality){
            return null
        }
        if(aciton == "bet"){
            if(!strategy.personality.bet){
                return null;
            }
            return  strategy.personality.bet
            
        } else if(aciton == "call"){
            if(!strategy.personality.call){
                return null;
            }
            return  strategy.personality.call
            
        } else if(aciton == "check"){
            return {
                percent:strategy.personality.checkPercent || 100,//100%
            }
           
        } else if(aciton == "allin"){
            if(!strategy.personality.allin){
                return null;
            }
            return  strategy.personality.allin
           
        } else if(aciton == "raise"){
            if(!strategy.personality.raise){
                return null;
            }
            return  strategy.personality.raise
        }
        return null;
    }
    
}