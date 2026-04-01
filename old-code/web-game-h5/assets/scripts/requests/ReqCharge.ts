import { CoreFunctionals } from "../core/CoreFunctionals"
import { ChargeDefine } from "../ServerDefines/ChargeDefine"


export namespace ReqCharge {
	export let getEnabledChargeConfigs = CoreFunctionals.reqAK<tGetEnabledChargeConfigsReq,tGetEnabledChargeConfigsRes>("charge/getenabledchargeconfigs")
	export type tGetEnabledChargeConfigsReq = {
		payType:ChargeDefine.PayType,
	}
	export type tGetEnabledChargeConfigsRes = {
		errCode?:number,
		errMsg?:string,

		
		chains:ChargeDefine.tChargeBlockchainConfig[],
		chainInfos:ChargeDefine.tChainInfo[],
		banks:ChargeDefine.tChargeBankConfig[],
		bankInfos:ChargeDefine.tBankInfo[],
		bankBranchInfos:ChargeDefine.tBankBranchInfo[],
		paypals:ChargeDefine.tChargePaypalConfig[],
		paypalInfos:ChargeDefine.tPaypayInfo[],
		appleCards:ChargeDefine.tChargeAppleCardConfig[],
	}

	export let getEnabledWithdrawConfigs = CoreFunctionals.reqAK<tGetEnabledWithdrawConfigsReq,tGetEnabledWithdrawConfigsRes>("charge/getenabledwithdrawconfigs")
	export type tGetEnabledWithdrawConfigsReq = {
		payType:ChargeDefine.PayType,
	}
	export type tGetEnabledWithdrawConfigsRes = {
		errCode?:number,
		errMsg?:string,

		chains:ChargeDefine.tWithdrawBlockchainConfig[],
		chainInfos:ChargeDefine.tChainInfo[],
		banks:ChargeDefine.tWithdrawBankConfig[],
		bankInfos:ChargeDefine.tBankInfo[],
		bankBranchInfos:ChargeDefine.tBankBranchInfo[],
		paypals:ChargeDefine.tWithdrawPaypalConfig[],
		paypalInfos:ChargeDefine.tPaypayInfo[],
	}

	export let getChargeChainAddress = CoreFunctionals.reqAK<tGetChargeChainAddressReq,tGetChargeChainAddressRes>("charge/getchargechainaddress")
	export type tGetChargeChainAddressReq = {
		typeID:number,
	}
	export type tGetChargeChainAddressRes = {
		errCode?:number,
		errMsg?:string,

		address:string,
	}

	export let getChargeOrders = CoreFunctionals.reqAK<tGetChargeOrdersReq,tGetChargeOrdersRes>("charge/getchargeorders")
	export type tGetChargeOrdersReq = {
		statuss?:ChargeDefine.ChargeStatus[],
		payType?:ChargeDefine.PayType,
		history?:boolean,
		page:number,
		limit:number,
	}
	export type tGetChargeOrdersRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:ChargeDefine.tChargeOrder[],
	}

	export let getWithdrawOrders = CoreFunctionals.reqAK<tGetWithdrawOrdersReq,tGetWithdrawOrdersRes>("charge/getwithdraworders")
	export type tGetWithdrawOrdersReq = {
		statuss?:ChargeDefine.WithdrawStatus[],
		payType?:ChargeDefine.PayType,
		history?:boolean,
		page:number,
		limit:number,
	}
	export type tGetWithdrawOrdersRes = {
		errCode?:number,
		errMsg?:string,

		count:number,
		datas:ChargeDefine.tWithdrawOrder[],
	}

	export let charge = CoreFunctionals.reqAK<tChargeReq,tChargeRes>("charge/charge")
	export type tChargeReq = {
		payType:ChargeDefine.PayType,			// 充值方式
		typeID:number,
		amount:string,
		tag?:string,
	}
	export type tChargeRes = {
		errCode?:number,
		errMsg?:string,

		
		paypalOrderId?: string,
		status?: string,
		approveUrl?: string,
		orderId?: string
	}
	

	export let withdraw = CoreFunctionals.reqAK<tWithdrawReq,tWithdrawRes>("charge/withdraw")
	export type tWithdrawReq = {
		tradePwdMD5:string,

		payType:ChargeDefine.PayType,			// 提现方式
		typeID:number,

		itemID:string,
		itemCount:string,
		blockchain?:{
			address:string,
		},
		bank?:{
			accountName:string,
			accountNumber:string,
			bankName:string,
			branchName:string,
			swiftCode:string,
			country:string,
		},
		paypal?:{
			paypalAccount:string,
		},
	}
	export type tWithdrawRes = {
		errCode?:number,
		errMsg?:string,
	}

	
	export let chargeUploadPath = "upload/chargebank"
	export let chargeUploadTag = "tag"
	export type tChargeUploadRes = {
		errCode?:number,
		errMsg?:string,

		tag:string,
	}
}