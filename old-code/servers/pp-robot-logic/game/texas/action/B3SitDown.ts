import _ from "underscore"
import * as b3 from "../../tree/b3"
import { TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg"
import { TexasRule } from "../../../../pp-game-texas/TexasDefine"
export class B3SitDown extends b3.Action {

    public tick(tick: b3.Tick): b3.Status {
        tick.blackborad.set("standup",false,tick.tree.id)
        // let _isSitdown = tick.blackborad.get("sitdown",tick.tree.id)
        // if(_isSitdown){
        //     return b3.Status.FAILURE;
        // }
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUserID = blackboard.get("selfUserID")
        let users = blackboard.get("users")
        let _sitUserChairs = users.filter(v=>v.chairNo < 100000 ).map(v=>v.chairNo)
        let _seat = Array(8).fill(0).map((v, i) => i)
        _seat = _.difference(_seat, _sitUserChairs)
        let _rand = _.sample(_seat)
        let _gameSet = blackboard.getRuntime("gameSet")
        if(!_gameSet){
            return b3.Status.FAILURE;
        }
       
        let minBuyin =  _gameSet.iSets[TexasRule.Group7_MinBuyin]
        let req: GSCommonMsg.tBuyinReq = {
			score: minBuyin+"",
			toChairNo: _rand,
		}
        if(worker){
            worker.sendToGS(_selfUserID,GSCommonMsg.Buyin,req)	
        }
        tick.blackborad.set("sitdown",true,tick.tree.id)
        return b3.Status.SUCCESS;
    }
}