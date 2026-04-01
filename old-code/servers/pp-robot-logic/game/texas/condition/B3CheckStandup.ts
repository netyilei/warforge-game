import _ from "underscore";
import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3CheckStandup extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _selfUser = blackboard.get("selfUser")
		if(_selfUser.chairNo < 100000) {
			return b3.Status.FAILURE;
		}
        let _users = blackboard.get("users")
		let _sitCount = _users.filter(v=>v.chairNo < 100000 ).length;
		if(_sitCount>=8){
            let _target = tick.blackborad.get("standupPercent",tick.tree.id,this.id);
            if(!_target){
                _target = 10;
            }
            let _rand = _.random(100);
            if(_rand<_target){
                return b3.Status.SUCCESS;
            }
			tick.blackborad.set("standupPercent",(_target+_.random(20)),tick.tree.id,this.id);
		}
        return b3.Status.FAILURE;
    }
}