import _ from "underscore";
import * as b3 from "../../tree/b3"
import { GSUserMsg } from "../../../../pp-base-define/GSUserMsg";
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
import Decimal from "decimal.js";
export class B3SendRandChat extends b3.Action {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUserID = blackboard.get("selfUserID")
        let _users = blackboard.get("users")
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _rand =  _.random(0,100)
        let _randIndex =  _.random(1,20)
        if(_rand<30){
            worker.sendToGS(_selfUserID,GSUserMsg.Chat, <GSUserMsg.tChatReq>{
                type: GSUserMsg.ChatType.Emoji,
                // text:def.text,
                index: _rand,
            })
        }else if(_rand<60){
            let _index =  _.random(0,4)
            worker.sendToGS(_selfUserID,GSUserMsg.Chat, <GSUserMsg.tChatReq>{
                type: GSUserMsg.ChatType.Fast,
                // text:def.text,
                index: _index,
            })
        }else{
            let _inDeskUsers = _.filter(_users,(user)=>{return user.chairNo<100000 && user.userID != _selfUserID})
            let _targetChairNos = []
            // 优化发送的表情只对当前回合玩家 和分数最多的和分数最低的
            if(_runtimeData.betTurn){
                _targetChairNos.push(_runtimeData.betTurn.chairNo)
            }
            _inDeskUsers = _inDeskUsers.sort((a,b)=>{return Decimal.sub(a.score,b.score).toNumber()})
            if(_inDeskUsers.length > 0){
                _targetChairNos.push(_inDeskUsers[0].chairNo)
            }
            if(_inDeskUsers.length > 1){
                _targetChairNos.push(_inDeskUsers[_inDeskUsers.length-1].chairNo)
            }
            // 没有找到合适的玩家 则随机全部
            if(_targetChairNos.length == 0){
                _targetChairNos = _.map(_inDeskUsers,(user)=>{return user.chairNo})
            }
            let chairNo = _.sample(_targetChairNos)
            worker.sendToGS(_selfUserID,GSUserMsg.Chat,<GSUserMsg.tChatReq>{
                type:GSUserMsg.ChatType.ToEmoji,
                // text:def.text,
                toChairNo:chairNo,
                index:_randIndex,
            })
        }
        return b3.Status.SUCCESS;
    }
}