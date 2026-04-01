import _ from "underscore";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3IsNoPlayer extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
       
        let _runtimeData:TexasTickRealtimeData = tick.target
        if(_runtimeData.isMatch){
            let _robotUserID = blackboard.get("robotUserIDs")
            let _players = blackboard.get("users")
            let _list = _.difference(_players.map(v=>v.userID),_robotUserID)
            if(_list.length == 0){
                return b3.Status.SUCCESS;
            }
        }
        return b3.Status.FAILURE;
    }
}