import Decimal from "decimal.js";
import { Poker } from "../../../../pp-base-define/PokerDefine";
import { Log } from "../../../log";
import * as b3 from "../../tree/b3"
import { TexasRobotRateCalc } from "../calc/TexasRobotRateCalc";
import { opponentActionRate, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";

/*
    计算分数
*/
export class B3CaleScore extends b3.Decorator {
   
    public enter(tick: b3.Tick): void {
        
    }
    public open(tick: b3.Tick): void {
        
    }
    public tick(tick: b3.Tick): b3.Status {
        if(!this.child){
            return b3.Status.ERROR;
        }
        //检测是否是可见牌
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _handCards = blackboard.get("handCards")
        let _desktopCards = blackboard.get("desktopCards")
        let _allDiCards = blackboard.get("allDiCards")
        
        let _isOtherCards = false
        let _userRates = [];
        for (const user of _handCards) {
            let _isEmpty = user.cards.every(v=>v.suit != Poker.Suit.None)
            if(_isEmpty){
                _isOtherCards = true;
                break;
            }
        }
        if(_isOtherCards){
            // todo 有别人牌 是看策略 看牌打 还是不看牌
            _userRates = TexasRobotRateCalc.afterFlopCalc(tick.blackborad)
        }
        if(_userRates.length == 0){
            _userRates = TexasRobotRateCalc.fuzzyCalc(tick.blackborad)
        }
        
        tick.tree.B3Log("handCards = ",JSON.stringify(_handCards))
        tick.tree.B3Log("desktopCards = ",JSON.stringify(_desktopCards))
        tick.tree.B3Log("allDiCards = ",JSON.stringify(_allDiCards))

        tick.tree.B3Log("B3CaleScore = ",JSON.stringify(_userRates))

        blackboard.set("simulateWinRate",_userRates)
        blackboard.dumpLog();
        let status = this.child._execute(tick);

        return status;
    }
    
    public close(tick: b3.Tick): void {
        
    }
    public exit(tick: b3.Tick): void {
        
    }
    
}