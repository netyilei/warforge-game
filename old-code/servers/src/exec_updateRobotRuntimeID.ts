
import { kdlog } from "kdweb-core/lib/log"
kdlog.init("default")
import { kdutils } from "kdweb-core/lib/utils";
import { RobotEnvTools } from "./RobotEnvTools";
import { DB } from "./db";
import { RobotDefine } from "../pp-base-define/RobotDefine";
import { Module_RobotRuntime } from "../pp-base-define/DM_RobotExtension";
import { UserDefine } from "../pp-base-define/UserDefine";
import { Module_UserLoginData } from "../pp-base-define/DM_UserDefine";
import { TimeDate } from "./TimeDate";


let db = DB.get()
async function main() {
	let runtimes:RobotDefine.tRuntime[] = await db.get("t_robot_runtime",{})
	await db.delMany("t_robot_runtime",{})
	await Module_RobotRuntime.insert(runtimes)

	let loginDatas:UserDefine.tLoginData[] = await Module_UserLoginData.get({userID:{$in:runtimes.map(v=>v.robotUserID)}})
	for(let runtime of runtimes) {
		let loginData = loginDatas.find(v=>v.userID == runtime.robotUserID)
		if(loginData) {
			continue
		}
		let userID = runtime.robotUserID
		let apiID = "BINDR-" + userID
		loginData = {
			apiID: apiID,

			userID: userID,
			strUserID:String(userID),

			nickName: "R" + userID,
			sex: 0,
			iconUrl: null,

			deviceTag:"",
			channelTag:RobotDefine.LoginTag,

			regTimestamp: kdutils.getMillionSecond(),
			regDate: TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		}
		await Module_UserLoginData.insert(loginData)
	}
	
	console.log("> done")
	process.exit()
}
main()