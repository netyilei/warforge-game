import { kdasync } from "kdweb-core/lib/tools/async";
import { GlobalUtils } from "../../src/GlobalUtils";
import { baseService, jsonAsyncService } from "kdweb-core/lib/service/base";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { Module_RegisterAudit, Module_RegisterUpload, Module_TradePassword, Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_UserRelation } from "../../pp-base-define/DM_UserDefine";
import { LeaderHelper } from "../../src/LeaderHelper";
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils";
import { DB } from "../../src/db";
import _ from "underscore";
import { kdmodule } from "kdweb-core/lib/mongo/model";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import md5 = require("md5");
import { UserUtils } from "../../src/UserUtils";


let codeTablename = "t_mail_code"
type tCodeInfo = {
	account:string,
	ip:string,
	code:string,
	register:boolean,
	timestamp:number,
}
const Module_UserCodeInfo = new kdmodule.database<tCodeInfo>({
	db:DB.get(),mainIndexName:"account",useMongoIDForIndex:true,indexes:{account:1},autoCreateIndexes:false,
	tableName:"t_mail_code",
	kvChangeTableName:"t_mail_code_changed"
})
type tCodeToken = {
	account:string,
	code:string,
	token:string,
	timestamp:number,
}
const Module_UserCodeToken = new kdmodule.database<tCodeToken>({
	db:DB.get(),mainIndexName:"account",useMongoIDForIndex:true,indexes:{account:1},autoCreateIndexes:false,
	tableName:"t_mail_code_token",
	kvChangeTableName:"t_mail_code_token_changed"
})
export namespace RegisterService {

	function isMail(str:string) {
		let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(str);
	}
	export class RegisterEntity extends jsonAsyncService {
		async work(params: {
			account:string,
			pwdMD5:string,
			nickName:string,

			countryCode:string, 

			verifyCode:string,

			deviceTag:string,
			channelTag:string,

			leaderTag?:string,	// 推荐码
		}) {
			await kdasync.timeout(1000)	
			if(!params.account || !params.pwdMD5) {
				return baseService.errJson(1,"输入错误")
			}
			if(!isMail(params.account)) {
				return baseService.errJson(1,"请输入正确的邮箱地址")
			}
			let nickName = String(params.nickName || "").trim()
			if(nickName.length < 2) {
				return baseService.errJson(1,"昵称长度过短")
			}
			if(nickName.length > 15) {
				return baseService.errJson(1,"昵称长度过长")
			}
			let codeInfo:tCodeInfo = await Module_UserCodeInfo.getMain(params.account)
			if(!codeInfo || codeInfo.code != params.verifyCode || kdutils.getMillionSecond() - codeInfo.timestamp > 3 * 60 * 1000) {
				return baseService.errJson(1,"验证码不正确")
			}
			let loginConfig = await GlobalUtils.getLoginConfig()
			if(loginConfig.countries && !loginConfig.countries.find(v=>v.code == params.countryCode)) {
				return baseService.errJson(1,"请选择正确的国家代码")
			}
			params.account = String(params.account)
			params.pwdMD5 = String(params.pwdMD5)
			if(params.account.length < 6) {
				return baseService.errJson(1,"账号长度过短")
			}
			if(params.account.length > 256) {
				return baseService.errJson(1,"账号长度过长")
			}
			if(params.pwdMD5.length != 32) {
				return baseService.errJson(1,"密码长度不正确")
			}
			let module = await Module_UserLoginChannel.getLockedSingleData({type:UserDefine.LoginChannel.Account,account:params.account},
				null,"Register",(index)=>{
					return {
						userID:null,
						type:index.type,
						account:index.account,
						pwdMD5:params.pwdMD5,
						openID:null,
						accessToken:null,
					}
				}
			)
			if(!module) {
				return baseService.errJson(1,"操作失败")
			}
			if(module.data.userID) {
				module.release()
				return baseService.errJson(1,"注册失败")
			}
			
			let userID = await IDUtils.getUserID()
			let loginData:UserDefine.tLoginData = {
				userID:userID,
				strUserID:String(userID),
				
				apiID:String(userID),
				countryCode:null,	// 国家代码

				deviceTag:params.deviceTag || "Register",		// 
				channelTag:params.channelTag || "Register",

				regTimestamp:kdutils.getMillionSecond(),
				regDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			}
			let loginRole:UserDefine.tLoginRole = {
				userID,
				targets:[
					{
						target:UserDefine.LoginTarget.App,
						roles:[],
					}
				]
			}
			module.data.userID = userID
			let relation:UserDefine.PromoteRelation = {
				userID,
				level:0,
				performance:"0",
				leaders:[],
				subs:[],
			}
			await Promise.all([
				module.saveAndRelease(),
				Module_UserLoginData.insert(loginData),
				Module_UserLoginRole.updateOrInsert(loginRole),
				Module_UserRelation.insert(relation),
				Module_UserCodeInfo.del({account:params.account}),
			])
			if(params.leaderTag) {
				// todo: 上级绑定
				let leader = await LeaderHelper.getLeaderByTag(params.leaderTag)
				if(leader) {
					await PromoteRelationUtils.setLeader(userID,leader)
				}
			}
			await UserUtils.rebuildSearch(userID)
			return {}
		}
	}
	export class RegisterAuditEntity extends jsonAsyncService {
		async work(params: {
			account:string,
			pwdMD5:string,
			nickName:string,
			phoneNumber:string
			iconUrl?:string,
			tradePWDMD5?:string,

			countryCode:string, 

			verifyCode?:string,
			verifyToken?:string,

			deviceTag:string,
			channelTag:string,

			leaderTag?:string,	// 推荐码

			uploadToken:string,
		}) {
			await kdasync.timeout(1000)	
			if(!params.account || !params.pwdMD5) {
				return baseService.errJson(1,"输入错误")
			}
			if(!isMail(params.account)) {
				return baseService.errJson(1,"请输入正确的邮箱地址")
			}
			// 必须要填写代理
			if(!params.leaderTag) {
				return baseService.errJson(1,"please input code")
			}
			let leader = await LeaderHelper.getLeaderByTag(params.leaderTag)
			if(!leader) {
				return baseService.errJson(1,"code not exist")
			}
			// 
			let audit = await Module_RegisterAudit.getSingle({account:params.account,oper:false,confirm:false})
			if(audit) {
				return baseService.errJson(1,"您的注册申请正在审核中，请勿重复提交")
			}
			let nickName = String(params.nickName || "").trim()
			if(nickName.length < 2) {
				return baseService.errJson(1,"昵称长度过短")
			}
			if(nickName.length > 15) {
				return baseService.errJson(1,"昵称长度过长")
			}
			if(!params.uploadToken) {
				return baseService.errJson(1,"请上传证件照片")
			}
			let upload = await Module_RegisterUpload.getMain(params.uploadToken)
			if(!upload) {
				return baseService.errJson(1,"请上传证件照片")
			}
			if(params.verifyToken) {
				let codeToken = await Module_UserCodeToken.getMain(params.account)
				if(!codeToken || codeToken.token != params.verifyToken) {
					return baseService.errJson(1,"验证码不正确【2】")
				}
			} else if(params.verifyCode) {
				let codeInfo:tCodeInfo = await Module_UserCodeInfo.getMain(params.account)
				if(!codeInfo || codeInfo.code != params.verifyCode || kdutils.getMillionSecond() - codeInfo.timestamp > 3 * 60 * 1000) {
					return baseService.errJson(1,"验证码不正确")
				}
			}
			// let loginConfig = await GlobalUtils.getLoginConfig()
			// if(loginConfig.countries && !loginConfig.countries.find(v=>v.code == params.countryCode)) {
			// 	return baseService.errJson(1,"请选择正确的国家代码")
			// }
			params.account = String(params.account)
			params.pwdMD5 = String(params.pwdMD5)
			if(params.account.length < 6) {
				return baseService.errJson(1,"账号长度过短")
			}
			if(params.account.length > 256) {
				return baseService.errJson(1,"账号长度过长")
			}
			if(params.pwdMD5.length != 32) {
				return baseService.errJson(1,"密码长度不正确")
			}
			let channel = await Module_UserLoginChannel.getSingle({type:UserDefine.LoginChannel.Account,account:params.account})
			if(channel) {
				return baseService.errJson(1,"注册失败")
			}
			
			let userID = await IDUtils.getUserID()
			let loginData:UserDefine.tLoginData = {
				userID:userID,
				strUserID:String(userID),

				nickName:nickName,
				iconUrl:params.iconUrl || "kin://user_head/img_tx_1",
				phoneNumber:params.phoneNumber,
				
				apiID:String(userID),
				countryCode:null,	// 国家代码

				deviceTag:params.deviceTag || "Register",		// 
				channelTag:params.channelTag || "Register",

				regTimestamp:kdutils.getMillionSecond(),
				regDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			}
			channel = {
				userID:userID,
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
						target:UserDefine.LoginTarget.App,
						roles:[],
					}
				]
			}
			let relation:UserDefine.PromoteRelation = {
				userID,
				level:0,
				performance:"0",
				leaders:[],
				subs:[],
			}

			await Module_UserCodeInfo.del({account:params.account})
			await Module_RegisterAudit.insert({
				no:await IDUtils.getRegisterSerialNo(),
				oper:false,
				confirm:false,
				gmUserID:null,
				userID:loginData.userID,
				account:params.account,
				loginData,
				loginChannel:channel,
				loginRole,
				relation,
				uploadToken:params.uploadToken,
				leaderTag:params.leaderTag,
				timestamp:kdutils.getMillionSecond(),
				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			})
			if(params.tradePWDMD5) {
				await Module_TradePassword.updateOrInsert({
					userID,
					pwdMD5:params.tradePWDMD5,
				})
			}
			return {}
		}
	}

	export class VerifyCodeToTokenEntity extends jsonAsyncService {
		async work(params: {
			account:string,
			verifyCode:string,
		}) {
			let module = await Module_UserCodeInfo.searchLockedSingleData(params.account)
			if(!module || module.data.code != params.verifyCode || kdutils.getMillionSecond() - module.data.timestamp > 3 * 60 * 1000) {
				if(module) {
					module.release()
				}
				kdasync.timeout(1000)
				return baseService.errJson(1,"验证码不正确")
			}	
			let token = md5(JSON.stringify(module.data))
			await Module_UserCodeToken.updateOrInsert({
				account:params.account,
				code:params.verifyCode,
				token,
				timestamp:kdutils.getMillionSecond(),
			})
			module.release()
			await Module_UserCodeInfo.del({account:params.account})
			return {
				token,
			}
		}
	}

	export class SendCodeEntity extends jsonAsyncService {
		async work(params: {
			account:string,
			type:0|1|2,
		}) {
			let codeInfo:tCodeInfo = await Module_UserCodeInfo.getMain(params.account)
			if(codeInfo && kdutils.getMillionSecond() - codeInfo.timestamp < 60 * 1000) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"请勿频繁发送验证码")
			}
			codeInfo = {
				account:params.account,
				ip:this.currentReq.ip,
				code:_.shuffle("0123456789").slice(0,6).join(""),
				register:params.type === 0,
				timestamp:kdutils.getMillionSecond(),
			}
			await Module_UserCodeInfo.updateOrInsert(codeInfo)
			Rpc.center.call(kds.sys.email.sendEmailCode,
				params.account,
				codeInfo.code,
				params.type === 0 ? "register" : (
					params.type === 1 ? "changePassword" : (
						params.type === 2 ? "tradePassword" : null
					))
			)
			return {
				// code:codeInfo.code,
			}
		}
	}

	export class ChangePasswwordEntity extends jsonAsyncService {
		async work(params: {
			account:string,
			newPwdMD5:string,
			verifyCode:string,
		}) {
			if(!params.account || !params.newPwdMD5) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"输入错误")
			}
			if(!isMail(params.account)) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"请输入正确的邮箱地址")
			}
			let codeInfo:tCodeInfo = await Module_UserCodeInfo.getMain(params.account)
			if(!codeInfo || codeInfo.code != params.verifyCode || kdutils.getMillionSecond() - codeInfo.timestamp > 3 * 60 * 1000) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"验证码不正确")
			}
			let module = await Module_UserLoginChannel.getLockedSingleData({type:UserDefine.LoginChannel.Account,account:params.account},
				null,"ChangePassword",null
			)
			if(!module || !module.data.userID) {
				if(module) {
					module.release()
				}
				kdasync.timeout(1000)
				return baseService.errJson(1,"操作失败")
			}
			module.data.pwdMD5 = params.newPwdMD5
			await Promise.all([
				module.saveAndRelease(),
				Module_UserCodeInfo.del({account:params.account}),
			])
			return {}
		}
	}
	export class ChangeTradePasswwordEntity extends jsonAsyncService {
		async work(params: {
			account:string,
			newPwdMD5:string,
			verifyCode:string,
		}) {
			if(!params.account || !params.newPwdMD5) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"输入错误")
			}
			if(!isMail(params.account)) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"请输入正确的邮箱地址")
			}
			let codeInfo:tCodeInfo = await Module_UserCodeInfo.getMain(params.account)
			if(!codeInfo || codeInfo.code != params.verifyCode || kdutils.getMillionSecond() - codeInfo.timestamp > 3 * 60 * 1000) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"验证码不正确")
			}
			let channel = await Module_UserLoginChannel.getSingle({type:UserDefine.LoginChannel.Account,account:params.account})
			if(!channel || !channel.userID) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"操作失败")
			}
			let module = await Module_TradePassword.getLockedSingleData({userID:channel.userID},
				null,"ChangeTradePassword",null
			)
			if(!module) {
				kdasync.timeout(1000)
				return baseService.errJson(1,"操作失败")
			}
			module.data.pwdMD5 = params.newPwdMD5
			await Promise.all([
				module.saveAndRelease(),
				Module_UserCodeInfo.del({account:params.account}),
			])
			return {}
		}
	}
}