import Decimal from "decimal.js";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
import _ from "underscore";
export class B3IsAllin extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _selfUser = blackboard.get("selfUser")
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _betTurn = _runtimeData.betTurn
        if(!_betTurn){
            return b3.Status.FAILURE;
        }
        let userBetScore_ = blackboard.get("userBetScore")
        let selfScore_ = userBetScore_[_selfUser.userID]
        let totalScore_ = "0"
        for (const key in userBetScore_) {
            const score = userBetScore_[key];
            totalScore_ = Decimal.add(totalScore_,score).toString()
        }
        let callValue = Decimal.sub(_betTurn.maxValue,_betTurn.prevValue)
        // let _userScores = blackboard.get("userBetScore")
        // let _score  = _userScores[_selfUser.userID]|| "0";
        // let off = Decimal.div(_score,callValue)
        
      
        if(callValue.greaterThan(_selfUser.score)){
            //我已经下的注 如果下的少 可以不all in
            let _off = Decimal.div(selfScore_,_selfUser.score).toNumber()
            _off = Math.pow(_off,2) * 100;

            tick.tree.B3Log("B3IsAllin _off = ",_off," selfScore_ = ",selfScore_," _selfUser.score = ",_selfUser.score)
            if(_.random(0,100) < _off){
                //10%概率
                return  b3.Status.SUCCESS
            }
            //return b3.Status.SUCCESS;
        }

        return b3.Status.FAILURE;
    }
}