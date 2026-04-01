

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { ClubAuth_Default } from "./Utils/ClubAuth_Default"
import { DB } from "../src/db"
import { DBDefine } from "../pp-base-define/DBDefine"

Rpc.authClass = ClubAuth_Default
Rpc.init()


async function initDB() {
	let db = DB.get()
	await db.checkAndCreateIndexes(DBDefine.tableClubData,[
		{
			field:{
				clubID:1,
			},
			opt:{
				name:"clubID",
				background:true,
			}
		},
	])
	await db.checkAndCreateIndexes(DBDefine.tableClubSetting,[
		{
			field:{
				clubID:1,
			},
			opt:{
				name:"clubID",
				background:true,
			}
		},
	])
	await db.checkAndCreateIndexes(DBDefine.tableClubUserAccount,[
		{
			field:{
				clubID:1,
				userID:1,
			},
			opt:{
				name:"clubID-userID",
				background:true,
			}
		},
		{
			field:{
				clubID:1,
			},
			opt:{
				name:"clubID",
				background:true,
			}
		}
	])
	await db.checkAndCreateIndexes(DBDefine.tableClubRoomTemplate,[
		{
			field:{
				clubID:1,
				templateID:1,
			},
			opt:{
				name:"clubID-templateID",
				background:true,
			}
		},
		{
			field:{
				clubID:1,
			},
			opt:{
				name:"clubID",
				background:true,
			}
		},
	])
	await db.checkAndCreateIndexes(DBDefine.tableClubMember,[
		{
			field:{
				clubID:1,
				userID:1,
			},
			opt:{
				name:"clubID-userID",
				background:true,
			}
		},
		{
			field:{
				clubID:1,
			},
			opt:{
				name:"clubID",
				background:true,
			}
		}
	])
	await db.checkAndCreateIndexes(DBDefine.tableClubRelation,[
		{
			field:{
				clubID:1,
				userID:1,
			},
			opt:{
				name:"clubID-userID",
				background:true,
			}
		},
		{
			field:{
				clubID:1,
			},
			opt:{
				name:"clubID",
				background:true,
			}
		}
	])
	await db.checkAndCreateIndexes(DBDefine.tableClubDeskCost,[
		{
			field:{
				clubID:1,
				gameID:1,
			},
			opt:{
				name:"clubID-gameID",
				background:true,
			}
		},
		{
			field:{
				clubID:1,
				leaderUserID:1,
			},
			opt:{
				name:"clubID-leaderUserID",
				background:true,
			}
		}
	])
}

initDB()