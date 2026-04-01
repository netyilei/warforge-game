import { kdmodule } from "kdweb-core/lib/mongo/model";
import { DB } from "../src/db";
import { MailDefine } from "./MailDefine";
import { NewsDefine } from "./NewsDefine";


export const Module_Mail = new kdmodule.database<MailDefine.tMail>({
	db:DB.get(),mainIndexName:"mailID",useMongoIDForIndex:true,indexes:{mailID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"toUserID_sendTime",
			field:{toUserID:1,sendTime:-1},
		}
	],
	tableName:"t_user_mail",
	kvChangeTableName:"t_user_mail_changed"
})

export const Module_SystemMail = new kdmodule.database<MailDefine.tMail>({
	db:DB.get(),mainIndexName:"mailID",useMongoIDForIndex:true,indexes:{mailID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"seqID",
			field:{seqID:1},
		},
		{
			name:"sendTime",
			field:{sendTime:1},
		},
	],
	tableName:"t_system_mail",
})

export const Module_Banner = new kdmodule.database<NewsDefine.tBanner>({
	db:DB.get(),mainIndexName:"bannerID",useMongoIDForIndex:true,indexes:{bannerID:1},autoCreateIndexes:false,
	tableName:"t_banner",
	kvChangeTableName:"t_banner_changed"
})