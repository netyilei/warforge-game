import Decimal from "decimal.js";
import { RpcAccountItem } from "../pp-account/rpc/account";
import { DBDefine } from "../pp-base-define/DBDefine";
import { ItemID } from "../pp-base-define/ItemDefine";
import { UserDefine } from "../pp-base-define/UserDefine";
import { DB } from "./db";
import { RobotEnvTools } from "./RobotEnvTools";


let db = DB.get()
async function main() {
	let loginDatas:UserDefine.tLoginData[] = await db.get(DBDefine.tableUserLoginData,{apiID:{$regex:"BINDR-"}})
	for(let loginData of loginDatas) {
		await RpcAccountItem.add(null,loginData.userID,ItemID.USDT,new Decimal("1000"))
		console.log("> add userID = " + loginData.userID + " itemID = " + ItemID.USDT + " value = " + 1000)
	}
	console.log("> done")
	process.exit()
}

main()