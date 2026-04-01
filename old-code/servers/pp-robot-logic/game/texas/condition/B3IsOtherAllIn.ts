import Decimal from "decimal.js"
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
import _ from "underscore";
export class B3IsOtherAllIn extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _opponentCls = blackboard.getRuntime("oppenteActionCls")
        if( _opponentCls.getBeforeHadAllIn()){

            return b3.Status.SUCCESS ;
        }
        return b3.Status.FAILURE;
    }
}