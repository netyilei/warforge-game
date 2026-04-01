import { baseService } from "kdweb-core/lib/service/base";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { GlobalUtils } from "../../src/GlobalUtils";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import md5 = require("md5")
import { knServiceCrypto } from "../../src/knServiceCrypto";
import { Rpc } from "../rpc";
import { Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_LoginAccessToken } from "../../pp-base-define/DM_UserDefine";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { UserErrorCode } from "../../pp-base-define/UserErrorCode";
import { LoginHeler } from "../helper/loginHelper";
import { kds } from "../../pp-base-define/GlobalMethods";
import { CustomerDefine } from "../../pp-base-define/CustomerDefine";
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils";
import { LeaderHelper } from "../../src/LeaderHelper";
import { UserUtils } from "../../src/UserUtils";

export namespace LoginService {
	export async function loginApp(params:{
		channel:UserDefine.LoginChannel,
		channelContent?:string,
		account?:string,
		pwdMD5?:string,

		nickName?:string,

		leaderTag?:string,
	}) {
		let loginData:UserDefine.tLoginData
		let loginChannel:UserDefine.tLoginChannel
		let clearAKCache = true 
		let config = await GlobalUtils.getLoginConfig()
		if(false && config) {
			let info = config.loginChannels.find(v=>v.type == params.channel)
			if(!info || !info.enabled) {
				return baseService.errJson(1,"不支持的登录")
			}
		}
		switch(params.channel) {
			case UserDefine.LoginChannel.Guest:{
				if(!params.channelContent) {
					return baseService.errJson(1,"参数不正确")
				}
				params.channelContent = String(params.channelContent)
				loginChannel = await Module_UserLoginChannel.getSingle({type:params.channel,openID:params.channelContent})
				if(!loginChannel) {
					let userID = await IDUtils.getUserID()
					loginChannel = {
						userID,
						type:params.channel,
						openID:params.channelContent
					}
					loginData = {
						userID,
						strUserID:String(userID),

						apiID:String(userID),
						countryCode:"86",	// 国家代码

						deviceTag:"string",		// 
						channelTag:"string",

						nickName:params.nickName || `游客${userID}`,

						regTimestamp:kdutils.getMillionSecond(),
						regDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					}
					await Module_UserLoginChannel.insert(loginChannel)
					await Module_UserLoginData.insert(loginData)

					let relation:UserDefine.PromoteRelation = {
						userID:userID,
						level:0,
						leaders:[],
						subs:[],
					}
					await PromoteRelationUtils.saveRelation(relation)
					await UserUtils.rebuildSearch(userID)
				} else {
					loginData = await Module_UserLoginData.getMain(loginChannel.userID)
				}
			} break 
			case UserDefine.LoginChannel.Account:{
				loginChannel = await Module_UserLoginChannel.getSingle({
					type:params.channel,
					account:params.account,
					pwdMD5:params.pwdMD5,
				})
				if(!loginChannel) {
					return baseService.errJson(1,"登录失败")
				}
				let role = await Module_UserLoginRole.getMain(loginChannel.userID)
				// if(!role || !role.targets.find(v=>v.target == UserDefine.LoginTarget.App)) {
				// 	return baseService.errJson(1,"登录失败")
				// }
				loginData = await Module_UserLoginData.getMain(loginChannel.userID)
			} break 
			case UserDefine.LoginChannel.Email:{

			} break 
			case UserDefine.LoginChannel.Phone:{

			} break 
			case UserDefine.LoginChannel.Wechat:{

			} break 
		}	
		if(!loginData || !loginChannel) {
			return baseService.errJson(1,"登录失败")
		}
		if(loginData.disabled) {
			return baseService.errJson(1,"账号被锁定")
		}
		let clearAllCache = false 
		if(config && config.limitOnlineCount && config.limitOnlineCount > 0) {
			let count = await Module_LoginAccessToken.getCount({userID:loginData.userID,target:UserDefine.LoginTarget.App})
			if(count >= config.limitOnlineCount) {
				await Module_LoginAccessToken.delMany({userID:loginData.userID,target:UserDefine.LoginTarget})
				clearAllCache = true 
			}
		}
		if(!clearAllCache) {
			if(clearAKCache) {
				await Module_LoginAccessToken.delMany({userID:loginData.userID,type:params.channel,target:UserDefine.LoginTarget.App})
			}
		}
		let akInfo:UserDefine.tLoginAccessToken = {
			userID:loginData.userID,
			type:params.channel,
			target:UserDefine.LoginTarget.App,
			ak:knServiceCrypto.createSimpleAK(loginChannel.userID,UserDefine.LoginTarget.App),
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		}
		await Module_LoginAccessToken.updateOrInsert({
			userID:loginData.userID,target:UserDefine.LoginTarget.App,type:params.channel
		},akInfo)

		if(params.leaderTag) {
			let leaderUserID = await LeaderHelper.getLeaderByTag(params.leaderTag)
			if(leaderUserID && leaderUserID != loginData.userID) {
				await PromoteRelationUtils.setLeader(loginData.userID,leaderUserID)
				await UserUtils.rebuildSearch(loginData.userID)
			}
		}
		return await afterLogin(loginData,loginChannel,akInfo)
	}

	export async function loginConsole(params:{
		channel:UserDefine.LoginChannel,
		account?:string,
		pwdMD5?:string,
	}) {
		let loginData:UserDefine.tLoginData
		let loginChannel:UserDefine.tLoginChannel
		let clearAKCache = true 
		switch(params.channel) {
			case UserDefine.LoginChannel.Account:{
				loginChannel = await Module_UserLoginChannel.getSingle({
					type:params.channel,
					account:params.account,
					pwdMD5:params.pwdMD5,
				})
				if(!loginChannel) {
					return baseService.errJson(1,"登录失败")
				}
				let role = await Module_UserLoginRole.getMain(loginChannel.userID)
				if(!role || !role.targets.find(v=>v.target == UserDefine.LoginTarget.Console)) {
					return baseService.errJson(1,"登录失败")
				}
				loginData = await Module_UserLoginData.getMain(loginChannel.userID)
			} break 
		}	
		if(!loginData || !loginChannel) {
			return baseService.errJson(1,"登录失败")
		}
		await Module_LoginAccessToken.delMany({userID:loginData.userID,type:params.channel,target:UserDefine.LoginTarget.Console})
		let akInfo:UserDefine.tLoginAccessToken = {
			userID:loginData.userID,
			type:params.channel,
			target:UserDefine.LoginTarget.Console,
			ak:knServiceCrypto.createSimpleAK(loginChannel.userID,UserDefine.LoginTarget.Console),
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		}
		await Module_LoginAccessToken.updateOrInsert({
			userID:loginData.userID,target:UserDefine.LoginTarget.Console,type:params.channel
		},akInfo)

		return await afterLogin(loginData,loginChannel,akInfo)
	}
	
	export async function loginLeaderProxy(params:{
		channel:UserDefine.LoginChannel,
		account?:string,
		pwdMD5?:string,
	}) {
		let loginData:UserDefine.tLoginData
		let loginChannel:UserDefine.tLoginChannel
		let clearAKCache = true 
		switch(params.channel) {
			case UserDefine.LoginChannel.Account:{
				loginChannel = await Module_UserLoginChannel.getSingle({
					type:params.channel,
					account:params.account,
					pwdMD5:params.pwdMD5,
				})
				if(!loginChannel) {
					return baseService.errJson(1,"登录失败")
				}
				let role = await Module_UserLoginRole.getMain(loginChannel.userID)
				if(!role || !role.targets.find(v=>v.target == UserDefine.LoginTarget.Console)) {
					return baseService.errJson(1,"登录失败")
				}
				loginData = await Module_UserLoginData.getMain(loginChannel.userID)
			} break 
		}	
		if(!loginData || !loginChannel) {
			return baseService.errJson(1,"登录失败")
		}
		let loginRole = await Module_UserLoginRole.getMain(loginData.userID)
		if(!loginRole) {
			return baseService.errJson(1,"没有权限登录")
		}
		let target = loginRole.targets.find(v=>v.target == UserDefine.LoginTarget.Console)
		if(!target) {
			return baseService.errJson(1,"权限不足")
		}
		let targetRole = target.roles.find(v=>v == UserDefine.RoleType.LeaderProxy || v == UserDefine.RoleType.Admin)
		if(!targetRole) {
			return baseService.errJson(1,"权限不足")
		}
		
		await Module_LoginAccessToken.delMany({userID:loginData.userID,type:params.channel,target:UserDefine.LoginTarget.Console})
		let akInfo:UserDefine.tLoginAccessToken = {
			userID:loginData.userID,
			type:params.channel,
			target:UserDefine.LoginTarget.Console,
			ak:knServiceCrypto.createSimpleAK(loginChannel.userID,UserDefine.LoginTarget.Console),
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		}
		await Module_LoginAccessToken.updateOrInsert({
			userID:loginData.userID,target:UserDefine.LoginTarget.Console,type:params.channel
		},akInfo)

		return await afterLogin(loginData,loginChannel,akInfo)
	}
	
	export async function afterLogin(loginData:UserDefine.tLoginData,loginChannel:UserDefine.tLoginChannel,akInfo:UserDefine.tLoginAccessToken) {
		// let userInfo = await Module_UserInfo.getMain(loginData.userID)
		// if(!userInfo) {
		// 	userInfo = {
		// 		userID:loginData.userID,
		// 		nickName:"无名",
		// 		countryCode:loginData.countryCode,		// 国家代码
		// 		phoneNumber:null,	
		// 		email:null,
		// 	}
		// 	Module_UserInfo.updateOrInsert(userInfo)
		// }
		// let account = await Module_UserAccount.getMain(loginData.userID)
		// if(!account) {
		// 	account = {
		// 		userID:loginData.userID,
		// 		values:[]
		// 	}
		// 	Module_UserAccount.updateOrInsert(account)
		// }
		delete loginChannel.pwdMD5
		let role = await Module_UserLoginRole.getMain(loginData.userID)
		let roleTarget = role?.targets?.find(v=>v.target == akInfo.target)
		let customerHosts:CustomerDefine.tRpcGetChatHostRes 
			= await Rpc.center.callException(kds.customer.getHost)
		if(akInfo.target == UserDefine.LoginTarget.App) {
			let srsHost = await Rpc.center.callException(SrsRpcMethods.LayerCenter.selectSrsHost,SrsDefine.NodeType.User)
			if(!srsHost) {
				return baseService.errJson(1,"网关服务获取失败")
			}
			if (srsHost == null) {
				return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取网关服务，请稍后再试")
			}
			let lobbyHost = LoginHeler.selectLobbyService()
			if (lobbyHost == null) {
				return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取大厅服务，请稍后再试")
			}
			let leaderTag = await LeaderHelper.createTag(loginData.userID)
			return {
				ak:akInfo.ak,
				loginData,
				roleTarget,
				loginChannel,
				// 客户端服务接口
				lobbyHost:lobbyHost,
				srsHost:srsHost,

				leaderTag,
				customerHost:customerHosts.httpHost,
				customerWSHost:customerHosts.wsHost,

				config:await GlobalUtils.getMain(),
			}
		}
		return {
			ak:akInfo.ak,

			loginData,
			roleTarget,
			loginChannel,
			customerHost:customerHosts.httpHost,
			customerWSHost:customerHosts.wsHost,
		}
	}
}