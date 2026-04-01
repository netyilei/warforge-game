import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3IsFinishJuCount extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _runtimeData:TexasTickRealtimeData = tick.target
        if(_runtimeData.taskFinsh){
            return b3.Status.SUCCESS;
        }
        // let _strategy = blackboard.get("strategy")
        // if(_strategy.strategyData.juLimitCount < _strategy.strategyData.curJuCount){
        //     return b3.Status.SUCCESS;
        // }
        return b3.Status.FAILURE;
    }
}