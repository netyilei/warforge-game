import { GSUserMsg } from "../../../../pp-base-define/GSUserMsg";
import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3ReadyStandup extends b3.Action {

    public tick(tick: b3.Tick): b3.Status  {
        let _isStandup = tick.blackborad.get("standup",tick.tree.id)
        if(_isStandup){
            return b3.Status.FAILURE;
        }
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUserID = blackboard.get("selfUserID")
        if(worker){
            worker.sendToGS(_selfUserID,GSUserMsg.UserStandUp, {})
        }
        tick.blackborad.set("standup",true,tick.tree.id)
        tick.blackborad.set("readyExit",true,tick.tree.id)
        let time = new Date().getTime()
        tick.blackborad.set("readyExitWaitTime",Math.floor(Math.random()*30+10)*1000+time,tick.tree.id)
        return b3.Status.SUCCESS;
    }
}