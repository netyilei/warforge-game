import Decimal from "decimal.js";
import { GameSet } from "../../../pp-base-define/GameSet";
import { RobotDefine } from "../../../pp-base-define/RobotDefine";
import { RoomDefine } from "../../../pp-base-define/RoomDefine";
import { BaseRobotStrategy } from "../../base/BaseRobotStrategy";


export class RobotStrategy_Kill extends BaseRobotStrategy {
	
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
    protected handleWinRate(): number {
        return this.calcTargetScoreDiff();
    }

    async loadRobotStrategyDB(){
        return true;
    }
    async saveRobotStrategyDB(){
        return true;
    }

    private calcTargetScoreDiff_bak(){
        if(!this.robotBag){
            return 0;
        }
        let _data = this.strategyData as RobotDefine.tStrategyData_Kill
        if(!_data.limitValue){
            return 0;
        }
        let gameSet_ = GameSet.createWithData(this.roomData.gameData)
        let payType = RoomDefine.getPayType(gameSet_.getPayType())
		let payIndex = RoomDefine.getPayIndex(gameSet_.getPayType())
        if(payType == RoomDefine.PayType.Item){
        	let _item = this.robotBag.items.find(v=>v.id == String(payIndex))
            if(!_item){
                return 0;
            }
            let off = Decimal.sub(1.0,Decimal.div(_item.count,_data.limitValue))
            if(off.lessThan(0)){
                off = new Decimal(0)
            }
            return off.toNumber()
        }
        return 0
    }
    private calcTargetScoreDiff(){
        // if(!this.robotBag){
        //     return 0;
        // }
        let _data = this.strategyData as RobotDefine.tStrategyData_Kill
        if(!_data.limitValue){
            return 0;
        }
        let curValue = _data.curValue || "0"
        let off = Decimal.sub(1.0,Decimal.div(curValue,_data.limitValue))
        if(off.lessThan(0)){
            off = new Decimal(0)
        }
        return off.toNumber()
    }
}