
import { kdmodule } from "kdweb-core/lib/mongo/model"
import { UserDefine } from "./UserDefine"
import { DB } from "../src/db"
import { RoomDefine } from "./RoomDefine"
import { SrsDefine } from "./SrsDefine"

export const Module_RoomData = new kdmodule.database<RoomDefine.RoomData>({
	db:DB.get(),mainIndexName:"roomID",useMongoIDForIndex:true,indexes:{roomID:1},autoCreateIndexes:false,
	tableName:"t_room",
	kvChangeTableName:"t_room_data_changed"
})

export const Module_RoomRealtime = new kdmodule.database<RoomDefine.RoomRealtime>({
	db:DB.get(),mainIndexName:"roomID",useMongoIDForIndex:true,indexes:{roomID:1},autoCreateIndexes:false,
	tableName:"t_room_realtime",
	kvChangeTableName:"t_room_realtime_changed"
})

export const Module_RoomGSSrsNode = new kdmodule.database<SrsDefine.Mongo.tGSSrsNode>({
	db:DB.get(),mainIndexName:"name",useMongoIDForIndex:false,indexes:{name:1},autoCreateIndexes:false,
	tableName:SrsDefine.Mongo.tableGSSrsNode,
})