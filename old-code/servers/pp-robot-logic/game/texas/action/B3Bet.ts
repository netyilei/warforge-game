import Decimal from "decimal.js"
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg"
import { TexasDefine } from "../../../../pp-game-texas/TexasDefine"
import _ from "underscore"
export class B3Bet extends b3.Action {

    public tick(tick: b3.Tick): b3.Status  {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUserID = blackboard.get("selfUserID")
        let _selfUser = blackboard.get("selfUser")
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _betTurn = _runtimeData.betTurn
        if(!_betTurn){
            return b3.Status.FAILURE;
        }


        let callValue = Decimal.sub(_betTurn.maxValue,_betTurn.prevValue)
        if(callValue.lessThanOrEqualTo(0)){
            worker.sendToGS(_selfUserID,GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
                value:"0",
                type:TexasDefine.BetType.Check,
            })	
        }else{
            worker.sendToGS(_selfUserID,GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
                value:callValue.toString(),
                type:TexasDefine.BetType.Call,
            })	
        }
        
        return b3.Status.SUCCESS;
    }
}