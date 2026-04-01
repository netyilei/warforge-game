import { DBDefine } from "../../pp-base-define/DBDefine";
import { Module_RobotExtGroupPlan, Module_RobotExtMatchPlan } from "../../pp-base-define/DM_RobotExtension";
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { DB } from "../../src/db";
import { TraceLog } from "../../src/TraceLog";
import { RobotIpcMessage } from "../entity/RobotIpcMessage";
import { Log } from "../log";
import { Rpc } from "../rpc";

let db = DB.get()
async function createRobot(h:string,robotUserID:number,roomID:number,strategy:RobotDefine.RuntimeStrategy,strategyData:RobotDefine.tStrategyData_Base,personality:RobotDefine.tPersonalityGameConfig_Base,envItemBase:RobotDefine.tEnvConfig_ItemBase) {
	TraceLog.robot(robotUserID,"recv create robot",roomID,{robotUserID,strategy,strategyData,personality,envItemBase})
	return await Rpc.master.createRobot(robotUserID,roomID,strategy,strategyData,personality,envItemBase)
}

async function createRobotWithTask(h:string,robotUserID:number,roomID:number,taskID:number) {
	let task:RobotDefine.tStrategyTask = await db.getSingle(DBDefine.tableRobotStrategyTask,{taskID})
	TraceLog.robot(robotUserID,"recv create robot with task",roomID,{robotUserID,taskID,task})
	// if(!task || task.status != RobotDefine.StrategyTaskStatus.Running) {
	// 	TraceLog.robot(robotUserID,"recv create robot with task but task not found or status not running",roomID,{robotUserID,taskID,task})
	// 	return 
	// }
	// let personality:RobotDefine.tPersonalityGameConfig_Base =await db.getSingle(DBDefine.tableRobotPersonlityGameConfig,{personality:task.personality})
	// return await Rpc.master.createRobot(robotUserID,roomID,task.strategy,task.strategyData,personality,envItemBase)
	return await Rpc.master.createRobotWithTask(robotUserID,roomID,taskID)
}

async function createRobotWithGroupPlan(h:string,robotUserID:number,roomID:number,planID:number) {
	let plan = await Module_RobotExtGroupPlan.getMain(planID)
	TraceLog.robot(robotUserID,"recv create robot with group plan",roomID,{robotUserID,planID,plan})
	// if(!task || task.status != RobotDefine.StrategyTaskStatus.Running) {
	// 	TraceLog.robot(robotUserID,"recv create robot with task but task not found or status not running",roomID,{robotUserID,taskID,task})
	// 	return 
	// }
	// let personality:RobotDefine.tPersonalityGameConfig_Base =await db.getSingle(DBDefine.tableRobotPersonlityGameConfig,{personality:task.personality})
	// return await Rpc.master.createRobot(robotUserID,roomID,task.strategy,task.strategyData,personality,envItemBase)
	return await Rpc.master.createRobotWithGroupPlan(robotUserID,roomID,plan)
}

async function createRobotWithMatchPlan(h:string,robotUserID:number,roomID:number,planID:number) {
	let plan = await Module_RobotExtMatchPlan.getMain(planID)
	TraceLog.robot(robotUserID,"recv create robot with match plan",roomID,{robotUserID,planID,plan})
	// if(!task || task.status != RobotDefine.StrategyTaskStatus.Running) {
	// 	TraceLog.robot(robotUserID,"recv create robot with task but task not found or status not running",roomID,{robotUserID,taskID,task})
	// 	return 
	// }
	// let personality:RobotDefine.tPersonalityGameConfig_Base =await db.getSingle(DBDefine.tableRobotPersonlityGameConfig,{personality:task.personality})
	// return await Rpc.master.createRobot(robotUserID,roomID,task.strategy,task.strategyData,personality,envItemBase)
	return await Rpc.master.createRobotWithMatchPlan(robotUserID,roomID,plan)
}

async function stopRobotLogicByMatchID(h:string,matchID:number) {
	return await Rpc.master.stopRobotLogicByMatchID(matchID)
}

export let RpcRobotInternal = {
	createRobot,
	createRobotWithTask,
	createRobotWithGroupPlan,
	createRobotWithMatchPlan,
	stopRobotLogicByMatchID,
}