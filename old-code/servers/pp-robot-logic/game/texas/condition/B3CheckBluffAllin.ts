import _ from "underscore";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3CheckBluffAllin extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _betTurn = _runtimeData.betTurn
        if(!_betTurn){
            return b3.Status.FAILURE;
        }
        if(this.getConfigByAction(blackboard)){
            return b3.Status.SUCCESS;
        }
        return b3.Status.FAILURE;
    }

    getConfigByAction(blackboard:b3.Blackboard<TexasTreeExtraDefine>){
        let _phaseChairs = blackboard.get("phaseChairNos")
        let _isBet = false
        if(_phaseChairs && _phaseChairs.length == 0){
            _isBet = true;
        }
        let strategy = blackboard.get("strategy")
        if(!strategy || !strategy.personality){
            return false;
        }
        // 判断用户行为
        let opppentCls = blackboard.getRuntime("oppenteActionCls")
        let actionRate = opppentCls.checkAllRate(true)
        if(actionRate.foldToAllinRate == 0){
            if(_.random(50)<50){
                return false;
            }
        }
        else if(actionRate.foldToAllinRate < 0.3){
            return false;
        }
        let personality = strategy.personality;
        if(!personality.bluff){
            return false;
        }
        let _allinPer = personality.bluff.allinPercent
        if(_.random(100)<_allinPer){
            return true;
        }

        return false;
    }
}