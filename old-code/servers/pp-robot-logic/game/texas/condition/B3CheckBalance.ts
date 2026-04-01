import Decimal from "decimal.js";
import { RoomDefine } from "../../../../pp-base-define/RoomDefine";
import { TexasRule } from "../../../../pp-game-texas/TexasDefine";
import { Log } from "../../../log";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
export class B3CheckBalance extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _gameSet = blackboard.getRuntime("gameSet")

        if(!_gameSet){
            Log.oth.error("[B3CheckBalance]","_gameSet is null",_gameSet)
            return b3.Status.FAILURE;
        }
       
        let minBuyin =  _gameSet.iSets[TexasRule.Group7_MinBuyin]
		let maxBuyin =  _gameSet.iSets[TexasRule.Group8_MaxBuyin]
        if(!minBuyin){
            // Log.oth.error("[B3CheckBalance]","minBuyin is null",minBuyin)
            return b3.Status.FAILURE;
        }
        let target:TexasTickRealtimeData = tick.target;
        if(!target || !target.userBag){
            Log.oth.error("[B3CheckBalance]","target or userBag is null",target)
            return b3.Status.FAILURE;
        }
        let payType = RoomDefine.getPayType(_gameSet.getPayType())
		let payIndex = RoomDefine.getPayIndex(_gameSet.getPayType())
        if(payType == RoomDefine.PayType.Item){
        	let _item = target.userBag.items.find(v=>v.id == String(payIndex))
            if(!_item){
                Log.oth.info("[B3CheckBalance]","bag not item","userID:",target.userBag.userID,"payIndex:",payIndex)
                return b3.Status.FAILURE;
            }
            if(new Decimal(_item.count).lessThan(minBuyin)){
                Log.oth.info("[B3CheckBalance]","bag item count less than minBuyin","userID:",target.userBag.userID,"payIndex:",payIndex,"minBuyin:",minBuyin)
                return b3.Status.FAILURE;
            }
            return b3.Status.SUCCESS;

        }else{
            Log.oth.error("[B3CheckBalance]","payType is not Item")
        }
        // 实现检查余额逻辑
        return b3.Status.FAILURE;
    }
}