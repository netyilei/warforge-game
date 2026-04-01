import { kdmodule } from "kdweb-core/lib/mongo/model";
import { DB } from "../src/db";
import { MailDefine } from "./MailDefine";
import { NewsDefine } from "./NewsDefine";


export const Module_News = new kdmodule.database<NewsDefine.tData>({
	db:DB.get(),mainIndexName:"newsID",useMongoIDForIndex:true,indexes:{newsID:1},autoCreateIndexes:false,
	tableName:"t_news",
	kvChangeTableName:"t_news_changed"
})
