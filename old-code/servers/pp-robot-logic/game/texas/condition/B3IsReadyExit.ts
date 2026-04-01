import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";

export class B3IsReadyExit extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _isReadyExit = tick.blackborad.get("readyExit",tick.tree.id)
        let _selfUser = blackboard.get("selfUser")
        if(!_selfUser){
            return b3.Status.FAILURE;
        }
        if(_isReadyExit && _selfUser.chairNo >= 100000){
            return b3.Status.SUCCESS;
        }
        return b3.Status.FAILURE;
    }
}