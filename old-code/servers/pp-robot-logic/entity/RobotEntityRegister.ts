import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { BaseRobotLogic } from "../base/BaseRobotLogic";
import { BaseRobotStrategy } from "../base/BaseRobotStrategy";
import { RobotLogic_101Texas } from "./logics/RobotLogic_101Texas";
import { RobotLogic_101Texas_Test } from "./logics/RobotLogic_101Texas_Test";
import { RobotStrategy_Bonus } from "./strategies/RobotStrategy_Bonus";
import { RobotStrategy_Kill } from "./strategies/RobotStrategy_Kill";
import { RobotStrategy_Normal } from "./strategies/RobotStrategy_Normal";
import { RobotStrategy_Target } from "./strategies/RobotStrategy_Target";


// 策略注册
export namespace RobotEntityRegister {
	type StrategyClazz = {new(...params):BaseRobotStrategy}
	export let strategies = new Map<RobotDefine.RuntimeStrategy,StrategyClazz>()

	type LogicClazz = {new(...params):BaseRobotLogic}
	export let logics = new Map<number,LogicClazz>()	
}

RobotEntityRegister.strategies.set(RobotDefine.RuntimeStrategy.Normal,	RobotStrategy_Normal)
RobotEntityRegister.strategies.set(RobotDefine.RuntimeStrategy.Kill,	RobotStrategy_Kill)
RobotEntityRegister.strategies.set(RobotDefine.RuntimeStrategy.Bonus,	RobotStrategy_Bonus)
RobotEntityRegister.strategies.set(RobotDefine.RuntimeStrategy.Target,	RobotStrategy_Target)

 RobotEntityRegister.logics.set(101,RobotLogic_101Texas)
// RobotEntityRegister.logics.set(101,RobotLogic_101Texas_Test)