import _ from "underscore";
import * as b3 from "../../tree/b3"
export class B3IsSendChat extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let now = new Date().getTime();
        let _last = tick.blackborad.get("sendChatTime",tick.tree.id,this.id)
        if(_last && _last+30000>now){
            return b3.Status.FAILURE;
        }
        tick.blackborad.set("sendChatTime",now,tick.tree.id,this.id)
        if(_.random(0,100) < 10){
            return b3.Status.SUCCESS;
        }
        return b3.Status.FAILURE;
    }
}