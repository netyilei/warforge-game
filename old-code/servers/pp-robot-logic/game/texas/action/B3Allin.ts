import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg";
import { TexasDefine } from "../../../../pp-game-texas/TexasDefine";
import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3Allin extends b3.Action {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUser = blackboard.get("selfUser")
        worker.sendToGS(_selfUser.userID,GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
            value:_selfUser.score,
            type:TexasDefine.BetType.Allin,
        })	
        return b3.Status.SUCCESS;
    }
}