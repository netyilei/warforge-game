import _ from "underscore"
import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg"
import { TexasRule } from "../../../../pp-game-texas/TexasDefine"
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
export class B3Buyin extends b3.Action {

    public tick(tick: b3.Tick): b3.Status {
        // let _isSitdown = tick.blackborad.get("sitdown",tick.tree.id)
        // if(_isSitdown){
        //     return b3.Status.FAILURE;
        // }

        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let isBuyIn = blackboard.get("readyBuyIn")
        if(!isBuyIn){
            return b3.Status.FAILURE;
        }
     
        blackboard.set("readyBuyIn",false)
        let worker = blackboard.getRuntime("worker")
        let _selfUser = blackboard.get("selfUser")
        if(worker){
            worker.sendToGS(_selfUser.userID,GSCommonMsg.BuyinCancel,{})	
        }
        let time = new Date().getTime()
        tick.blackborad.set("readyExit",true,tick.tree.id)
        tick.blackborad.set("readyExitWaitTime",Math.floor(Math.random()*30+10)*1000+time,tick.tree.id)
        return b3.Status.SUCCESS;

        let _gameSet = blackboard.getRuntime("gameSet")
        if(!_gameSet){
            return b3.Status.FAILURE;
        }
       
        let minBuyin =  _gameSet.iSets[TexasRule.Group7_MinBuyin]
        let req: GSCommonMsg.tBuyinReq = {
			score: minBuyin+"",
			toChairNo: _selfUser.chairNo,
		}
        if(worker){
            worker.sendToGS(_selfUser.userID,GSCommonMsg.Buyin,req)	
        }
        tick.blackborad.set("sitdown",true,tick.tree.id)
        return b3.Status.SUCCESS;
    }
}