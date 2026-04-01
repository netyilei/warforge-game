import Decimal from "decimal.js";
import * as b3 from "../../tree/b3"
import { TexasTickRealtimeData, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
import { TexasGamePhase, TexasRule } from "../../../../pp-game-texas/TexasDefine";
export class B3CheckEV extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {
        let blackboard = tick.blackborad as b3.Blackboard<TexasTreeExtraDefine>
        let _selfUser = blackboard.get("selfUser")
        let _runtimeData:TexasTickRealtimeData = tick.target
        let _betTurn = _runtimeData.betTurn
        if(!_betTurn){
            return b3.Status.FAILURE;
        }
        let _prop = this.properties || {};
        let _key = _prop["action"]
        if(!_key){
            return b3.Status.FAILURE;
        }
        let callValue = Decimal.sub(_betTurn.maxValue,_betTurn.prevValue)

        let winRate_ = blackboard.get("simulateWinRate")
        let selfRate_ = winRate_.find(v=>v.chairNo == _selfUser.chairNo)
        if(!selfRate_){
            return b3.Status.FAILURE;
        }
        let userBetScore_ = blackboard.get("userBetScore")
        let selfScore_ = userBetScore_[_selfUser.userID] || new Decimal("0")
        let totalScore_ = "0"
        for (const key in userBetScore_) {
            const score = userBetScore_[key];
            totalScore_ = Decimal.add(totalScore_,score).toString()
        }
        let phase = blackboard.get("phase")
        let gameSet = blackboard.getRuntime("gameSet")
        let score = 0
        if(gameSet){
            score = gameSet.iSets[TexasRule.Group6_SBlind] || 0
        }
        //let allinEv = this.calcActionRate(selfRate_.winRate,totalScore_,selfScore_,_selfUser.score)
        //let foldEv = Decimal.sub(0,selfScore_);
        //
        let opppentCls = blackboard.getRuntime("oppenteActionCls")
        let actionRate = opppentCls.checkAllRate(true)
        tick.tree.B3Log("oppenteActionCls = ",actionRate)

        if(_key == "allin"){
            //allin 没有期望 只有诈唬
            // if(allinEv.greaterThanOrEqualTo(selfScore_)){
            //     return b3.Status.SUCCESS;
            // }
            
            return b3.Status.FAILURE;
        }
        if(_key == "raise"){
            
            //let raiseEv = this.calcActionRate(selfRate_.winRate,totalScore_,selfScore_,Decimal.add(callValue,Decimal.mul(totalScore_,0.1)))
            let raiseEv = this.calculateCallEV(selfRate_.winRate,totalScore_,Decimal.add(callValue,Decimal.mul(totalScore_,0.1)))
            tick.tree.B3Log("RAISE EV = ",raiseEv.toString(),"totalScore_ = ",totalScore_," callValue = ",callValue.toString()," selfScore_ = ",selfScore_.toString()," 0.1 = ",Decimal.mul(totalScore_,0.1).toString())
            if(raiseEv.lessThanOrEqualTo(0)){
                return b3.Status.FAILURE;
            }
        }
        else if(_key == "call"){
            //let callEv = this.calcActionRate(selfRate_.winRate,totalScore_,selfScore_,callValue)
            let callEv = this.calculateCallEV(selfRate_.winRate,totalScore_,callValue)
            tick.tree.B3Log("CALL EV = ",callEv.toString())

            //TODO 要不要强制跟call 翻前底池分数不足 ev低 第一次就不会跟了
            if(phase < TexasGamePhase.Flop){
                //翻前给一个大盲的 预支ev
                if(callEv.greaterThanOrEqualTo(-score*2)){
                    return b3.Status.SUCCESS;
                }
            }
            
            if(callEv.lessThanOrEqualTo(0)){
                
                return b3.Status.FAILURE;
            }
        }
        else if(_key == "check"){
            //let checkEv = this.calcActionRate(selfRate_.winRate,totalScore_,selfScore_,"0")
            let checkEv = this.calculateCallEV(selfRate_.winRate,totalScore_,"0")
            tick.tree.B3Log("CHECK EV = ",checkEv.toString())
            if(phase < TexasGamePhase.Flop){
                //强制翻前跟一手？
                if(checkEv.greaterThanOrEqualTo(-score*2)){
                    return b3.Status.SUCCESS;
                }
            }
            if(checkEv.lessThanOrEqualTo(0)){
                return b3.Status.FAILURE;
            }
        }
        // let EV = Decimal.sub(Decimal.mul(selfRate_.winRate,Decimal.add(Decimal.sub(totalScore_,selfScore_),callValue)),Decimal.mul(1 - selfRate_.winRate,Decimal.add(selfScore_,callValue)))
        // // 检测期望值
       
        // if(EV.lessThanOrEqualTo(0)){
        //     return b3.Status.FAILURE;
        // }
        return b3.Status.SUCCESS;
    }

 
    private calcActionRate(selfWinRate,diScore:string,selfDiScore:string,callValue:string|Decimal){
        let EV = Decimal.sub(Decimal.mul(selfWinRate,Decimal.sub(diScore,selfDiScore)),Decimal.mul(1 - selfWinRate,Decimal.add(selfDiScore,callValue)))
        return EV;
    }
    /**
     * 赔率
     * @param callScore 
     * @param potTotal 
     * @returns 
     */
    private calculatePotOdds(callScore:string,potTotal:string) {
        let odds = new Decimal(callScore).div(Decimal.add(callScore,potTotal))
        return odds;
    }
    /**
     * 计算call 的期望
     * @param winRate 胜率
     * @param potTotal 总池
     * @param callScore 分数
     * @returns 期望
     */
    private calculateCallEV(winRate,potTotal,callScore){
        let winScore = Decimal.add(potTotal,callScore)
        let loseScore = Decimal.sub(0,callScore)
        let ev = Decimal.add(Decimal.mul(winRate,winScore),Decimal.mul(1 - winRate,loseScore))
        return ev;
    }
    // /**
    //  * 计算allin and raise 的期望
    //  * @param winRate 胜率
    //  * @param potTotal 总池
    //  * @param allScore 所有分数
    //  * @param opponentRate 对手胜率
    //  */
    // private calculateRaiseEv(winRate,potTotal,allScore,opponentRate){
    //     let winScore = Decimal.add(potTotal,allScore)
    //     let loseScore = Decimal.sub(0,allScore)
    //     let allInWinRate = Decimal.mul(winRate,opponentRate)
    //     let allInLoseRate = Decimal.mul(1 - winRate,opponentRate)
    //     let ev = Decimal.add(Decimal.mul(allInWinRate,winScore),Decimal.mul(allInLoseRate,loseScore))
    //     return ev;
    // }
}