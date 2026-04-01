import Decimal from "decimal.js"
import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg"
import { TexasDefine } from "../../../../pp-game-texas/TexasDefine"
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
import _ from "underscore"

export class B3Raise extends b3.Action {

    public tick(tick: b3.Tick): b3.Status  {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let worker = blackboard.getRuntime("worker")
        let _selfUserID = blackboard.get("selfUserID")
        let _selfUser = blackboard.get("selfUser")
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _betTurn = _runtimeData.betTurn
        if(!_betTurn){
            return b3.Status.FAILURE;
        }
        let callValue = Decimal.sub(_betTurn.maxValue,_betTurn.prevValue)

        let allScore = blackboard.get("userBetScore")
        let diScore = new Decimal(0);
        for (const key in allScore) {
            diScore = diScore.add(allScore[key])
        }
        let minScale = 0.1;
        let maxScale = 2;

        let _prop = this.properties || {};
        let _key = _prop["isBluff"]
        let _scales = []
        if(_key){
            _scales = this.getBluffConfig(blackboard);
        }
        _scales = this.getConfigByAction(blackboard)
        if(_scales && _scales.length > 0){
            minScale = _scales[0] || 0.1;
            maxScale = _scales[1] || 2;
        }
        
        let _minScore = Decimal.mul(diScore,minScale);
        _minScore = Decimal.add(_minScore,callValue)
        if(_minScore.greaterThan(_selfUser.score)){
            return b3.Status.FAILURE;
        }
        let _maxScore = Decimal.mul(diScore,maxScale);
        _maxScore = Decimal.add(_maxScore,callValue)
        if(_maxScore.greaterThan(_selfUser.score)){
            _maxScore = new Decimal(_selfUser.score)
        }
       
        let result = this.randomDecimal(_minScore,_maxScore)
        tick.tree.B3Log("raise result diScore = ", diScore.toString()," _minScore = ",_minScore.toString()," _maxScore = ",_maxScore.toString()," result = ",result.toString())
        if(!result){
            return b3.Status.FAILURE;
        }
        if(worker){
            worker.sendToGS(_selfUserID,GSCommonMsg.Bet,<GSCommonMsg.tBetReq>{
                value:result.toString(),
                type:TexasDefine.BetType.Raise,
            })	
        }
        return b3.Status.SUCCESS;
      
    }
    getBluffConfig(blackboard:b3.Blackboard<TexasTreeExtraDefine>){
        let _phaseChairs = blackboard.get("phaseChairNos")
        let _isBet = false
        if(_phaseChairs && _phaseChairs.length == 0){
            _isBet = true;
        }
        let strategy = blackboard.get("strategy")
        if(strategy&&strategy.personality){
            let _bluff = strategy.personality.bluff;
            if(!_bluff){
                return [];
            }
            if(_isBet){
                return _bluff.betScales || [];
            }
            return _bluff.raiseScales || [];
        }
        return []
    }
    getConfigByAction(blackboard:b3.Blackboard<TexasTreeExtraDefine>){
        let _phaseChairs = blackboard.get("phaseChairNos")
        let _isBet = false
        if(_phaseChairs && _phaseChairs.length == 0){
            _isBet = true;
        }
        let strategy = blackboard.get("strategy")
        if(strategy&&strategy.personality){
            if(_isBet){
                if(!strategy.personality.bet){
                    return []
                }
                return strategy.personality.bet.scales || [];
            }
            if(!strategy.personality.raise){
                return []
            }
            return strategy.personality.raise.scales || [];
        }
        return [];
    }
    randomDecimal(min, max) {
        // 确保输入是 Decimal 类型
        const minDec = new Decimal(min);
        const maxDec = new Decimal(max);
    
        // 生成一个介于 0 和 1 之间的随机数
        const random = Math.random();
    
        // 将随机数映射到 [min, max) 范围内
        return minDec.plus(new Decimal(random).times(maxDec.minus(minDec)));
    }
}