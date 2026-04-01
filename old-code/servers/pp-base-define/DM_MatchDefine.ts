import { MatchDefine } from "./MatchDefine";
import { kdmodule } from "kdweb-core/lib/mongo/model"
import { UserDefine } from "./UserDefine"
import { DB } from "../src/db"

export const Module_MatchData = new kdmodule.database<MatchDefine.tData>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:true,indexes:{matchID:1},autoCreateIndexes:false,
	tableName:"t_match_data",
	kvChangeTableName:"t_match_data_changed"
})

export const Module_MatchReward = new kdmodule.database<MatchDefine.tReward>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:true,indexes:{matchID:1},autoCreateIndexes:false,
	tableName:"t_match_reward",
	kvChangeTableName:"t_match_reward_changed"
})

export const Module_MatchDisplay = new kdmodule.database<MatchDefine.tDisplay>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:true,indexes:{matchID:1},autoCreateIndexes:false,
	tableName:"t_match_display",
	kvChangeTableName:"t_match_display_changed"
})

export const Module_MatchRuntime = new kdmodule.database<MatchDefine.tRuntime>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:true,indexes:{matchID:1},autoCreateIndexes:false,
	tableName:"t_match_runtime",
	kvChangeTableName:"t_match_runtime_changed",
})

export const Module_MatchExecuter = new kdmodule.database<MatchDefine.tExecuter>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:false,indexes:{matchID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"matchID-executerID",field:{matchID:1,executerID:1},
		},
		{
			name:"executerID",field:{executerID:1},
		}
	],
	tableName:"t_match_executer",
	kvChangeTableName:"t_match_executer_changed",
})

export const Module_MatchExecuterRoomInfo = new kdmodule.database<MatchDefine.tExecuterRoomInfo>({
	db:DB.get(),mainIndexName:"roomID",useMongoIDForIndex:false,indexes:{roomID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"matchID-executerID",field:{matchID:1,executerID:1},
		},
		{
			name:"executerID",field:{executerID:1},
		},
		{
			name:"matchID",field:{matchID:1},
		},
	],
	tableName:"t_match_executer_room_info",
	kvChangeTableName:"t_match_executer_room_info_changed",
})

export const Module_MatchUserRuntime = new kdmodule.database<MatchDefine.tUserRuntime>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"matchID",field:{matchID:1},
		},
		{
			name:"matchID-userID",field:{matchID:1,userID:1},
		}
	],
	tableName:"t_match_user_runtime",
	kvChangeTableName:"t_match_user_runtime_changed",
})

export const Module_MatchUserSignUp = new kdmodule.database<MatchDefine.tUserSignupRecord>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_match_signup_record",
})

export const Module_MatchUserRank = new kdmodule.database<MatchDefine.tUserRank>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:false,indexes:{matchID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"matchID-userID",field:{matchID:1,userID:1},
		},
		{
			name:"userID",field:{userID:1},
		},
		{
			name:"matchID-rank",field:{matchID:1,rank:1},
		}
	],
	tableName:"t_match_user_rank",
})

export const Module_MatchWater = new kdmodule.database<MatchDefine.tWater>({
	db:DB.get(),mainIndexName:"matchID",useMongoIDForIndex:true,indexes:{matchID:1},autoCreateIndexes:false,
	tableName:"t_match_water",
})

export const Module_UserMatchEvent = new kdmodule.database<MatchDefine.tUserMatchEvent>({
	db:DB.get(),mainIndexName:"eventID",useMongoIDForIndex:true,indexes:{eventID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"expireTimestamp",field:{expireTimestamp:1},
		},
		{
			name:"userID",field:{userID:1},
		},
		{
			name:"timestamp",field:{timestamp:-1},
		}
	],
	tableName:"t_user_match_event",
})