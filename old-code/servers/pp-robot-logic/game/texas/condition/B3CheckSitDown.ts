import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3CheckSitDown extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {

        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _selfUser = blackboard.get("selfUser")
		if(!_selfUser || _selfUser.chairNo < 100000) {
			return b3.Status.FAILURE;
		}
        let _users = blackboard.get("users")
		let _sitCount = _users.filter(v=>v.chairNo < 100000 ).length;
		if(_sitCount>4){
			return b3.Status.FAILURE;
		}
        //TODO 时间差 概率差 错时坐下

        return b3.Status.SUCCESS;
    }
}