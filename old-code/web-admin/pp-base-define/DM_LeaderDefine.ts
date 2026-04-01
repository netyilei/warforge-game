import { kdmodule } from "kdweb-core/lib/mongo/model";
import { DB } from "../src/db";
import { MailDefine } from "./MailDefine";
import { LeaderDefine } from "./LeaderDefine";
import { RewardDefine } from "./RewardDefine";


export const Module_UserBalance = new kdmodule.database<LeaderDefine.tBalance>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"userID-itemID",
			field:{userID:1,itemID:1}
		}
	],
	tableName:"t_user_leader_balance",
	kvChangeTableName:"t_user_leader_balance_changed"
})

export const Module_ChargeLeaderRecord = new kdmodule.database<RewardDefine.tChargeLeaderRecord>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_charge_leader_record",
	kvChangeTableName:"t_charge_leader_record_changed"
})

export const Module_UserPot = new kdmodule.database<RewardDefine.tPot>({
	db:DB.get(),mainIndexName:"potID",useMongoIDForIndex:true,indexes:{potID:1},autoCreateIndexes:false,
	tableName:"t_user_pot",
	kvChangeTableName:"t_user_pot_changed"
})