import Decimal from "decimal.js";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3IsEnoughScore extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _selfUser = blackboard.get("selfUser")
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _betTurn = _runtimeData.betTurn
        if(!_betTurn){
            return b3.Status.FAILURE;
        }
        let callValue = Decimal.sub(_betTurn.maxValue,_betTurn.prevValue)

        if(callValue.greaterThan(_selfUser.score)){
            return b3.Status.FAILURE;
        }
        return b3.Status.SUCCESS;
    }
}