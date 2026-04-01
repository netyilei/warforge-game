import { RobotExtDefine } from "../pp-base-define/RobotExtDefine";
import { DB } from "./db";
import fs = require("fs")
import { IDUtils } from "./IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { Module_RobotNameInfo } from "../pp-base-define/DM_RobotExtension";
import _ = require("underscore");

let redis = DB.getRedis()
let db = DB.get()

async function main() {
	let headUrl = "kin://user_head/img_tx_"
	let headStart = 1
	let headLength = 20
	let filename = "names.json"
	let str = fs.readFileSync(filename, "utf-8")
	let names: string[] = JSON.parse(str)
	await IDUtils.checkOrInit()
	await Module_RobotNameInfo.checkAndCreateIndexes()
	let ps = []
	names = _.shuffle(names)
	names = _.shuffle(names)
	names = _.shuffle(names)
	for (let name of names) {
		let nameInfo: RobotExtDefine.tRobotNameInfo = {
			no: await IDUtils.getRobotNameID(),
			name: name,
			iconUrl: headUrl + kdutils.intRandom(headStart, headStart + headLength),
			userID: null,
		}
		ps.push(Module_RobotNameInfo.updateOrInsert({ name }, nameInfo))
		if (ps.length > 100) {
			await Promise.all(ps)
			ps = []
		}
	}
	if (ps.length > 0) {
		await Promise.all(ps)
	}
	console.log("> done")
	process.exit(0)
}

main()