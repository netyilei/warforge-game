import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3IsOutInterval extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad 
        let blackboard2 = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _prop = this.properties || {};
        let _users = blackboard2.get("users")
        if(!_users && _users.length == 0){
            return b3.Status.FAILURE;
        }
        //TODO 先不限制 试试
        return b3.Status.SUCCESS;
        let _delay = _prop["delay"]
        if(!_delay){
            return b3.Status.SUCCESS;
        }
        let _nowTime = Date.now()
        let _lastTime = blackboard.get("lastRunTime")
        if(!_lastTime){
            blackboard.set("lastRunTime",_nowTime,tick.tree.id,this.id)
            return b3.Status.FAILURE;
        }
        if(_nowTime<_lastTime+_delay){
            return b3.Status.FAILURE;
        }
        blackboard.set("lastRunTime",_nowTime,tick.tree.id,this.id)
        return b3.Status.SUCCESS;
    }
}