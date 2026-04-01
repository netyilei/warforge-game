// import { baseService } from "kdweb-core/lib/service/base"
// import { kdasync } from "kdweb-core/lib/tools/async"
// import { kdutils } from "kdweb-core/lib/utils"
// import { KVDefine } from "../../pp-base-define/KVDefine"
// import { MQDefine, MQTopic } from "../../pp-base-define/MQDefine"
// import { UserDefine } from "../../pp-base-define/UserDefine"
// import { UserErrorCode } from "../../pp-base-define/UserErrorCode"
// import { UserFlagDefine } from "../../pp-base-define/UserFlag"
// import { LoginHeler } from "../helper/loginHelper"
// import { Log } from "../log"
// import { Rpc } from "../rpc"
// import { DBDefine } from "../../pp-base-define/DBDefine"
// import { DB } from "../../src/db"
// import { UserFlag } from "../../src/UserFlag"
// import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods"
// import { SrsDefine } from "../../pp-base-define/SrsDefine"
// import { UserAccess } from "../../src/UserAccess"
// import { LeaderHelper } from "../../src/LeaderHelper"
// import { PromoteRelationUtils } from "../../src/PromoteRelationUtils"
// import { ethers } from "ethers";


// let db = DB.get()
// export namespace FastLoginServices {
// 	export async function walletLogin(params: {
// 		nickName?: string,
// 		iconUrl?: string,
// 		sex?: number,
// 		company?: boolean,
		
// 		sign:string,		// 签名后
// 		message:string,		// 签名前

// 		address:string,
// 		chainID:number,
// 		openID:string,

// 		apiPrefix:string,

// 		deviceType:UserDefine.LoginDeviceType,
// 		accountType:UserDefine.AccountType,
// 		channel?:string,

// 		leaderTag?:string,
// 	}) {
// 		Log.oth.info('login:::::::');
// 		Log.oth.info(params);
		
// 		if(params.address) {
// 			params.address = params.address.toLowerCase()
// 		}
// 		// check address 
// 		const prefix = `\x19Ethereum Signed Message:\n${params.message.length}`;
// 		const prefixedMessage = `${prefix}${params.message}`;

// 		// 对消息进行哈希处理
// 		const messageHash = ethers.hashMessage(prefixedMessage);

// 		// 恢复签名者的地址
// 		const signer = ethers.verifyMessage(prefixedMessage, params.sign);

// 		// 检查恢复的地址是否与提供的地址匹配
// 		console.log(`Recovered address: ${signer}`);
// 		let isValid = signer.toLowerCase() === params.address.toLowerCase();
// 		Log.oth.info("signed ",{
// 			message:params.message,sign:params.sign,signer,isValid
// 		})
// 		if(!isValid) {
// 			return baseService.errJson(1,"验证失败")
// 		}

// 		let ret = await loginBind({
// 			nickName:params.nickName,
// 			iconUrl:params.iconUrl,
// 			sex:params.sex,

// 			company: !!params.company,

// 			bindType: UserDefine.Bind.H5Public,
// 			bindStr: "Chain:" + params.chainID + "|Addr:" + params.address,
// 			accountType: params.accountType,
// 			deviceType: params.deviceType,
// 			apiPrefix: params.apiPrefix,

			
// 			address:params.address,
// 			chainID:params.chainID,
// 			openID: params.openID,

// 			leaderTag:params.leaderTag
// 		})
// 		return ret
// 	}

// 	export async function guestLogin(params:{
// 		nickName?: string,
// 		iconUrl?: string,
// 		sex?: number,
// 		company?: boolean,

// 		phoneNumber?: string,

// 		guestStr?: string,
		
// 		accountType: UserDefine.AccountType,
// 		deviceType: UserDefine.LoginDeviceType,

// 		apiPrefix: string,

// 		leaderTag?:string,
// 	}) {
// 		params.guestStr = params.guestStr.trim()
// 		params.nickName = params.nickName || "Guest_" + params.guestStr
// 		let ret = await loginBind({
// 			nickName:params.nickName,
// 			iconUrl:params.iconUrl,
// 			sex:params.sex,

// 			company: !!params.company,

// 			bindType: UserDefine.Bind.H5Public,
// 			bindStr: "GUEST_" + params.guestStr,
// 			accountType: params.accountType,
// 			deviceType: params.deviceType,
// 			apiPrefix: params.apiPrefix,

			
// 			address:null,
// 			chainID:null,
// 			openID:null,

// 			guest:true,

// 			leaderTag:params.leaderTag
// 		})
// 		return ret 
// 	}


// 	export async function loginBind(params: {
// 		nickName?: string,
// 		iconUrl?: string,
// 		sex?: number,
// 		company?: boolean,

// 		phoneNumber?: string,

// 		bindType: string,
// 		bindStr: string,

// 		account?:string,
// 		pwdMD5?:string,

// 		accountType: UserDefine.AccountType,
// 		deviceType: UserDefine.LoginDeviceType,
// 		channel?: string,

// 		apiPrefix?: string,

// 		address?:string,
// 		chainID?:number,
// 		openID?: string,

// 		guest?:boolean,

// 		leaderTag?:string,
// 	}) {
// 		Log.oth.info('bindLogin');
// 		Log.oth.info(params);
// 		let userID = await Rpc.center.callException("kds.sys.user.bind.get", params.bindType, params.bindStr)
// 		let loginData: UserDefine.tLoginData
// 		if (userID) {
// 			loginData = await db.getSingle(DBDefine.tableUserLoginData,{userID:userID})
// 		}
// 		let isNewUser = false
// 		if (loginData == null) {
// 			if(!params.guest && !params.address) {
// 				return baseService.errJson(1,"登录失败")
// 			}
// 			isNewUser = true
// 			let time = kdutils.getMillionSecond()
// 			if (params.nickName == null) {
// 				let guestID = await LoginHeler.getNewGuestID()
// 				if (guestID == null) {
// 					return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取ID")
// 				}

// 				params.nickName = "Guest" + guestID
// 				params.sex = 0
// 				params.iconUrl = "NULL"
// 			}
// 			userID = userID || await LoginHeler.getNewUserID()
// 			if (params.iconUrl) {
// 				// params.iconUrl = await Rpc.center.callException("kds.oss.icon.upload", null, userID, params.iconUrl)
// 			}
// 			let apiID = params.apiPrefix + "BIND:" + params.bindType + "|" + params.bindStr
// 			loginData = {
// 				apiID: apiID,
// 				areaID: null,

// 				openID: params.openID,

// 				userID: userID,
// 				strUserID:String(userID),
// 				sk: await UserAccess.createSK(apiID),

// 				nickName: params.nickName,
// 				sex: params.sex,
// 				iconUrl: params.iconUrl,

// 				account: null,
// 				phoneNumber: params.phoneNumber,

// 				deviceType: params.deviceType || UserDefine.LoginDeviceType.Win32,
// 				accountType: params.accountType || UserDefine.AccountType.Bind,
// 				channel:params.channel, 


// 				address:params.address,
// 				chainID:params.chainID,

// 				pwdMD5: null,
// 				regTimestamp: time,
// 				regDate: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time),
// 			}
// 			await db.insert(DBDefine.tableUserLoginData,loginData)
// 			await Rpc.center.callException("kds.sys.user.bind.set", userID, params.bindType, params.bindStr)
			
// 			let relation:UserDefine.PromoteRelation = {
// 				userID,
// 				level:0,
// 				performance:"0",
// 				leaders:[],
// 				subs:[],
// 			}
// 			await db.insert(DBDefine.tablePromoteRelation,relation)
// 			let leader = params.leaderTag ? await LeaderHelper.getLeaderByTag(params.leaderTag) : null
// 			if(params.leaderTag) {
// 				Log.oth.info("get leader = " + leader + " from tag = " + params.leaderTag)
// 			}
// 			if(leader) {
// 				await PromoteRelationUtils.setLeader(userID,leader)
// 			}
// 		} else {
// 			if (params.iconUrl) {
// 				// params.iconUrl = await Rpc.center.callException("kds.oss.icon.upload", null, userID, params.iconUrl)
// 			}
// 			let changed = false
// 			if (loginData.nickName == null) {
// 				changed = true
// 				let guestID = await LoginHeler.getNewGuestID()
// 				if (guestID == null) {
// 					return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取ID")
// 				}

// 				loginData.nickName = "Guest" + guestID
// 				loginData.sex = 0
// 				loginData.iconUrl = "NULL"
// 			}

// 			let keys = ["nickName", "iconUrl", "openID", "phoneNumber","deviceType","chainID"]
// 			for (let key of keys) {
// 				let v = params[key]
// 				if (v != null && v != "NULL" && v != loginData[key]) {
// 					loginData[key] = v
// 					changed = true
// 				}
// 			}
// 			if (changed) {
// 				await db.update(DBDefine.tableUserLoginData,{userID:loginData.userID},loginData)
// 			}
// 		}

// 		let srsHost = await Rpc.center.callException(SrsRpcMethods.LayerCenter.selectSrsHost,SrsDefine.NodeType.User)
// 		if(!srsHost) {
// 			return baseService.errJson(1,"网关服务获取失败")
// 		}
// 		if (srsHost == null) {
// 			return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取网关服务，请稍后再试")
// 		}
// 		let lobbyHost = LoginHeler.selectLobbyService()
// 		if (lobbyHost == null) {
// 			return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取大厅服务，请稍后再试")
// 		}
// 		let time = kdutils.getMillionSecond()
// 		db.insert(DBDefine.tableLoginRecord,{
// 			userID:loginData.userID,
// 			ip:"0.0.0.0",
// 			timestamp:time,
// 			date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
// 		})
// 		let ak = await UserAccess.createAK(loginData.userID,loginData.sk)

// 		// let lobbyRes = await Rpc.center.callException("kds.lobby.userLogin", loginData.userID)
// 		// if (lobbyRes == null || lobbyRes.errCode) {
// 		// 	return baseService.errJson(UserErrorCode.ErrorLogin, "大厅登录失败")
// 		// }
// 		await UserFlag.set(loginData.userID, UserFlagDefine.LoginTime, kdutils.getMillionSecond())
// 		return {
// 			accessToken: ak,
// 			loginData: LoginHeler.getUserLoginData(loginData),
// 			lobbyHost: lobbyHost,
// 			srsHost: srsHost,
// 			isNewUser: isNewUser,

// 			leaderTag:await LeaderHelper.createTag(loginData.userID),
// 		}
// 	}

// 	let regexAccount = /^[a-zA-Z\d]{6,30}$/
// 	export async function register(params:{
// 		account:string,
// 		pwdMD5:string,

// 		nickName?:string,
// 		sex?:number,
// 		iconUrl?:string,
		
// 		accountType: UserDefine.AccountType,
// 		deviceType: UserDefine.LoginDeviceType,

// 		apiPrefix: string,
// 		channel?:string,

// 		leaderTag?:string,
// 	}) {
// 		if(!params.account || !regexAccount.test(params.account) || !params.pwdMD5) {
// 			return baseService.errJson(1,"输入错误")
// 		}
// 		let loginData:UserDefine.tLoginData = await db.getSingle(DBDefine.tableUserLoginData,{account:params.account})
// 		if(loginData) {
// 			return baseService.errJson(1,"输入不正确")
// 		}

// 		let time = kdutils.getMillionSecond()
// 		if (params.nickName == null) {
// 			let guestID = await LoginHeler.getNewGuestID()
// 			if (guestID == null) {
// 				return baseService.errJson(UserErrorCode.ErrorLogin, "无法获取ID")
// 			}

// 			params.nickName = "用户" + guestID
// 			params.sex = 0
// 			params.iconUrl = "NULL"
// 		}
		
// 		if(typeof(params.leaderTag) != "string") {
// 			params.leaderTag = null 
// 		}
// 		let leader = params.leaderTag ? await LeaderHelper.getLeaderByTag(params.leaderTag) : null

// 		let userID = await LoginHeler.getNewUserID()
// 		if (params.iconUrl) {
// 			// params.iconUrl = await Rpc.center.callException("kds.oss.icon.upload", null, userID, params.iconUrl)
// 		}
// 		let bindType = UserDefine.Bind.H5Account
// 		let bindStr = params.account
// 		let apiID = params.apiPrefix + "BIND:" + bindType + "|" + bindStr
// 		loginData = {
// 			apiID: apiID,
// 			areaID: null,

// 			openID: null,

// 			userID: userID,
// 			strUserID:String(userID),
// 			sk: await UserAccess.createSK(apiID),

// 			nickName: params.nickName,
// 			sex: params.sex,
// 			iconUrl: params.iconUrl,

// 			account: params.account,
// 			pwdMD5:params.pwdMD5,
// 			phoneNumber: null,

// 			deviceType: params.deviceType || UserDefine.LoginDeviceType.Win32,
// 			accountType: params.accountType || UserDefine.AccountType.Bind,
// 			channel:params.channel, 

// 			address:null,
// 			chainID:null,

// 			regTimestamp: time,
// 			regDate: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time),
// 		}
// 		await db.insert(DBDefine.tableUserLoginData,loginData)
// 		await Rpc.center.callException("kds.sys.user.bind.set", userID, bindType, bindStr)
		
// 		let relation:UserDefine.PromoteRelation = {
// 			userID,
// 			level:0,
// 			performance:"0",
// 			leaders:[],
// 			subs:[],
// 		}
// 		await db.insert(DBDefine.tablePromoteRelation,relation)
// 		if(leader) {
// 			await PromoteRelationUtils.setLeader(userID,leader)
// 		}

// 		return {}
// 	}
	
// 	export async function loginAccount(params:{
// 		account:string,
// 		pwdMD5:string,
		
// 		accountType: UserDefine.AccountType,
// 		deviceType: UserDefine.LoginDeviceType,
// 		channel?: string,
// 	}) {
// 		if(!params.account || !regexAccount.test(params.account) || !params.pwdMD5) {
// 			return baseService.errJson(1,"输入错误")
// 		}
// 		let loginData:UserDefine.tLoginData = await db.getSingle(DBDefine.tableUserLoginData,{account:params.account})
// 		if(!loginData || loginData.pwdMD5 != params.pwdMD5) {
// 			return baseService.errJson(1,"输入不正确")
// 		}
// 		return await loginBind({
// 			account:params.account,
// 			pwdMD5:params.pwdMD5,

// 			accountType:params.accountType,
// 			deviceType:params.deviceType,
// 			channel:params.channel, 

// 			bindType:UserDefine.Bind.H5Account,
// 			bindStr:params.account,
// 		})
// 	}
// }
