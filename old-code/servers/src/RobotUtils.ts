import { kdlock } from "kdweb-core/lib/tools/lock";
import { RobotExtDefine } from "../pp-base-define/RobotExtDefine";
import { DB } from "./db";
import { Module_RobotNameInfo } from "../pp-base-define/DM_RobotExtension";
import { kdutils } from "kdweb-core/lib/utils";
import { Module_UserLoginData } from "../pp-base-define/DM_UserDefine";
import { UserUtils } from "./UserUtils";


let redis = DB.getRedis()
export namespace RobotUtils {
	export async function setGlobalControl(control:RobotExtDefine.tGlobalControl) {
		await redis.set("t_robot_global_control",control,true)
	}

	export async function getGlobalControl() : Promise<RobotExtDefine.tGlobalControl> {
		let control:RobotExtDefine.tGlobalControl = await redis.get("t_robot_global_control",true)
		if(!control) {
			control = {
				enabled:false,
				groupEnabled:false,
				groups:[],
				matchEnabled:false,
			}
		}
		return control
	}

	export async function pickRobotNameInfo(userID:number) {
		return await kdlock.redis.callInLock(Module_RobotNameInfo.getLockName(null),30,async ()=>{
			let nameInfo = await Module_RobotNameInfo.getSingle({userID})
			if(nameInfo) {
				await Module_RobotNameInfo.updateOrigin({no:nameInfo.no},{
					$set:{
						userID:null,
					}
				})
			}
			let count = await Module_RobotNameInfo.getCount({userID:null})
			if(count <= 0) {
				return null 
			}
			let skip = kdutils.intRandom(0,count)
			nameInfo = await Module_RobotNameInfo.getSingle({userID:null},{skip})
			if(!nameInfo) {
				nameInfo = await Module_RobotNameInfo.getSingle({userID:null})
				if(!nameInfo) {
					return null
				}
			}
			if(nameInfo) {
				nameInfo.userID = userID
				await Module_RobotNameInfo.update(nameInfo)
			}
			return nameInfo
		})
	}

	export async function refreshRobotLoginData(userID:number) {
		let module = await Module_UserLoginData.searchLockedSingleData(userID)
		if(!module) {
			return null 
		}
		let nameInfo = await RobotUtils.pickRobotNameInfo(userID)
		if(nameInfo) {
			module.data.nickName = nameInfo.name
			module.data.iconUrl = nameInfo.iconUrl
			await module.saveAndRelease()
			UserUtils.rebuildSearch(module.data.userID)
			return module.data 
		}
		await module.release()
		return null
	}
}