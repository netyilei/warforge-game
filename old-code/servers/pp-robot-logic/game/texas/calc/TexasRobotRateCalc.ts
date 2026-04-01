
import _ from "underscore";
import * as b3 from "../../tree/b3"
import { IRobotHandCard, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine";
import { CardArray, tCard } from "../../../../pp-base-define/CardDefine";
import { kdutils } from "kdweb-core/lib/utils";
import { TexasPower } from "../../../../pp-game-texas/TexasPower";
import { TexasRobotCalcUtil } from "./TexasRobotCalcUtil";
/**
 * 机器人计算胜率
 */
export namespace TexasRobotRateCalc {
    /**
     * 模糊计算胜率
     * @param blackboard 
     * @param count 次数
     * @returns 
     */
    export function fuzzyCalc(blackboard:b3.Blackboard<TexasTreeExtraDefine>,count?:number) {
        if(!blackboard) {
            return [];
        }
        let _allCards = blackboard.get("allCards").slice()
        let _cardsPower = blackboard.getRuntime("cardsPower")
        let _handCards = blackboard.get("handCards")
        let _desktopCards = blackboard.get("desktopCards")
        let _allDiCards = blackboard.get("allDiCards")
        let _isForceUserALlDi = blackboard.get("forceUseAllDiCards")
        let _users = blackboard.get("users")
        let _destCards = null;
        if(_isForceUserALlDi && _allDiCards && _allDiCards.cards.length!=0){
            _destCards = _allDiCards
        }else{
            _destCards = _desktopCards;
        }
        // 非强制的 10% 给真实胜率
        if(!_isForceUserALlDi){
            _isForceUserALlDi = Math.random()*100<10
        }
        let _userHandCards = _handCards.filter(v=>v.chairNo != -1 && v.cards.length>0) || []
        let winRecords:{chairNo:number,count:number}[] = []

        if(_destCards){
            _allCards.removeArray(_destCards.cards)
        }
        
        for (const item of _userHandCards) {
            _allCards.removeArray(item.cards)
            winRecords.push({chairNo:item.chairNo,count:0})
        }
        let playerCount = _userHandCards.length
    
        let possibilities = count?count:1000

        let publicCards = _destCards?_destCards.cards.slice():[]
        let sevenCombs = TexasRobotCalcUtil.combination(Array(7).fill(0).map((v, i) => i), 5)
        for (let i = 0; i < possibilities; i++) {
            let shuffleCards = _.shuffle(_allCards.refCards)
            //随机发牌

            let _copyHandCards = kdutils.clone(_userHandCards)
            for (let j = 0; j < _copyHandCards.length; j++) {
                let _copyUser = _copyHandCards[j]
                if(!_copyUser.cards || _copyUser.cards.length == 0){
                    let _dealCards = shuffleCards.splice(0, 2)
                    _copyUser.cards = _dealCards
                }else{
                    let _isNoCard = _copyUser.cards.every(v=>v.suit == 0)
                    if(_isNoCard){
                        let _dealCards = shuffleCards.splice(0, 2)
                        _copyUser.cards = _dealCards
                    }
                }
            }
            let tempPublicCards = publicCards.slice()
            if(tempPublicCards.length < 5){
                tempPublicCards.push(...shuffleCards.splice(0, 5-publicCards.length))
            }

            let result:{chairNo:number,type:number}[] = checkWin(tempPublicCards,_copyHandCards,_cardsPower,sevenCombs)
            result.forEach(v => {
                let _item = winRecords.find(w=>w.chairNo == v.chairNo)
                if(_item){
                    _item.count++ 
                }else{
                    winRecords.push({chairNo:v.chairNo,count:1})
                }
            })
    
        }
        let winRates = winRecords.map(v => {
            return {
                chairNo: v.chairNo,
                winRate: v.count / possibilities
            }
        })
        return winRates;
    }
    /**
     * 翻后精准计算胜率
     * @param blackboard 
     */
    export function afterFlopCalc(blackboard:b3.Blackboard<TexasTreeExtraDefine>) {
        if(!blackboard) {
            return [];
        }
        let _allCards = blackboard.get("allCards").slice()
        let _cardsPower = blackboard.getRuntime("cardsPower")
        let _handCards = blackboard.get("handCards")
        let _desktopCards = blackboard.get("desktopCards")
        let _allDiCards = blackboard.get("allDiCards")
        let _isForceUserALlDi = blackboard.get("forceUseAllDiCards")
        let _destCards = null;
        if(!_isForceUserALlDi){
            _isForceUserALlDi = Math.random()*100<10
        }
        if(_isForceUserALlDi && _allDiCards && _allDiCards.cards.length!=0){
            _destCards = _allDiCards
        }else{
            _destCards = _desktopCards;
        }
        let _userHandCards = _handCards.filter(v=>v.chairNo != -1 && v.cards.length>0) || []
        if(!_destCards || _destCards.cards.length == 0){
            //没有发底牌
            return [];
        }
        // 删除公共牌
        _allCards.removeArray(_destCards.cards)
        let winRecords:{chairNo:number,count:number}[] = []
        // 删除手牌
        for (const item of _userHandCards) {
            _allCards.removeArray(item.cards)
            winRecords.push({chairNo:item.chairNo,count:0})
        }
        let playerCount = _userHandCards.length
        let short = 5 - _destCards.cards.length
        let possibilities = TexasRobotCalcUtil.combNumbers(_allCards.length, short)
        let indexes = Array(_allCards.length).fill(0).map((v, i) => i)
        let allCombs: number[][] = TexasRobotCalcUtil.combination(indexes, short)
        let sevenCombs = TexasRobotCalcUtil.combination(Array(7).fill(0).map((v, i) => i), 5)
        for (let i = 0; i < allCombs.length; i++) {
            let addedCards = _destCards.cards.slice()
            allCombs[i].forEach(v => addedCards.push(_allCards.at(v)))

            let result:{chairNo:number,type:number}[] = checkWin(addedCards,_userHandCards,_cardsPower,sevenCombs)
            result.forEach(v => {
                let _item = winRecords.find(w=>w.chairNo == v.chairNo)
                if(_item){
                    _item.count++ 
                }else{
                    winRecords.push({chairNo:v.chairNo,count:1})
                }
            })
        }
        let winRates = winRecords.map(v => {
            return {
                chairNo: v.chairNo,
                winRate: v.count / possibilities
            }
        })
        return winRates;
    }

    function checkWin(publicCards:tCard[],handCards:IRobotHandCard[],power:TexasPower,combs:number[][]) {
        let count = combs[0].length
        let maxes:{chairNo:number,type:number}[] = []
        for (let i = 0; i < handCards.length; i++) {
            let _item =  handCards[i]
            let sevenCards = publicCards.concat(_item.cards)
            for (let j = 0; j < combs.length; j++) {
                let fiveCards = new CardArray()
                for (let k = 0; k < count; k++) {
                    fiveCards.push(sevenCards[combs[j][k]])
                }
                let cardsValue = power.analyse(fiveCards)
                let _findMax = maxes.find(v=>v.chairNo == _item.chairNo)
                if(_findMax){
                    if(_findMax.type < cardsValue){
                        _findMax.type = cardsValue
                    }
                }else{
                    maxes.push({chairNo:_item.chairNo,type:cardsValue})
                }
            }

        }
        //可能存在同大小的情况
        let result:{chairNo:number,type:number}[] = []
        let max = Math.max(...maxes.map(v=>v.type))
        maxes.map(function (x, i) {
            if (x.type === max) {
                result.push(x)
            }
        })
        return result
    }


    
}
