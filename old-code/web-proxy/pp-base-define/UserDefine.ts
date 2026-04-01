import { ItemDefine } from "./ItemDefine"

export namespace UserDefine {
	export enum LoginDeviceType {
		Win32 = 1,
		iOS,
		Android,
		Wallet = 100,
	}

	export enum AccountType {
		Guest = 1,
		Bind,
		Account,

		H5,
		WalletH5,

		Robot = 100,
	}

	// 信息
	export type tLoginData = {
		userID:number,
		strUserID:string,

		nickName?:string,
		iconUrl?:string,
		sex?:number,
		
		apiID:string,
		countryCode?:string,	// 国家代码
		phoneNumber?:string,

		deviceTag:string,		// 
		channelTag:string,

		regTimestamp:number,
		regDate:string,
	}
	
	// 登录渠道
	export enum LoginChannel {
		Guest,
		Account,
		Email,
		Phone,
		Web3,
		Wechat = 100,
	}
	export type tLoginChannel = {
		userID:number,
		type:LoginChannel,
		account?:string
		pwdMD5?:string,
		openID?:string,
		unionID?:string,
		wxAppID?:string,
		accessToken?:string,
		address?:string,
		chainID?:number,
	}

	export enum LoginTarget {
		App,
		Console,

		H5 = 100,
		WechatMini,
		DouyinMini,
	}

	export type tLoginAccessToken = {
		userID:number,
		type:LoginChannel,
		target:LoginTarget,
		ak:string,
		timestamp:number,
		date:string,
	}

	// 权限
	export type tLoginRole = {
		userID:number,
		targets:{
			target:LoginTarget,
			roles:RoleType[],
		}[]
	}
	

	export enum EquipType {
		Head = 22,		// 头像框
		Title = 23,		// 称号
		Declare,		// 宣言
	}

	export type UserDailyData = {
		// 每日奖励是否可以领取
		dailyAward:boolean
	}

	export type GameRecord = {
		totalCount?:number,
		win?:number,
		lose?:number,
		draw?:number,
		escape?:number,
		score?:number,
		rank?:number
	}

	export const CustomGameRecordGroupID = 99
	export type UserGameRecordData = {
		records:{
			key:string,
			record:GameRecord,
		}[],
	}
	export type UserCommonRecordData = {
		records:{
			id:string,
			record:GameRecord,
		}[],
	}

	export type UserRoomData = {
		userID:number,

		roomID:number,
	}

	export type UserFlagData = {
		userID:number,
		data:any,
	}
	
	export type UserNodeData = {
		userID:number,

		nodeName:string,
	}

	// 上下级关系
	export type PromoteRelation = {
		userID:number,
		level:number,		// 等级
		performance?:string	// 业绩
		leaders:number[],	// 由近及远的上级链条，tRelation.leader在第一位
		subs:number[],		// 所有直接下级
	}

	export const nickNameMinLen = 2
	export const nickNameMaxLen = 10

	export function getUserSideLoginData(loginData:tLoginData) {
		if(loginData == null) {
			return loginData
		}
		if(loginData.regTimestamp) {
			delete loginData.regTimestamp
		}
		if(loginData.regDate) {
			delete loginData.regDate
		}
		return loginData
	}
	export function getSimpleLoginData(loginData:tLoginData) {
		if(!loginData) {
			return null 
		}
		return <tLoginData>{
			userID:loginData.userID,
			nickName:loginData.nickName,
			sex:loginData.sex,
			iconUrl:loginData.iconUrl,
		}
	}
	export function getSimpleLoginDatas(loginDatas:tLoginData[]) {
		for(let i = 0 ; i < loginDatas.length ; i ++) {
			loginDatas[i] = getSimpleLoginData(loginDatas[i])
		}
		return loginDatas
	}

	export namespace Bind {
		export const H5Public = "origin-h5"
		export const H5Account = "origin-h5-account"
		export type DataType = {
			infos: {
				type:string,
				content:string,
			}[]
		}
	}

	export type UserRedBot = {
		mail?:number,
	}

	export type PlayAction = {
		gameID:number,
		userID:number,
		records:{
			name:string,
			count:number,
		}[],
	}

	export type tUserRoomID = {
		userID:number,
		roomID:number,
		matchID:number,
		timestamp:number,
	}

	export type tUserMatchID = {
		userID:number,
		matchID:number,
		timestamp:number,
	}


	export enum RoleType {
		Admin = 0,
		Config,
		// 用户信息
		UserInfos,
		// 用户Console权限管理
		UserConsoleRole,
		// 用户App权限管理
		UserAppRole,
		// 全部资源的编辑权限
		FullResource,
		// 店长
		StoreManager,
		// 查看类型
		StoreType,
		// 编辑类型
		EditStoreType,
		// 开店/闭店
		CreateStore,
		// 全部商品管理
		FullItemManager,
		// 客户会话管理
		CustomerChatManager,
		// 客服会话
		CustomerChat,

		Robot,

		// 代理后台登录权限
		LeaderProxy,

		News,

		RegisterAudit,
		
		Charge,

		ChargeConfirm,
		
		// 奖池管理
		Pot,
		
		App = 1000,

		Seller,		// 核销员
	}

	export type tRegisterUpload = {
		account:string,
		fullPath:string,
		token:string,

		timestamp:number,
		date:string,
	}

	export type tRegisterAudit = {
		no:number,
		oper:boolean,			// 是否已操作
		confirm:boolean,		// 是否通过
		gmUserID?:number,		// 操作的GM用户ID
		userID:number,			// 注册信息userID
		account:string,			// 注册账号
		loginData:tLoginData,	// 登录数据
		loginChannel:tLoginChannel, // 登录渠道
		loginRole:tLoginRole,	// 登录权限
		relation:PromoteRelation,// 推广关系
		uploadToken:string,		// 上传token
		leaderTag?:string,		// 绑定的上级标签
		timestamp:number,
		date:string,
	}
}