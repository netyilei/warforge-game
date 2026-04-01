import _ from "underscore";
import { RobotDefine } from "../../../../pp-base-define/RobotDefine";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3CheckPersonality extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _runtimeData:TexasTickRealtimeData = tick.target

        let _prop = this.properties || {};
        let _action= _prop["action"]
        let _phaseChairs = blackboard.get("phaseChairNos")
        if(!_phaseChairs || _phaseChairs.length <= 0){
            if(_action == "allin"){
                return b3.Status.FAILURE;
            }
            _action = "bet"
        }
        let _opponentCls = blackboard.getRuntime("oppenteActionCls")
        if( _opponentCls.getBeforeHadAllIn()){
            return b3.Status.FAILURE;
        }
        let _config = this.getConfigByAction(_action,blackboard)
        if(!_config ){
            if(_action== "check"){
                return b3.Status.SUCCESS;
            }

            return b3.Status.FAILURE;
        }
        
        let _rand = _.random(0,100);
        tick.tree.B3Log("B3CheckPersonality" ,_action, "config = ",_config.percent , " _rand = ",_rand)
        if(_rand <= _config.percent){
            return b3.Status.SUCCESS;
        }
        
        return b3.Status.FAILURE;
    }
    getConfigByAction(aciton:string,blackboard:b3.Blackboard<TexasTreeExtraDefine>){
        let strategy = blackboard.get("strategy")
        if(!strategy || !strategy.personality){
            return null;
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