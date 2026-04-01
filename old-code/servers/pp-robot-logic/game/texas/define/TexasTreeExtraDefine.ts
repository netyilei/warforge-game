import { CardArray, tCard } from "../../../../pp-base-define/CardDefine"
import { GameSet } from "../../../../pp-base-define/GameSet"
import { GSUserMsg } from "../../../../pp-base-define/GSUserMsg"
import { ItemDefine } from "../../../../pp-base-define/ItemDefine"
import { RobotDefine } from "../../../../pp-base-define/RobotDefine"
import { GSCommonMsg } from "../../../../pp-game-base/GSCommonMsg"
import { TexasDefine, TexasGamePhase, TexasUserMsg } from "../../../../pp-game-texas/TexasDefine"
import { TexasPower } from "../../../../pp-game-texas/TexasPower"
import { IRobotProcessWorker } from "../../../entity/IRobotProcessWorker"
import { TexasOpponentRecord } from "../calc/TexasOpponentRecord"

export interface IRobotHandCard {
    type: number,
    chairNo?: number,
    cards: tCard[],
}

export interface IRobotUserOpponentRecord {
    userID: number,
    //总记录  每个阶段多次相同行为合计一次
    lastRecord: Record<TexasGamePhase, {
        action: TexasDefine.BetType,
        count: number,
    }[]>,
    //游玩次数
    playCount: number,
    //对手加注后弃牌的次数
    foldToRaise:number,
    //加注后跟牌次数
    callToRaise:number,
    //allin 之后弃牌次数
    foldToAllin:number,
    //allin 之后跟牌次数
    callToAllin:number,

    allinTimes:number,
    //最新阶段记录
    phaseRecord: {
        action: TexasDefine.BetType
        count: number,
    }[],
    curPhase: TexasGamePhase,
}

export type TexasTreeExtraDefine = {
    /**工作进程 */
    worker: IRobotProcessWorker
    /**游戏配置 */
    gameSet: GameSet
    /**牌型计算*/
    cardsPower: TexasPower,
    /**对手行为 */
    oppenteActionCls: TexasOpponentRecord


    /**所有手牌  可能不传 */
    handCards: IRobotHandCard[]
    /**桌面牌*/
    desktopCards: IRobotHandCard
    allDiCards: IRobotHandCard
    /**当前阶段 */
    phase: TexasGamePhase
    phaseChairNos: number[]
    /**座位 */
    playingChairNos: number[]
    /**用户数据 */
    users: GSUserMsg.tUserEnterData[]
    /**自己的数据 */
    selfUser: GSUserMsg.tUserEnterData
    /**自己的ID */
    selfUserID: number
    /**座位信息 */
    userPostitions:{
        chairNo:number,
        position:TexasDefine.PositionType,
    }[]
    /**所有的牌 防止重复初始化浪费资源*/
    allCards: CardArray

    simulateWinRate: {
        chairNo: number,
        winRate: number,
    }[]
    simulateActionRate:selfActionRate,
    /** 阶段下注分数 userID score */
    userBetScore: Record<string, string>,
    /**
     * 其他人的行为记录
     */
    opponentRecord: IRobotUserOpponentRecord[],

    /**
     * 强制胜率  行为层控制
     */
    forceWinRate:number,

    /** 强制使用全部底牌 */
    forceUseAllDiCards:boolean,
    /**
     * 机器人的配置
     */
    strategy:{
        strategy:RobotDefine.RuntimeStrategy,
        strategyData:RobotDefine.tStrategyData_Base,
        personality:RobotDefine.tPersonalityGameConfig_Texas,
    }

    readyBuyIn:boolean,

    attackTargetUserIDs:number[],
    robotUserIDs:number[],

}

export type TexasTickRealtimeData = {
    /**当前下注轮次 */
    betTurn?: GSCommonMsg.tBetTurnNT
    userBag?:ItemDefine.tBag
    isMatch?:boolean,
    taskFinsh?:boolean,
}

/**
 * 对手行为概率
 */
export type opponentActionRate = {
    foldToRaiseRate:number,
    callToRaiseRate:number,
    foldToAllinRate:number,
    callToAllinRate:number,
}

export type selfActionRate = {
    allinRate:number,
    foldRate:number,
    callRate:number,
    raiseRate:number,
    checkRate:number,
}