import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg";
import { TexasDefine } from "../../../../pp-game-texas/TexasDefine";
import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3Check extends b3.Action {

    public tick(tick: b3.Tick): b3.Status  {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUserID = blackboard.get("selfUserID")
        if(worker){
            worker.sendToGS(_selfUserID,GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
                value:"0",
                type:TexasDefine.BetType.Check,
            })	
        }
        return b3.Status.SUCCESS;
    }
}