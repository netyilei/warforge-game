import { kdutils } from "kdweb-core/lib/utils";
import { RobotEnvTools } from "./RobotEnvTools";
import { Module_UserLoginData } from "../pp-base-define/DM_UserDefine";
import { LeaderHelper } from "./LeaderHelper";


async function main() {
	let loginDatas = await Module_UserLoginData.get({})
	for(let loginData of loginDatas) {
		await LeaderHelper.createTag(loginData.userID)
	}
	console.log("> done")
	process.exit()
}
main()