import { GSUserMsg } from "../../../../pp-base-define/GSUserMsg"
import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
export class B3ReadyExit extends b3.Action {

    public tick(tick: b3.Tick): b3.Status  {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _readyExitWaitTime = tick.blackborad.get("readyExitWaitTime",tick.tree.id)
        if(_readyExitWaitTime<new Date().getTime()){
            tick.blackborad.set("readyExit",false,tick.tree.id)
            let worker = blackboard.getRuntime("worker")
            let _selfUserID = blackboard.get("selfUserID")
            if(worker){
                worker.sendToGS(_selfUserID,GSUserMsg.UserExit, {})
            }
        }
        return b3.Status.SUCCESS;
    }
}