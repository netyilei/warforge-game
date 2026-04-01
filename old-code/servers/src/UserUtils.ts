import { kdutils } from "kdweb-core/lib/utils"
import { Log } from "../pp-rpc-center/log"
import { DB } from "./db"
import { IDUtils } from "./IDUtils"
import { RedisLock } from "./RedisLock"
import { TimeDate } from "./TimeDate"
import Decimal from "decimal.js"
import { isAddress } from "ethers"
import { UserDefine } from "../pp-base-define/UserDefine"
import { Module_RegisterAudit, Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_UserRelation, Module_UserSearch } from "../pp-base-define/DM_UserDefine"
import { RobotEnvTools } from "./RobotEnvTools"
import { Module_RobotRuntime } from "../pp-base-define/DM_RobotExtension"

let rTableCode = "t_user_code"
type tCodeIndex = {
	next:number,
	total:number,
}
let db = DB.get()
let redis = DB.getRedis()
export namespace UserUtils {
	
	export async function checkUserRole(userID:number,target:UserDefine.LoginTarget,role:UserDefine.RoleType,userRole?:UserDefine.tLoginRole) {
		userRole = userRole || await Module_UserLoginRole.getMain(userID)
		let targetRole = userRole?.targets?.find(v=>v.target == target)
		switch(target) {
			case UserDefine.LoginTarget.App: {

			} break 
			case UserDefine.LoginTarget.Console: {
				if(targetRole && targetRole.roles.includes(UserDefine.RoleType.Admin)) {
					return true 
				}
			} break 
		}
		return targetRole ? targetRole.roles.includes(role) : false
	}
	
	export async function checkUserConsoleRole(userID:number,role:UserDefine.RoleType,userRole?:UserDefine.tLoginRole) {
		return await checkUserRole(userID,UserDefine.LoginTarget.Console,role,userRole)
	}

	export async function rebuildSearch(userID:number,opt?:{
		loginData?:UserDefine.tLoginData,
		loginChannel?:UserDefine.tLoginChannel,
		loginRole?:UserDefine.tLoginRole,
		audit?:UserDefine.tRegisterAudit,
		relation?:UserDefine.PromoteRelation,
	}) {
		let loginData = opt?.loginData || await Module_UserLoginData.getMain(userID)
		if(!loginData) {
			return 
		}
		let loginChannel = opt?.loginChannel || await Module_UserLoginChannel.getMain(userID)
		let loginRole = opt?.loginRole || await Module_UserLoginRole.getMain(userID)
		let audit = opt?.audit || await Module_RegisterAudit.getMain(userID)
		let relation = opt?.relation || await Module_UserRelation.getMain(userID)
		let allRoles = loginRole?.targets.reduce((pre,v)=>{
			return pre.concat(v.roles)
		},[] as UserDefine.RoleType[]) || []
		let search:UserDefine.tUserSearch = {
			userID,
			strUserID:String(userID),
			nickName:loginData.nickName,
			account:loginChannel?.account || "",
			robot:loginData.robot == null ? await RobotEnvTools.isRobot(userID) : loginData.robot,
			targets:loginRole?.targets.map(v=>v.target) || [],
			targetEmpty:!(loginRole?.targets && loginRole.targets.length > 0),
			roles:allRoles,
			leader:relation?.leaders[0] || null,
			leaderTag:audit?.leaderTag || null,
			disabled:loginData.disabled || false,
			lockWithdraw:loginData.lockWithdraw || false,
		}
		if(search.robot) {
			let runtime = await Module_RobotRuntime.getMain(userID)
			search.robotGroupID = runtime?.targetGroupID
			search.robotMatchID = runtime?.targetMatchID
		}
		await Module_UserSearch.updateOrInsert(search)
	}
}