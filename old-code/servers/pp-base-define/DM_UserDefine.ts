

import { kdmodule } from "kdweb-core/lib/mongo/model"
import { UserDefine } from "./UserDefine"
import { DB } from "../src/db"
import { ItemDefine } from "./ItemDefine"

export const Module_UserLoginData = new kdmodule.database<UserDefine.tLoginData>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_login_data",
	kvChangeTableName:"t_login_data_changed"
})
export const Module_UserLoginChannel = new kdmodule.database<UserDefine.tLoginChannel>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_login_channel",
	kvChangeTableName:"t_login_channel_changed"
})
export const Module_UserLoginRole = new kdmodule.database<UserDefine.tLoginRole>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_login_role",
	kvChangeTableName:"t_login_role_changed"
})
export const Module_LoginAccessToken = new kdmodule.database<UserDefine.tLoginAccessToken>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,autoCreateIndexes:false,
	tableName:"t_login_access_token",
	kvChangeTableName:"t_login_access_token_changed",
	fullIndexes:[
		{
			name:"userID",
			field:{userID:1}
		},
		{
			name:"ak-target",
			field:{ak:1,target:1}
		},
	]
})
export const Module_UserRelation = new kdmodule.database<UserDefine.PromoteRelation>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_relation",
	kvChangeTableName:"t_relation_changed"
})
export const Module_UserSerial = new kdmodule.database<ItemDefine.tSerial>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_serial",
	fullIndexes:[
		{
			name:"timestamp",field:{timestamp:-1}
		},
		{
			name:"userID",field:{userID:1}
		},
		{
			name:"userID-timestamp",field:{userID:1,timestamp:-1}
		},
		{
			name:"userID-serialType",field:{userID:1,serialType:1}
		}
	]
})

export const Module_UserRoomID = new kdmodule.database<UserDefine.tUserRoomID>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_user_room_ids",
	fullIndexes:[
		{
			name:"userID-roomID",field:{userID:1,roomID:1},
		},
		{
			name:"roomID",field:{roomID:1},
		},
	],
	lockTable:true,
})

export const Module_UserMatchID = new kdmodule.database<UserDefine.tUserMatchID>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_user_match_ids",
	lockTable:true,
})

export const Module_UserBag = new kdmodule.database<ItemDefine.tBag>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_user_bag",
	kvChangeTableName:"t_user_bag_changed"
})

export const Module_UserBagLock = new kdmodule.database<ItemDefine.tLock>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"lockID",field:{lockID:1}
		},
		{
			name:"userID-lockID",field:{userID:1,lockID:1}
		}
	],
	tableName:"t_user_bag_lock",
	lockTable:true,
})

export const Module_RegisterUpload = new kdmodule.database<UserDefine.tRegisterUpload>({
	db:DB.get(),mainIndexName:"token",useMongoIDForIndex:true,indexes:{token:1},autoCreateIndexes:false,
	tableName:"t_register_upload",
})

export const Module_RegisterAudit = new kdmodule.database<UserDefine.tRegisterAudit>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_register_audit",
	kvChangeTableName:"t_register_audit_changed"
})

export const Module_TradePassword = new kdmodule.database<{
	userID:number,
	pwdMD5:string,
}>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_trade_password",
	kvChangeTableName:"t_trade_password_changed"
})

export const Module_UserSearch = new kdmodule.database<UserDefine.tUserSearch>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_user_search",
})