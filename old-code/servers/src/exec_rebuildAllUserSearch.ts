import Decimal from "decimal.js";
import { RpcAccountItem } from "../pp-account/rpc/account";
import { DBDefine } from "../pp-base-define/DBDefine";
import { ItemID } from "../pp-base-define/ItemDefine";
import { UserDefine } from "../pp-base-define/UserDefine";
import { DB } from "./db";
import { RobotEnvTools } from "./RobotEnvTools";
import { UserUtils } from "./UserUtils";


let db = DB.get()
async function main() {
	let loginDatas:UserDefine.tLoginData[] = await db.get(DBDefine.tableUserLoginData,{})
	for(let loginData of loginDatas) {
		await UserUtils.rebuildSearch(loginData.userID,{
			loginData,
		})
		console.log("> rebuild search userID = " + loginData.userID)
	}
	console.log("> done")
	process.exit()
}

main()