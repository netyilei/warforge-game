import { kdmodule } from "kdweb-core/lib/mongo/model";
import { DB } from "../src/db";
import { MailDefine } from "./MailDefine";
import { CustomerDefine } from "./CustomerDefine";


export const Module_CustomerChatData = new kdmodule.database<CustomerDefine.tChat>({
	db:DB.get(),mainIndexName:"msgID",useMongoIDForIndex:true,indexes:{msgID:-1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"fromUserID-toUserID-msgID",
			field:{fromUserID:1,toUserID:1,msgID:-1}
		},
		{
			name:"toUserID",
			field:{toUserID:1}
		},
		{
			name:"fromUserID",
			field:{fromUserID:1}
		},
		{
			name:"toUserID-msgID",
			field:{toUserID:1,msgID:-1}
		},
		{
			name:"fromUserID-msgID",
			field:{fromUserID:1,msgID:-1}
		}
	],
	tableName:"t_customer_chat",
	kvChangeTableName:"t_customer_chat_changed"
})

export const Module_CustomerChatRoom = new kdmodule.database<CustomerDefine.tRoom>({
	db:DB.get(),mainIndexName:"roomID",useMongoIDForIndex:true,indexes:{roomID:1},autoCreateIndexes:false,
	lockTable:true,
	tableName:"t_customer_chat_room",
	kvChangeTableName:"t_customer_chat_room_changed"
})

