
import { kdmodule } from "kdweb-core/lib/mongo/model"
import { UserDefine } from "./UserDefine"
import { DB } from "../src/db"
import { RoomDefine } from "./RoomDefine"
import { SrsDefine } from "./SrsDefine"
import { RobotExtDefine } from "./RobotExtDefine"
import { RobotDefine } from "./RobotDefine"

export const Module_RobotExtChargeStore = new kdmodule.database<RobotExtDefine.tChargeStore>({
	db:DB.get(),mainIndexName:"storeID",useMongoIDForIndex:true,indexes:{storeID:1},autoCreateIndexes:false,
	lockTable:true,
	tableName:"t_robot_ext_charge_store",
	kvChangeTableName:"t_robot_ext_charge_store_data_changed"
})

export const Module_RobotExtChargeStoreRecord = new kdmodule.database<RobotExtDefine.tChargeStoreRecord>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_robot_ext_charge_store_record",
	kvChangeTableName:"t_robot_ext_charge_store_record_changed"
})

export const Module_RobotExtRobotChargeRecord = new kdmodule.database<RobotExtDefine.tChargeRecord>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_robot_ext_robot_charge_record",
	kvChangeTableName:"t_robot_ext_robot_charge_record_changed"
})


export const Module_RobotExtGroupPlan = new kdmodule.database<RobotExtDefine.tGroupPlan>({
	db:DB.get(),mainIndexName:"planID",useMongoIDForIndex:true,indexes:{planID:1},autoCreateIndexes:false,
	tableName:"t_robot_ext_group_plan",
	kvChangeTableName:"t_robot_ext_group_plan_changed"
})

export const Module_RobotExtMatchPlan = new kdmodule.database<RobotExtDefine.tMatchPlan>({
	db:DB.get(),mainIndexName:"planID",useMongoIDForIndex:true,indexes:{planID:1},autoCreateIndexes:false,
	tableName:"t_robot_ext_match_plan",
	kvChangeTableName:"t_robot_ext_match_plan_changed"
})

export const Module_RobotPersonalityConfig = new kdmodule.database<RobotDefine.tPersonalityGameConfig_Base>({
	db:DB.get(),mainIndexName:"gameID",useMongoIDForIndex:false,indexes:{gameID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"gameID-personality",
			field:{gameID:1,personality:1}
		}
	],
	tableName:"t_robot_personality_config",
	kvChangeTableName:"t_robot_personality_config_changed"
})

export const Module_RobotRuntime = new kdmodule.database<RobotDefine.tRuntime>({
	db:DB.get(),mainIndexName:"robotUserID",useMongoIDForIndex:true,indexes:{robotUserID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"robotUserID-status",
			field:{robotUserID:1,status:1}
		},
		{
			name:"matchID",
			field:{matchID:1}
		},
	],
	tableName:"t_robot_runtime",
	kvChangeTableName:"t_robot_runtime_changed"
})

export const Module_RobotNameInfo = new kdmodule.database<RobotExtDefine.tRobotNameInfo>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"name",
			field:{name:1}
		},
		{
			name:"userID",
			field:{userID:1}
		}
	],
	lockTable:true,
	tableName:"t_robot_name_info",
	kvChangeTableName:"t_robot_name_info_changed"
})