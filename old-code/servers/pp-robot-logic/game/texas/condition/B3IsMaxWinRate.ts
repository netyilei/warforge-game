import Decimal from "decimal.js";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3IsMaxWinRate extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _selfUser = blackboard.get("selfUser")
 
        let winRate_ = blackboard.get("simulateWinRate")
        let selfRate_ = winRate_.find(v=>v.chairNo == _selfUser.chairNo)
        if(!selfRate_){
            return b3.Status.FAILURE;
        }
        let maxRate_ = Math.max(...winRate_.map(v=>v.winRate))
        if(selfRate_.winRate == maxRate_){
            return b3.Status.SUCCESS;
        }

        return b3.Status.FAILURE;
    }
}