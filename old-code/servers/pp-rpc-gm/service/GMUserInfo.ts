import { baseService } from "kdweb-core/lib/service/base";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { UserUtils } from "../../src/UserUtils";
import { Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_UserRelation } from "../../pp-base-define/DM_UserDefine";
import _ from "underscore";
import { Log } from "../log";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";


export namespace GMUserInfoService {
	// 更改用户可以登录的平台 App或者后台
	export async function changeUserLoginTarget(userID:number,params:{
		userID:number,
		target:UserDefine.LoginTarget,
		b:boolean,	// true - 添加 false - 删除
	}) {
		switch(params.target) {
			case UserDefine.LoginTarget.App:{
				if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserAppRole)) {
					return baseService.errJson(1,"权限不足")
				}
			} break 
			case UserDefine.LoginTarget.Console:{
				if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserConsoleRole)) {
					return baseService.errJson(1,"权限不足")
				}
			} break 
			default:
				return baseService.errJson(1,"参数错误")
		}
		let data = await Module_UserLoginRole.searchLockedSingleData(params.userID,null,"GM:" + userID,(userID)=>{
			return <UserDefine.tLoginRole>{
				userID,
				targets:[],
			}
		})
		if(!data) {
			return baseService.errJson(1,"数据初始化失败")
		}
		if(params.target == UserDefine.LoginTarget.Console) {
			if(data.data.targets.find(v=>v.target == params.target)?.roles?.includes(UserDefine.RoleType.Admin)) {
				return baseService.errJson(1,"无法修改超管的权限")
			}
		}
		try {
			do {
				if(params.b) {
					if(data.data.targets.find(v=>v.target == params.target)) {
						break 
					}
					data.data.targets.push({
						target:params.target,
						roles:[],
					})
				} else {
					let idx = data.data.targets.findIndex(v=>v.target == params.target)
					if(idx < 0) {
						break 
					}
					data.data.targets.splice(idx,1)
				}
				await data.saveAndRelease()
				await UserUtils.rebuildSearch(data.data.userID)
			} while (false);
		} catch (error) {
			Log.oth.error("change login target error",params,error)
		} finally {
			await data.release()
		}
		return {
			loginRole:data.data
		}
	}

	// 更改用户在某个登录平台的权限
	export async function changeUserTargetRole(userID:number,params:{
		userID:number,
		target:UserDefine.LoginTarget,
		role:UserDefine.RoleType,
		b:boolean,	// true - 添加 false - 删除
	}) {
		if(params.role == UserDefine.RoleType.Admin) {
			return baseService.errJson(1,"无法操作超管权限")
		}
		switch(params.target) {
			case UserDefine.LoginTarget.App:{
				if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserAppRole)) {
					return baseService.errJson(1,"权限不足")
				}
			} break 
			case UserDefine.LoginTarget.Console:{
				if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserConsoleRole)) {
					return baseService.errJson(1,"权限不足")
				}
			} break 
			default:
				return baseService.errJson(1,"参数错误")
		}
		let data = await Module_UserLoginRole.searchLockedSingleData(params.userID,null,"GM:" + userID,(userID)=>{
			return <UserDefine.tLoginRole>{
				userID,
				targets:[],
			}
		})
		if(!data) {
			return baseService.errJson(1,"数据初始化失败")
		}
		let targetInfo = data.data.targets.find(v=>v.target == params.target)
		if(!targetInfo) {
			await data.release()
			return baseService.errJson(1,"用户没有登录权限")
		}
		try {
			do {
				if(params.b) {
					if(targetInfo.roles.includes(params.role)) {
						break 
					}
					targetInfo.roles.push(params.role)
				} else {
					let idx = targetInfo.roles.indexOf(params.role)
					if(idx < 0) {
						break 
					}
					targetInfo.roles.splice(idx,1)
				}
				await data.saveAndRelease()
				await UserUtils.rebuildSearch(data.data.userID)
			} while (false);
		} catch (error) {
			Log.oth.error("change login target role error",params,error)
		} finally {
			await data.release()
		}
		return {
			loginRole:data.data
		}
	}

	// 创建账户
	export async function createAccountChannel(userID:number,params:{
		account:string,
		nickName:string,
		pwdMD5:string,
		target:UserDefine.LoginTarget,
		role?:UserDefine.RoleType,	// 创建时直接赋予的权限
	}) {
		if(!params.account) {
			return baseService.errJson(1,"请输入账号")
		}
		params.account = String(params.account)
		if(params.account.length < 6) {
			return baseService.errJson(1,"账户长度不能小于6")
		}
		switch(params.target) {
			case UserDefine.LoginTarget.App:{
				if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserAppRole)) {
					return baseService.errJson(1,"权限不足")
				}
			} break 
			case UserDefine.LoginTarget.Console:{
				if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserConsoleRole)) {
					return baseService.errJson(1,"权限不足")
				}
			} break 
			default:
				return baseService.errJson(1,"参数错误")
		}
		let channel = await Module_UserLoginChannel.getSingle({account:params.account})
		if(channel) {
			return baseService.errJson(1,"用户已经存在")
		}

		{
			let userID = await IDUtils.getUserID()
			let loginData:UserDefine.tLoginData = {
				userID:userID,
				strUserID:String(userID),

				nickName:params.nickName || "用户" + userID,

				apiID:String(userID),
				countryCode:null,	// 国家代码

				deviceTag:"Server",		// 
				channelTag:"Server",

				regTimestamp:kdutils.getMillionSecond(),
				regDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			}
			channel = {
				userID,
				type:UserDefine.LoginChannel.Account,
				account:params.account,
				pwdMD5:params.pwdMD5,
				openID:null,
				accessToken:null,
			}
			let loginRole:UserDefine.tLoginRole = {
				userID,
				targets:[
					{
						target:params.target,
						roles:params.role ? [params.role] : [],
					}
				]
			}
			let relation:UserDefine.PromoteRelation = {
				userID:userID,
				level:0,
				leaders:[],
				subs:[],
			}
			await Promise.all([
				Module_UserLoginData.updateOrInsert(loginData),
				Module_UserLoginChannel.updateOrInsert(channel),
				Module_UserLoginRole.updateOrInsert(loginRole),
				Module_UserRelation.updateOrInsert(relation),
			])
			await UserUtils.rebuildSearch(loginData.userID)
			return {
				loginData,
			}
		}
	}
	// 修改密码
	export async function changePWD(userID:number,params:{
		userID:number,
		pwdMD5:string,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Admin)) {
			return baseService.errJson(1,"权限不足")
		}
		let data = await Module_UserLoginChannel.getWithLockSingleData({
			userID:params.userID
		},null,"GM:" + userID)
		if(!data) {
			return baseService.errJson(1,"数据不存在")
		}
		await data.lock()
		data.data.pwdMD5 = params.pwdMD5
		await data.saveAndRelease()
		return {}
	}
}