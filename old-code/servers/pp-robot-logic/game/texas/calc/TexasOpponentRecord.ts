import _ from "underscore";
import { TexasDefine, TexasGamePhase } from "../../../../pp-game-texas/TexasDefine";
import * as b3 from "../../tree/b3"
import { IRobotUserOpponentRecord, opponentActionRate, TexasTreeExtraDefine } from "../define/TexasTreeExtraDefine"
import { Log } from "../../../log";
export class TexasOpponentRecord {
    private opponentRecord: IRobotUserOpponentRecord[] = [];
    //private curUser: IRobotUserOpponentRecord = null;
    private blackboard: b3.Blackboard<TexasTreeExtraDefine> = null;
    private robotMarkList:number[] = [];
    constructor(blackborad: b3.Blackboard<TexasTreeExtraDefine>) { 
        if(!blackborad){
            return;
        }
        this.blackboard = blackborad;
        this.opponentRecord = blackborad.get("opponentRecord")
        if(!this.opponentRecord){
            this.opponentRecord = []  
        }
        
    }

    setUser(userID){
        // this.curUser = this.opponentRecord.find(v=>v.userID == userID)
        // if(!this.curUser){
        //     this.curUser = this.getDefaultOpponentRecord(userID)
        //     this.opponentRecord.push(this.curUser)
        // }
    }
    getUser(userID){
        let user = this.opponentRecord.find(v=>v.userID == userID)
        if(!user){
            user = this.getDefaultOpponentRecord(userID)
            this.opponentRecord.push(user)
        }
        return user;
    }
    saveStartOpponentAction(userID:number){

        let user = this.getUser(userID)
        user.playCount ++;
    }
    saveBetOpponentAction(userID:number,action:TexasDefine.BetType,score:string,phase:TexasGamePhase){


        let user = this.getUser(userID)
  
        this.saveFoldToRaise(userID,action);
        if(user.curPhase == phase){
            let _acton = user.phaseRecord.find(v=>v.action == action)
            if(_acton){
                _acton.count ++;
            }
            else{
                user.phaseRecord.push({action:action,count:1})
            }
            
        }else{
            for (const item of user.phaseRecord) {
                let find_ = user.lastRecord[user.curPhase].find(v=>v.action == item.action)
                if(find_){
                    find_.count += 1;
                }else{
                    user.lastRecord[user.curPhase].push({action:item.action,count:1})
                }
            }
            user.curPhase = phase;
            user.phaseRecord = [{action:action,count:1}];
        }
    }
    save(){
        this.blackboard.set("opponentRecord",this.opponentRecord)
    }

    getDefaultOpponentRecord(userID){
    	let _default :IRobotUserOpponentRecord = {
            userID: userID,
            lastRecord: {
                [TexasGamePhase.Ante]: [],
                [TexasGamePhase.BB]: [],
                [TexasGamePhase.Pre]: [],
                [TexasGamePhase.Flop]: [],
                [TexasGamePhase.Turn]: [],
                [TexasGamePhase.River]: [],
                [TexasGamePhase.Show]: []
            },
            phaseRecord: [],
            playCount: 0,
            foldToRaise: 0,
            callToRaise: 0,
            foldToAllin: 0,
            callToAllin: 0,
            curPhase: 0,
            allinTimes: 0,
        }
        return _default;
    }

    //TODO 检测对手加注后放弃的概率 
    checkAllRate(excludeSelf = false){
        let _allRate:opponentActionRate = {
            foldToRaiseRate: 0,
            callToRaiseRate: 0,
            foldToAllinRate: 0,
            callToAllinRate: 0
        }
        let _chairs = this.blackboard.get("playingChairNos")
        let _users = this.blackboard.get("users")
      
        let _findUsers = _users.filter(v=>_chairs.includes(v.chairNo)).map(v=>v.userID)
        if(excludeSelf){
            let _selfUserID = this.blackboard.get("selfUserID")
            _findUsers = _findUsers.filter(v=>v!= _selfUserID)
        }
       
        let _findOppoentUsers = this.opponentRecord.filter(v=>_findUsers.includes(v.userID))
        if(_findOppoentUsers.length == 0){
            return _allRate;
        }
        
        for (const user of _findOppoentUsers) {
            _allRate.callToAllinRate += user.callToAllin / user.playCount
            _allRate.foldToAllinRate += user.foldToAllin / user.playCount
            _allRate.callToRaiseRate += user.callToRaise / user.playCount
            _allRate.foldToRaiseRate += user.foldToRaise / user.playCount
        }
        _allRate.callToAllinRate /= _findOppoentUsers.length;
        _allRate.foldToAllinRate /= _findOppoentUsers.length;
        _allRate.callToRaiseRate /= _findOppoentUsers.length;
        _allRate.foldToRaiseRate /= _findOppoentUsers.length;

        return _allRate;
    }
    getBeforeHadAllIn(){
        for (const user of this.opponentRecord) {
            let _idx = user.phaseRecord.findIndex(v=>(v.action == TexasDefine.BetType.Allin && v.count > 0))
            if(_idx != -1){
                return true
            }
        }
        return false;
    }


    /**
     * 加注后弃牌 记录
     * @param userID 
     * @param action 
     */
    private saveFoldToRaise(userID:number,action:TexasDefine.BetType){
       
        if(action == TexasDefine.BetType.Abandon){
            for (const user of this.opponentRecord) {
                if(user.userID == userID){
                    continue;
                }
                let _find = user.phaseRecord.find(v=>v.action == TexasDefine.BetType.Raise)
                if(_find){
                    user.foldToRaise ++;
                }
                let _findAllin = user.phaseRecord.find(v=>v.action == TexasDefine.BetType.Allin)
                if(_findAllin){
                    user.foldToAllin ++;
                }
            }
        }
        else if(action == TexasDefine.BetType.Call){
            for (const user of this.opponentRecord) {
                if(user.userID == userID){
                    continue;
                }
                let _find = user.phaseRecord.find(v=>v.action == TexasDefine.BetType.Raise)
                if(_find){
                    user.callToRaise ++;
                }
                let _findAllin = user.phaseRecord.find(v=>v.action == TexasDefine.BetType.Allin)
                if(_findAllin){
                    user.callToAllin ++;
                }
            }
        }
        else if(action == TexasDefine.BetType.Allin){
            for (const user of this.opponentRecord) {
                if(user.userID == userID){
                    user.allinTimes ++;
                    Log.oth.info("TexasOpponentRecord","userID = ",userID," action = ",action," allinTimes = ",user.allinTimes)
                  
                    continue;
                }
                let _findAllin = user.phaseRecord.find(v=>v.action == TexasDefine.BetType.Allin)
                if(_findAllin){
                    user.callToAllin ++;
                }
            }
        }
    }
    getForceAllIn(){
        let _otherAllinTimes = 0;
        for (const item of this.opponentRecord) {
            if(this.robotMarkList.includes(item.userID)){
                continue;
            }

            _otherAllinTimes += item.allinTimes;
        }
        let off = Math.pow(_otherAllinTimes/5,2)*100;
        if( _.random(100) <= off){
            return true;
        }

        return false;
    }
    clearForceAllIn(){
        for (const item of this.opponentRecord) {
            item.allinTimes = 0;
        }
    }

    saveRobotList(arr:number[]){
        this.robotMarkList = arr;
    }
}