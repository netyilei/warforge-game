import { CoreFunctionals } from "../core/CoreFunctionals"
import { GlobalConfig } from "../ServerDefines/GlobalConfig"
import { UserDefine } from "../ServerDefines/UserDefine"

export namespace ReqLogin {

	export let loginApp = CoreFunctionals.req<tLoginAppReq,tLoginAppRes>("login/account")
	export type tLoginAppReq = {
		channel:UserDefine.LoginChannel,
		channelContent?:string,
		account?:string,
		pwdMD5?:string,

		nickName?:string,
		leaderTag?:string,
	}
	export type tLoginAppRes = {
		errCode?:number,
		errMsg?:string,

		
		ak:string,
		loginData:UserDefine.tLoginData,
		roleTarget:UserDefine.tLoginRole["targets"][0],
		loginChannel:UserDefine.tLoginChannel,
		// 客户端服务接口
		lobbyHost:string,
		srsHost:string,
		customerHost:string,
		customerWSHost:string,

		leaderTag:string,

		config:GlobalConfig.tMain,
	}

	export let register = CoreFunctionals.req<tRegisterReq,tRegisterRes>("register")
	export type tRegisterReq = {
		account:string,
		pwdMD5:string,
		nickName:string,
		phoneNumber:string
		iconUrl?:string,
		tradePWDMD5?:string,

		countryCode:string, 

		verifyCode:string,
		verifyToken?:string,

		deviceTag:string,
		channelTag:string,

		leaderTag?:string,	// 推荐码

		uploadToken?:string,
	}
	export type tRegisterRes = {
		errCode?:number,
		errMsg?:string,
	}

	export let registerUploadPath = "upload/register"
	export let registerUploadTag = "idcard"
	export type tRegisterUploadRes = {
		errCode?:number,
		errMsg?:string,

		token:string,
	}

	export let changePassword = CoreFunctionals.req<tChangePasswordReq,tChangePasswordRes>("changepwd")
	export type tChangePasswordReq = {
		account:string,
		newPwdMD5:string,
		verifyCode:string,
	}
	export type tChangePasswordRes = {
		errCode?:number,
		errMsg?:string,
	}

	export let changeTradePassword = CoreFunctionals.req<tChangeTradePasswordReq,tChangeTradePasswordRes>("changetradepwd")
	export type tChangeTradePasswordReq = {
		account:string,
		newPwdMD5:string,
		verifyCode:string,
	}
	export type tChangeTradePasswordRes = {
		errCode?:number,
		errMsg?:string,
	}
	export let sendCode = CoreFunctionals.req<tSendCodeReq,tSendCodeRes>("sendcode")
	export type tSendCodeReq = {
		account:string,
		type:0|1|2, // 0:注册，1：修改登录密码，2：修改交易密码
	}
	export type tSendCodeRes = {
		errCode?:number,
		errMsg?:string,

		code?:string,
	}

	export let verifyCode = CoreFunctionals.req<tVerifyCodeReq,tVerifyCodeRes>("verifycode")
	export type tVerifyCodeReq = {
		account:string,
		verifyCode:string,
	}
	export type tVerifyCodeRes = {
		errCode?:number,
		errMsg?:string,

		token:string,
	}
}