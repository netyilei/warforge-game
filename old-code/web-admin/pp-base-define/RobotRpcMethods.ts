
export namespace RobotRpcMethods {
	export const logicPrefix = "kds.robot-logic"
	export const logic_gsSendMessage = logicPrefix + ".gs.sendMessage"
	export const logic_gsUserExit = logicPrefix + ".gs.userExit"
	// robotUserID:number,roomID:number,strategy:RobotDefine.RuntimeStrategy,strategyData:RobotDefine.tStrategyData_Base,personality:RobotDefine.tPersonalityGameConfig_Base,envItemBase:RobotDefine.tEnvConfig_ItemBase
	export const logic_internalCreateRobot = logicPrefix + ".in.createRobot"
	// robotUserID:number,roomID:number,taskID:number
	export const logic_internalCreateRobotWithTask = logicPrefix + ".in.createRobotWithTask"
	// robotUserID:number,roomID:number,planID:number
	export const logic_internalCreateRobotWithGroupPlan = logicPrefix + ".in.createRobotWithGroupPlan"
	// robotUserID:number,roomID:number,planID:number
	export const logic_internalCreateRobotWithMatchPlan = logicPrefix + ".in.createRobotWithMatchPlan"

	export const logic_internalStopRobotLogicByMatchID = logicPrefix + ".in.stopRobotLogicByMatchID"


	export const envPrefix = "kds.robot-env"
	// serviceInfo,gameIDs:number[]
	export const env_onLogicOnline = envPrefix + ".onLogicOnline"
	// name:string
	export const env_onLogicOffline = envPrefix + ".onLogicOffline"


	export const centerPrefix = "kds.robot-center"
	export const center_regLogic = centerPrefix + ".regLogic"
	export const center_regEnv = centerPrefix + ".regEnv"

	export const matchPrefix = "kds.robot-match"
	export const match_gsSendMessage = matchPrefix + ".gs.sendMessage"
	export const match_gsUserExit = matchPrefix + ".gs.userExit"
}