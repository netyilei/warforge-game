import { baseService, lambdaAsyncService } from "kdweb-core/lib/service/base"
import { knServiceCrypto } from "./knServiceCrypto"
import { DB } from "./db"
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "./TimeDate"
import { Module_LoginAccessToken } from "../pp-base-define/DM_UserDefine"
import { UserDefine } from "../pp-base-define/UserDefine"
import { Log } from "../pp-rpc-center/log"


function AppVerifyFunctional(func) {
	return lambdaAsyncService.create(async (params:{ak:string})=>{
		if(!params.ak) {
			return baseService.errJson(99,"")
		}
		let akInfo = await Module_LoginAccessToken.getSingle({
			ak:params.ak,
			target:UserDefine.LoginTarget.App,
		})
		if(!akInfo) {
			return baseService.errJson(99,"")
		}
		try {
			return await func(akInfo.userID,params)
		} catch (error) {
			Log.oth.error("system error",error)
			return baseService.errJson(1,"system err")
		}
	})
}

function ConsoleVerifyFunctional_Filter(func) {
	return lambdaAsyncService.create(async (params:{ak:string})=>{
		if(!params.ak) {
			return baseService.errJson(99,"")
		}
		for(let key of Object.keys(params)) {
			if(typeof params[key] === "string" && params[key].length == 0) {
				delete params[key]
			}
		}
		let akInfo = await Module_LoginAccessToken.getSingle({
			ak:params.ak,
			target:UserDefine.LoginTarget.Console,
		})
		if(!akInfo) {
			return baseService.errJson(99,"")
		}
		try {
			return await func(akInfo.userID,params)
		} catch (error) {
			Log.oth.error("system error",error)
			return baseService.errJson(1,"system err")
		}
	})
}

function ConsoleVerifyFunctional(func) {
	return lambdaAsyncService.create(async (params:{ak:string})=>{
		if(!params.ak) {
			return baseService.errJson(99,"")
		}
		let akInfo = await Module_LoginAccessToken.getSingle({
			ak:params.ak,
			target:UserDefine.LoginTarget.Console,
		})
		if(!akInfo) {
			return baseService.errJson(99,"")
		}
		try {
			return await func(akInfo.userID,params)
		} catch (error) {
			Log.oth.error("system error",error)
			return baseService.errJson(1,"system err")
		}
	})
}

let db = DB.get()
function ConsoleVerifyFunctional_Record(func) {
	return lambdaAsyncService.create(async (params:{ak:string})=>{
		if(!params.ak) {
			return baseService.errJson(99,"")
		}
		let akInfo = await Module_LoginAccessToken.getSingle({
			ak:params.ak,
			target:UserDefine.LoginTarget.Console,
		})
		if(!akInfo) {
			return baseService.errJson(99,"")
		}
		
		try {
			let ret = await func(akInfo.userID,params)
			db.insert("t_admin_call_record",{
				adminUserID:akInfo.userID,
				func:func.toString(),
				input:params,
				ret:ret,
				error:null,
				timestamp:kdutils.getMillionSecond(),
				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			})
			return ret 
		} catch (error) {
			Log.oth.error("system error",error)
			db.insert("t_admin_call_record",{
				adminUserID:akInfo.userID,
				func:func.toString(),
				input:params,
				ret:null,
				error:{
					message:error.message,
					stack:error.stack,
				},
				timestamp:kdutils.getMillionSecond(),
				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			})
			return baseService.errJson(1,"system err")
		}
	})
}


export let AKVerifyFuncs = {
	AppVerifyFunctional,

	ConsoleVerifyFunctional,

	ConsoleVerifyFunctional_Filter,

	ConsoleVerifyFunctional_Record,
}