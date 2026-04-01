import { baseService } from "kdweb-core/lib/service/base";
import { Module_ChargeBankBranchInfo, Module_ChargeBankInfo, Module_ChargeChainInfo, Module_ChargeConfigAppleCard, Module_ChargeConfigBank, Module_ChargeConfigBlockchain, Module_ChargeConfigPaypal, Module_ChargeOrder, Module_ChargePaypalInfo, Module_ChargeUpload, Module_ChargeUploadCache, Module_WithdrawConfigBank, Module_WithdrawConfigBlockchain, Module_WithdrawConfigPaypal, Module_WithdrawOrder } from "../../pp-base-define/DM_ChargeDefine";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import * as express from "express"
import * as core from "express-serve-static-core";
import multer = require('multer');
import crypto = require('crypto');
import path = require('path');
import fs = require('fs');
import md5 = require('md5');
import { Module_LoginAccessToken, Module_TradePassword, Module_UserLoginData } from "../../pp-base-define/DM_UserDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { ChargeDefine } from "../../pp-base-define/ChargeDefine";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { Log } from "../log";
import { IDUtils } from "../../src/IDUtils";
import { kdasync } from "kdweb-core/lib/tools/async";
import { RedisLock } from "../../src/RedisLock";
import { GlobalUtils } from "../../src/GlobalUtils";
import Decimal from "decimal.js";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils";

export namespace ChargeService {
	export async function getChargeOrders(userID:number,params:{
		statuss?:ChargeDefine.ChargeStatus[],
		payType?:ChargeDefine.PayType,
		history?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.statuss && params.statuss.length > 0) {
			index.status = {$in:params.statuss}
		}
		if(params.payType !== undefined) {
			index.payType = params.payType
		}
		let count = await Module_ChargeOrder.getCount(index)
		let datas = await Module_ChargeOrder.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{orderID:-1},
			// projection:params.history ? {
			// 	orderID:1,
			// 	blockchain:1,
			// 	bank:1,
			// 	paypal:1,
			// } : null,
		})
		return {
			count,
			datas,
		}
	}

	export async function getWithdrawOrders(userID:number,params:{
		statuss?:ChargeDefine.WithdrawStatus[],
		payType?:ChargeDefine.PayType,
		history?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.statuss && params.statuss.length > 0) {
			index.status = {$in:params.statuss}
		}
		if(params.payType !== undefined) {
			index.payType = params.payType
		}
		let count = await Module_WithdrawOrder.getCount(index)
		let datas = await Module_WithdrawOrder.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{orderID:-1},
			projection:params.history ? {
				orderID:1,
				typeID:1,
				blockchain:1,
				bank:1,
				paypal:1,
			} : null,
		})
		return {
			count,
			datas,
		}
	}


	export async function getEnabledChargeConfigs(userID:number,params:{
		payType:ChargeDefine.PayType,
	}) {
		switch(params.payType) {
			case ChargeDefine.PayType.Blockchain:{
				let chains = await Module_ChargeConfigBlockchain.get({enabled:true})
				let chainIDs = chains.map(v=>v.chainID)
				let chainInfos = await Module_ChargeChainInfo.get({chainID:{$in:chainIDs}})
				return {
					chains,
					chainInfos,
				}
			} break 
			case ChargeDefine.PayType.Bank:{
				let banks = await Module_ChargeConfigBank.get({enabled:true})
				let bankIDs = banks.map(v=>v.bankID)
				let bankInfos = await Module_ChargeBankInfo.get({bankID:{$in:bankIDs}})
				let branchIDs = banks.map(v=>v.branchID)
				let bankBranchInfos = await Module_ChargeBankBranchInfo.get({branchID:{$in:branchIDs}})
				return {
					banks,
					bankInfos,
					bankBranchInfos,
				}
			} break 
			case ChargeDefine.PayType.Paypal:{
				let paypals = await Module_ChargeConfigPaypal.get({enabled:true})
				let paypalIDs = paypals.map(v=>v.paypalID)
				let paypalInfos = await Module_ChargePaypalInfo.get({paypalID:{$in:paypalIDs}})
				return {
					paypals,
					paypalInfos,
				}
			} break 
			case ChargeDefine.PayType.AppleCard:{
				let appleCards = await Module_ChargeConfigAppleCard.get({enabled:true})
				return {
					appleCards,
				}
			} break
		}
		return {}
	}

	export async function getEnabledWithdrawConfigs(userID:number,params:{
		payType:ChargeDefine.PayType,
	}) {
		switch(params.payType) {
			case ChargeDefine.PayType.Blockchain:{
				let chains = await Module_WithdrawConfigBlockchain.get({enabled:true})
				let chainIDs = chains.map(v=>v.chainID)
				let chainInfos = await Module_ChargeChainInfo.get({chainID:{$in:chainIDs}})
				return {
					chains,
					chainInfos,
				}
			} break
			case ChargeDefine.PayType.Bank:{
				let banks = await Module_WithdrawConfigBank.get({enabled:true})
				let bankIDs = banks.map(v=>v.bankID)
				let bankInfos = await Module_ChargeBankInfo.get({bankID:{$in:bankIDs}})
				let branchIDs = banks.map(v=>v.branchID)
				let bankBranchInfos = await Module_ChargeBankBranchInfo.get({branchID:{$in:branchIDs}})
				return {
					banks,
					bankInfos,
					bankBranchInfos,
				}
			} break
			case ChargeDefine.PayType.Paypal:{
				let paypals = await Module_WithdrawConfigPaypal.get({enabled:true})
				let paypalIDs = paypals.map(v=>v.paypalID)
				let paypalInfos = await Module_ChargePaypalInfo.get({paypalID:{$in:paypalIDs}})
				return {
					paypals,
					paypalInfos,
				}
			} break
		}		
		return {}
	}
	export async function getChargeChainAddress(userID:number,params:{
		typeID:number,
	}) {
		let chainConfig = await Module_ChargeConfigBlockchain.getSingle({
			typeID:params.typeID,
			enabled:true,
		})
		if(!chainConfig) {
			return baseService.errJson(1,"配置不存在")
		}
		let address = await Rpc.center.callException(kds.chain.getChargeAddress,userID,chainConfig.chainID)
		return {
			address:address
		}
	}

	export async function charge(userID:number,params:{
		payType:ChargeDefine.PayType,			// 充值方式
		typeID:number,
		amount:string,
		tag?:string,

		returnUrl?:string,
		cancelUrl?:string,
	}) {
		let orderCount = await Module_ChargeOrder.getCount({
			userID,
			status:ChargeDefine.ChargeStatus.Wait,
		})
		let amount = new Decimal(params.amount || "0")
		if(orderCount >= 5) {
			return baseService.errJson(1,"您有过多待处理充值订单，请稍后再试")
		}
		return await RedisLock.callInLock(RedisLock.ChargeWithdraw(userID),30,async ()=>{
			switch(params.payType) {
				case ChargeDefine.PayType.Blockchain:{
				} break 
				case ChargeDefine.PayType.Bank:{
					let uploadCache = await Module_ChargeUploadCache.getSingle({
						userID:userID,
						tag:params.tag,
					})
					if(!uploadCache) {
						return baseService.errJson(1,"充值凭证不存在")
					}
					let bankConfig = await Module_ChargeConfigBank.getSingle({
						typeID:params.typeID,
						enabled:true,
					})
					if(!bankConfig) {
						return baseService.errJson(1,"充值配置不存在")
					}
					let orderID = await IDUtils.getChargeOrderID()
					let order:ChargeDefine.tChargeOrder = {
						orderID:orderID,
						strOrderID:String(orderID),

						userID,
						payType:params.payType,			// 充值方式
						typeID:params.typeID,				// 充值方式类型ID
						currencyUnit:bankConfig.unit,		// 充值货币单位
						amount:null,				// 充值金额
						hash:null,				// 区块链交易哈希
						itemID:bankConfig.itemID,				// 道具ID
						itemCount:"0",			// 道具数量

						imgUrls:[params.tag],			// 充值凭证图片URL列表

						status:ChargeDefine.ChargeStatus.Wait,		// 充值状态

						gmUserID:null,			// 充值审核管理员ID
						reason:null,				// 充值失败或拒绝原因
						confirmAmount:null,		// 实际到账数量
						confirmItemCount:null,	// 实际到账道具数量
						rate:bankConfig.rate,

						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),

						data:null,

						confirmTimestamp:null,
						confirmDate:null,
					}
					await Module_ChargeOrder.insert(order)

					let upload:ChargeDefine.tChargeUpload = {
						orderID:orderID,
						fullPath:uploadCache.fullPath,
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					}
					await Module_ChargeUpload.insert(upload)
				} break 
				case ChargeDefine.PayType.Paypal:{
					let paypalConfig = await Module_ChargeConfigPaypal.getSingle({
						typeID:params.typeID,
						enabled:true,
					})
					if(!paypalConfig) {
						return baseService.errJson(1,"充值配置不存在")
					}
					let itemCount = GlobalUtils.roundDown(Decimal.mul(params.amount,paypalConfig.rate))
					let minAmount = new Decimal(paypalConfig.minAmount || "0")
					let maxAmount = new Decimal(paypalConfig.maxAmount || "0")
					if(minAmount.gt(0) && itemCount.lessThan(minAmount)) {
						return baseService.errJson(1,"充值金额过低")
					}
					if(maxAmount.gt(0) && itemCount.greaterThan(maxAmount)) {
						return baseService.errJson(1,"充值金额过高")
					}
					let orderID = await IDUtils.getChargeOrderID()
					let order:ChargeDefine.tChargeOrder = {
						orderID:orderID,
						strOrderID:String(orderID),
						userID,
						payType:params.payType,			// 充值方式
						typeID:params.typeID,				// 充值方式类型ID
						currencyUnit:paypalConfig.unit,		// 充值货币单位
						amount:params.amount,			// 充值金额
						hash:null,				// 区块链交易哈希
						itemID:paypalConfig.itemID,				// 道具ID
						itemCount:itemCount.toString(),			// 道具数量
						imgUrls:null,			// 充值凭证图片URL列表

						status:ChargeDefine.ChargeStatus.Wait,		// 充值状态
						gmUserID:null,			// 充值审核管理员ID
						reason:null,				// 充值失败或拒绝原因
						confirmAmount:null,		// 实际到账数量
						confirmItemCount:null,	// 实际到账道具数量
						rate:paypalConfig.rate,
						
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
						data:null,
						confirmTimestamp:null,
						confirmDate:null,
					}
					await Module_ChargeOrder.insert(order)
					let ret:{
						paypalOrderId: string,
						status: string,
						approveUrl: string,
						orderId: string
					}
					try {
						ret = await Rpc.center.callException(kds.paypal.createPaypalOrder,userID,order.strOrderID,params.returnUrl, params.cancelUrl)
					} catch (error) {
						Log.oth.error("call rpc failed",error)
					}
					if(!ret || !ret.paypalOrderId) {
						Log.oth.error("Charge createPaypalOrder failed ",userID,order)
						let module = await Module_ChargeOrder.searchLockedSingleData(order.orderID)
						if(module) {
							module.data.status = ChargeDefine.ChargeStatus.Fail
							module.data.reason = "createPaypalOrder failed"
							await module.saveAndRelease()
						}
						return baseService.errJson(1,"创建Paypal订单失败")
					}
					return ret 
				} break 
				case ChargeDefine.PayType.AppleCard:{
					let uploadCache = await Module_ChargeUploadCache.getSingle({
						userID:userID,
						tag:params.tag,
					})
					if(!uploadCache) {
						return baseService.errJson(1,"充值凭证不存在")
					}
					let appleCardConfig = await Module_ChargeConfigAppleCard.getSingle({
						typeID:params.typeID,
						enabled:true,
					})
					if(!appleCardConfig) {
						return baseService.errJson(1,"充值配置不存在")
					}
					let itemCount = GlobalUtils.roundDown(Decimal.mul(params.amount || "0",appleCardConfig.rate))
					let orderID = await IDUtils.getChargeOrderID()
					let order:ChargeDefine.tChargeOrder = {
						orderID:orderID,
						strOrderID:String(orderID),

						userID,
						payType:params.payType,			// 充值方式
						typeID:params.typeID,				// 充值方式类型ID
						currencyUnit:appleCardConfig.unit,		// 充值货币单位
						amount:params.amount || "0",				// 充值金额
						hash:null,				// 区块链交易哈希
						itemID:appleCardConfig.itemID,				// 道具ID
						itemCount:itemCount.toString(),			// 道具数量

						imgUrls:[params.tag],			// 充值凭证图片URL列表

						status:ChargeDefine.ChargeStatus.Wait,		// 充值状态

						gmUserID:null,			// 充值审核管理员ID
						reason:null,				// 充值失败或拒绝原因
						confirmAmount:null,		// 实际到账数量
						confirmItemCount:null,	// 实际到账道具数量
						rate:appleCardConfig.rate,
						
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),

						data:null,

						confirmTimestamp:null,
						confirmDate:null,
					}
					await Module_ChargeOrder.insert(order)

					let upload:ChargeDefine.tChargeUpload = {
						orderID:orderID,
						fullPath:uploadCache.fullPath,
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					}
					await Module_ChargeUpload.insert(upload)
				} break 
				default:{
					return baseService.errJson(1,"充值方式不存在")
				}
			}
			return {}
		})
	}

	export async function withdraw(userID:number,params:{
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
	}) {
		if(!params.tradePwdMD5) {
			return baseService.errJson(1,"交易密码不能为空")
		}
		let tradePwd = await Module_TradePassword.getMain(userID)
		if(!tradePwd || tradePwd.pwdMD5 !== params.tradePwdMD5) {
			return baseService.errJson(1,"交易密码错误")
		}
		let loginData = await Module_UserLoginData.getMain(userID)
		if(loginData.lockWithdraw) {
			return baseService.errJson(1,"提现已锁定")
		}
		let itemCount = GlobalUtils.roundDown(new Decimal(params.itemCount))
		if(itemCount.lessThanOrEqualTo(0)) {
			return baseService.errJson(1,"提现数量错误")
		}
		return await RedisLock.callInLock(RedisLock.ChargeWithdraw(userID),30,async ()=>{

			let order:ChargeDefine.tWithdrawOrder
			switch(params.payType) {
				case ChargeDefine.PayType.Blockchain:{
					if(!params.blockchain || !params.blockchain.address) {
						return baseService.errJson(1,"区块链地址不能为空")
					}
					let config = await Module_WithdrawConfigBlockchain.getSingle({
						typeID:params.typeID,
						enabled:true,
					})
					if(!config || config.itemID !== params.itemID) {
						return baseService.errJson(1,"提现配置不存在")
					}
					let amount = GlobalUtils.roundDown(Decimal.mul(itemCount,config.rate))
					let minAmount = new Decimal(config.minAmount || "0")
					let maxAmount = new Decimal(config.maxAmount || "0")
					if(minAmount.gt(0) && amount.lessThan(minAmount)) {
						return baseService.errJson(1,"提现金额过低")
					}
					if(maxAmount.gt(0) && amount.greaterThan(maxAmount)) {
						return baseService.errJson(1,"提现金额过高")
					}
					let realAmount:Decimal
					let feeAmount:Decimal
					if(config.fixedFee) {
						feeAmount = new Decimal(config.feeAmount)
					} else {
						feeAmount = Decimal.mul(amount,config.feePercent || "0").div(100).toDecimalPlaces(config.decimals,Decimal.ROUND_UP)
					}
					realAmount = amount.minus(feeAmount)
					if(realAmount.lessThanOrEqualTo(0)) {
						return baseService.errJson(1,"提现金额过低，无法支付手续费")
					}
					let orderID = await IDUtils.getWithdrawOrderID()
					order = {
						orderID:orderID,
						strOrderID:String(orderID),
						userID,
						payType:params.payType,
						typeID:params.typeID,
						currencyUnit:config.symbol,
						originAmount:amount.toString(),
						amount:realAmount.toString(),
						feeAmount:feeAmount.toString(),
						itemID:config.itemID,
						itemCount:itemCount.toString(),
						blockchain:{
							chainID:config.chainID,
							address:params.blockchain.address,
						},
						gmUserID:-1,
						status:ChargeDefine.WithdrawStatus.Wait,
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
						confirmTimestamp:null,
						confirmDate:null,
					}
				} break 
				case ChargeDefine.PayType.Bank:{
					if(!params.bank || !params.bank.accountName || !params.bank.accountNumber || !params.bank.bankName || !params.bank.branchName) {
						return baseService.errJson(1,"银行信息不能为空")
					}
					let config = await Module_WithdrawConfigBank.getSingle({
						typeID:params.typeID,
						enabled:true,
					})
					if(!config || config.itemID !== params.itemID) {
						return baseService.errJson(1,"提现配置不存在")
					}
					let amount = GlobalUtils.roundDown(Decimal.mul(itemCount,config.rate))
					let minAmount = new Decimal(config.minAmount || "0")
					let maxAmount = new Decimal(config.maxAmount || "0")
					if(minAmount.gt(0) && amount.lessThan(minAmount)) {
						return baseService.errJson(1,"提现金额过低")
					}
					if(maxAmount.gt(0) && amount.greaterThan(maxAmount)) {
						return baseService.errJson(1,"提现金额过高")
					}
					let realAmount:Decimal
					let feeAmount:Decimal
					if(config.fixedFee) {
						feeAmount = new Decimal(config.feeAmount)
					} else {
						feeAmount = Decimal.mul(amount,config.feePercent || "0").div(100).toDecimalPlaces(2,Decimal.ROUND_UP)
					}
					realAmount = amount.minus(feeAmount)
					if(realAmount.lessThanOrEqualTo(0)) {
						return baseService.errJson(1,"提现金额过低，无法支付手续费")
					}
					let orderID = await IDUtils.getWithdrawOrderID()
					order = {
						orderID:orderID,
						strOrderID:String(orderID),
						userID,
						payType:params.payType,
						typeID:params.typeID,
						currencyUnit:config.unit,
						originAmount:amount.toString(),
						amount:realAmount.toString(),
						feeAmount:feeAmount.toString(),
						itemID:config.itemID,
						itemCount:itemCount.toString(),
						bank:{
							bankID:config.bankID,
							branchID:config.branchID,
							accountName:params.bank.accountName,
							accountNumber:params.bank.accountNumber,
						},
						gmUserID:-1,
						status:ChargeDefine.WithdrawStatus.Wait,
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
						confirmTimestamp:null,
						confirmDate:null,
					}
				} break
				case ChargeDefine.PayType.Paypal:{
					if(!params.paypal || !params.paypal.paypalAccount) {
						return baseService.errJson(1,"PayPal账号不能为空")
					}
					let config = await Module_WithdrawConfigBank.getSingle({
						typeID:params.typeID,
						enabled:true,
					})
					if(!config || config.itemID !== params.itemID) {
						return baseService.errJson(1,"提现配置不存在")
					}
					let amount = GlobalUtils.roundDown(Decimal.mul(itemCount,config.rate))
					let minAmount = new Decimal(config.minAmount || "0")
					let maxAmount = new Decimal(config.maxAmount || "0")
					if(minAmount.gt(0) && amount.lessThan(minAmount)) {
						return baseService.errJson(1,"提现金额过低")
					}
					if(maxAmount.gt(0) && amount.greaterThan(maxAmount)) {
						return baseService.errJson(1,"提现金额过高")
					}
					let realAmount:Decimal
					let feeAmount:Decimal
					if(config.fixedFee) {
						feeAmount = new Decimal(config.feeAmount)
					} else {
						feeAmount = Decimal.mul(amount,config.feePercent || "0").div(100).toDecimalPlaces(2,Decimal.ROUND_UP)
					}
					realAmount = amount.minus(feeAmount)
					if(realAmount.lessThanOrEqualTo(0)) {
						return baseService.errJson(1,"提现金额过低，无法支付手续费")
					}
					let orderID = await IDUtils.getWithdrawOrderID()
					order = {
						orderID:orderID,
						strOrderID:String(orderID),
						userID,
						payType:params.payType,
						typeID:params.typeID,
						currencyUnit:config.unit,
						originAmount:amount.toString(),
						amount:realAmount.toString(),
						feeAmount:feeAmount.toString(),
						itemID:config.itemID,
						itemCount:itemCount.toString(),
						paypal:{
							email:params.paypal.paypalAccount,
						},
						gmUserID:-1,
						status:ChargeDefine.WithdrawStatus.Wait,
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
						confirmTimestamp:null,
						confirmDate:null,
					}
				} break
				default:{
					return baseService.errJson(1,"提现方式不存在")
				}
			}
			if(!order) {
				return baseService.errJson(1,"提现订单创建失败")
			}
			let b = await Rpc.center.callException(kds.item.use,userID,order.itemID,itemCount.toString(),false,ItemDefine.SerialType.Withdraw,{
				orderID:order.orderID,
			})
			if(!b) {
				return baseService.errJson(1,"扣除道具失败，无法提现")
			}
			
			PromoteRelationUtils.addBalance(order.userID,order.itemID,{
				exceptionValue:new Decimal(order.itemCount).neg().toString(),
				totalWithdraw:order.itemCount,
			})
			await Module_WithdrawOrder.insert(order)
			return {}
		})
	}


	const rootPath = "/data/uploads/charge/"
	export function initUpload(app: core.Express) {
		if(!fs.existsSync(rootPath)) {
			fs.mkdirSync(rootPath, { recursive: true });
		}
		// 1. 限制文件类型和大小
		const fileFilter = (req, file, cb) => {
			if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
				return cb(new Error('only support JPG/PNG format'), false);
			}
			cb(null, true);
		};

		// 2. 安全命名（避免路径遍历）
		const storage = multer.diskStorage({
			destination: rootPath,
			filename: (req, file, cb) => {
				const ext = path.extname(file.originalname).toLowerCase();
				const randomName = crypto.randomBytes(16).toString('hex');
				cb(null, `upload_${randomName}${ext}`); // 如 idcard_a1b2c3...jpg
			}
		});

		const upload = multer({
			storage,
			limits: { fileSize: 10 * 1024 * 1024 }, // ≤2MB
			fileFilter
		});
		app.post('/upload/chargebank',
			upload.fields([
				{ name: 'tag', maxCount: 1 },
			]),
			async (req, res) => {
				Log.oth.info("Charge bank upload req ",req.headers);
				let ak = req.headers['Authorization'] || req.headers['authorization'];
				if(!ak) {
					return res.status(400).json(baseService.errJson(1,"无效的请求"));
				}
				
				let akInfo = await Module_LoginAccessToken.getSingle({
					ak:ak,
					target:UserDefine.LoginTarget.App,
				})
				if(!akInfo) {
					return res.status(400).json(baseService.errJson(1,"无效的请求2"));
				}
				try {
					// 1. 验证必传字段
					if (!req.files || Array.isArray(req.files) || !req.files.tag) {
						return res.status(400).json(baseService.errJson(1,"文件错误"));
					}

					// 2. 【可选但强烈建议】调用第三方实名认证 API
					//    如阿里云实人认证、腾讯云慧眼、百度 AI 身份证 OCR
					//    验证：姓名+身份证号+人脸是否一致
					// const verifyResult = await verifyIdCardWithFace(
					//   req.body.name,
					//   req.body.idNumber,
					//   req.files.idCardFront[0].path,
					//   req.files.selfie[0].path
					// );
					// if (!verifyResult.success) return res.status(400).json({ error: '身份验证失败' });

					// 3. 保存用户信息（只存路径，不存图片二进制！）

					let token = md5(req.files.tag[0].path)
					let cache:ChargeDefine.tUploadCache = {
						userID:akInfo.userID,
						fullPath:req.files.tag[0].path,
						tag:md5(kdutils.getMillionSecond() + kdutils.intRandom(0,100000)),
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					}
					await Module_ChargeUploadCache.updateOrInsert(cache)
					// 4. 返回成功（不返回文件路径给前端！）
					res.status(201).json({ tag:cache.tag });
				} catch (err) {
					// 清理已上传的文件（避免垃圾文件）
					cleanupUploadedFiles(req.files);
					res.status(500).json({ });
				}
			}
		);
	}

	async function cleanupUploadedFiles(files) {
		if (!files) return;

		// 支持 single, array, fields 等所有 Multer 格式
		const allFiles = [];

		// 遍历所有字段（如 idCardFront, idCardBack）
		for (const field of Object.values(files)) {
			if (Array.isArray(field)) {
				allFiles.push(...field); // upload.array() 或 upload.fields()
			} else {
				allFiles.push(field);    // upload.single()
			}
		}

		// 删除每个文件
		for (const file of allFiles) {
			if (file?.path) {
				try {
					fs.unlinkSync(file.path);
					Log.oth.info(`✅ Cleaned up: ${file.path}`);
				} catch (err) {
					// 文件可能已被删除或不存在，静默忽略（或记录日志）
					if (err.code !== 'ENOENT') {
						Log.oth.error(`❌ Failed to delete ${file.path}:`, err.message);
					}
				}
			}
		}
	}
}