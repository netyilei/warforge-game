import { RobotDefine } from "../../../pp-base-define/RobotDefine";
import { GSCommonMsg } from "../../../pp-game-base/GSCommonMsg";
import { BaseRobotStrategy } from "../../base/BaseRobotStrategy";


export class RobotStrategy_Target extends BaseRobotStrategy {
	
    protected async onInitRobotStrategy() {
        if(this.logic){
            this.logic.setTreeConfig("forceUseAllDiCards",true);
        }  
    }
    protected onUpdate(): void {
        
    }
    protected onDestroy(): void {
        
    }
    protected onMessage(msgName:string,jsonObj:any) {

	}
    handleGameResult(msg:GSCommonMsg.tGameResultNT){
		let _selfRResult = msg.users.find(v=>v.userID == this.userID)
		if(!_selfRResult){
			this.reportTaskValue(null)
			return;
		}
        let _targetUserIDs = [];
        let _data = this.strategyData as RobotDefine.tStrategyData_Target
        if(!_data || !_data.targetUserIDs){
            _targetUserIDs = [];
        }else{
            _targetUserIDs = _data.targetUserIDs;
        }
		this.reportTaskValue(_selfRResult.scoreChanged,_targetUserIDs)
	}
    protected handleAfterStrategyTreeInit(){
        if(!this.gameStrategyTree){
            return;
        }
        let _data = this.strategyData as RobotDefine.tStrategyData_Target
        if(!_data || !_data.targetUserIDs){
            this.gameStrategyTree.saveAttackTargetIDs([])
            return;
        }
        this.gameStrategyTree.saveAttackTargetIDs(_data.targetUserIDs)
        
    }

    async loadRobotStrategyDB(){
        return true;
    }
    async saveRobotStrategyDB(){
        return true;
    }
}