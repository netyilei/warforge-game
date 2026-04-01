import { baseService } from "kdweb-core/lib/service/base"
import { ChargeDefine } from "../../pp-base-define/ChargeDefine"
import { Module_ChargeBankBranchInfo, Module_ChargeBankInfo, Module_ChargeChainInfo, Module_ChargeConfigAppleCard, Module_ChargeConfigBank, Module_ChargeConfigBlockchain, Module_ChargeConfigPaypal, Module_ChargeOrder, Module_ChargePaypalInfo, Module_ChargeUpload, Module_WithdrawChainMainAddress, Module_WithdrawConfigBank, Module_WithdrawConfigBlockchain, Module_WithdrawConfigPaypal, Module_WithdrawOrder } from "../../pp-base-define/DM_ChargeDefine"
import { IDUtils } from "../../src/IDUtils"
import { UserUtils } from "../../src/UserUtils"
import { UserDefine } from "../../pp-base-define/UserDefine"
import fs = require("fs")
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "../../src/TimeDate"
import Decimal from "decimal.js"
import { GlobalUtils } from "../../src/GlobalUtils"
import { Rpc } from "../rpc"
import { kds } from "../../pp-base-define/GlobalMethods"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { Module_UserBalance } from "../../pp-base-define/DM_LeaderDefine"
import _ = require("underscore")
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils"


export namespace GMChargeService {
	export async function getChainInfos(userID:number,params:{
		chainIDs?:number[],
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.chainIDs && params.chainIDs.length > 0) {
			index.chainID = {$in:params.chainIDs}
		}
		let count = await Module_ChargeChainInfo.getCount(index)
		let datas = await Module_ChargeChainInfo.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	// 会使用chainID作为主键创建新数据
	// 不需要create参数
	export async function updateChainInfo(userID:number,params:{
		data:ChargeDefine.tChainInfo
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		await Module_ChargeChainInfo.updateOrInsert(params.data)
		return {}
	}

	export async function getBankInfos(userID:number,params:{
		bankIDs?:number[],
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.bankIDs && params.bankIDs.length > 0) {
			index.bankID = {$in:params.bankIDs}
		}
		let count = await Module_ChargeBankInfo.getCount(index)
		let datas = await Module_ChargeBankInfo.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	// 会使用bankID作为主键创建新数据
	// 不需要create参数
	export async function updateBankInfo(userID:number,params:{
		data:ChargeDefine.tBankInfo
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		await Module_ChargeBankInfo.updateOrInsert(params.data)
		return {}
	}


	export async function getBankBranchInfos(userID:number,params:{
		bankIDs?:number[],
		bankBranchIDs?:number[],
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.bankIDs && params.bankIDs.length > 0) {
			index.bankID = {$in:params.bankIDs}
		}
		if(params.bankBranchIDs && params.bankBranchIDs.length > 0) {
			index.branchID = {$in:params.bankBranchIDs}
		}
		let count = await Module_ChargeBankBranchInfo.getCount(index)
		let datas = await Module_ChargeBankBranchInfo.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
		})
		return {
			count,
			datas,
		}
	}

	// 会使用branchID作为主键创建新数据
	// 不需要create参数
	export async function updateBankBranchInfo(userID:number,params:{
		data:ChargeDefine.tBankBranchInfo
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		await Module_ChargeBankBranchInfo.updateOrInsert(params.data)
		return {}
	}

	export async function getPaypalInfos(userID:number,params:{
		page:number,
		limit:number,
	}) {
		let index:any = {}
		let count = await Module_ChargePaypalInfo.getCount(index)
		let datas = await Module_ChargePaypalInfo.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	// 会使用paypalID作为主键创建新数据
	// 不需要create参数
	export async function updatePaypalInfo(userID:number,params:{
		data:ChargeDefine.tPaypayInfo
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		await Module_ChargePaypalInfo.updateOrInsert(params.data)
		return {}
	}

	export async function getChargeConfig_Bank(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}

		let count = await Module_ChargeConfigBank.getCount(index)
		let datas = await Module_ChargeConfigBank.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	export async function updateChargeConfig_Bank(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tChargeBankConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_ChargeConfigBank.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_ChargeConfigBank.update(params.data)
		return {}
	}

	export async function setChargeConfigEnabled_Bank(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_ChargeConfigBank.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getChargeConfig_Blockchain(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}

		let count = await Module_ChargeConfigBlockchain.getCount(index)
		let datas = await Module_ChargeConfigBlockchain.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}
	export async function updateChargeConfig_Blockchain(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tChargeBlockchainConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		params.data.name = params.data.name || params.data.displayName
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_ChargeConfigBlockchain.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_ChargeConfigBlockchain.update(params.data)
		return {}
	}
	export async function setChargeConfigEnabled_Blockchain(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_ChargeConfigBlockchain.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getChargeConfig_Paypal(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}
		let count = await Module_ChargeConfigPaypal.getCount(index)
		let datas = await Module_ChargeConfigPaypal.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	export async function updateChargeConfig_Paypal(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tChargePaypalConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_ChargeConfigPaypal.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_ChargeConfigPaypal.update(params.data)
		return {}
	}
	export async function setChargeConfigEnabled_Paypal(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_ChargeConfigPaypal.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getChargeConfig_AppleCard(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}
		let count = await Module_ChargeConfigAppleCard.getCount(index)
		let datas = await Module_ChargeConfigAppleCard.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	export async function updateChargeConfig_AppleCard(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tChargeAppleCardConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_ChargeConfigAppleCard.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_ChargeConfigAppleCard.update(params.data)
		return {}
	}
	export async function setChargeConfigEnabled_AppleCard(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_ChargeConfigAppleCard.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getChargeOrders(userID:number,params:{
		payType?:ChargeDefine.PayType,
		statuss?:ChargeDefine.ChargeStatus[],
		page:number,
		limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.ChargeConfirm)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let index:any = {}
		if(params.statuss && params.statuss.length > 0) {
			index.status = {$in:params.statuss}
		}
		if(params.payType != null) {
			index.payType = params.payType
		}

		let count = await Module_ChargeOrder.getCount(index)
		let datas = await Module_ChargeOrder.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{orderID:-1},
		})
		let balances = await Module_UserBalance.get({userID:{$in:datas.map(v=>v.userID)}})
		return {
			count,
			datas,
			balances,
		}
	}

	export async function getChargeUpload(userID:number,params:{
		orderID:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.ChargeConfirm)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let upload = await Module_ChargeUpload.getMain(params.orderID)
		if(!upload) {
			return baseService.errJson(1,"充值上传记录不存在")
		}
		let base64Data = fs.readFileSync(upload.fullPath,"base64")
		return {
			base64Data
		}
	}

	export async function confirmChargeOrder(userID:number,params:{
		orderID:number,
		confirm:boolean,
		reason?:string,
		confirmAmount?:string,		// 审核到账金额
		confirmItemCount?:string,	// 审核到账道具数量
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.ChargeConfirm)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let confirmAmount = new Decimal(params.confirmAmount || "0")
		if(params.confirm && confirmAmount.lessThanOrEqualTo(0)) {
			return baseService.errJson(1,"确认金额必须大于0")
		}
		let module = await Module_ChargeOrder.searchLockedSingleData(params.orderID)
		if(!module) {
			return baseService.errJson(1,"充值订单不存在")
		}
		if(module.data.status != ChargeDefine.ChargeStatus.Wait) {
			module.release()
			return baseService.errJson(1,"充值订单状态不正确")
		}
		if(module.data.payType != ChargeDefine.PayType.Bank && module.data.payType != ChargeDefine.PayType.AppleCard) {
			module.release()
			return baseService.errJson(1,"不支持后台手动操作")
		}
		switch(module.data.payType) {
			case ChargeDefine.PayType.Bank: {
				let chargeConfig = await Module_ChargeConfigBank.getMain(module.data.typeID)
				if(!chargeConfig) {
					await module.release()
					return baseService.errJson(1,"找不到充值配置")
				}
				if(!params.confirm) {
					module.data.status = ChargeDefine.ChargeStatus.Fail
					module.data.gmUserID = userID
					module.data.reason = params.reason || "GM拒绝充值"
					module.data.confirmTimestamp = kdutils.getMillionSecond()
					module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
					await module.saveAndRelease()
					return {
						data:module.data
					}
				}
				// let confirmAmount = GlobalUtils.roundDown(new Decimal(params.confirmAmount || module.data.confirmAmount))
				let confirmItemCount = GlobalUtils.roundDown(confirmAmount.mul(chargeConfig.rate))
				if(confirmAmount.lte(0)) {
					await module.release()
					return baseService.errJson(1,"确认金额必须大于0")
				}
				if(confirmItemCount.lte(0)) {
					await module.release()
					return baseService.errJson(1,"确认道具数量必须大于0")
				}
				module.data.status = ChargeDefine.ChargeStatus.Success
				module.data.gmUserID = userID
				module.data.confirmTimestamp = kdutils.getMillionSecond()
				module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
				module.data.confirmAmount = confirmAmount.toString()
				module.data.confirmItemCount = confirmItemCount.toString()
				await module.saveAndRelease()
				Rpc.center.call(kds.item.add,module.data.userID,module.data.itemID,confirmItemCount.toString(),
					ItemDefine.SerialType.Charge,{
						chargeOrderID:module.data.orderID,
					}
				)
				PromoteRelationUtils.addBalance(module.data.userID,module.data.itemID,{
					exceptionValue:module.data.confirmItemCount,
					totalCharge:module.data.confirmItemCount,
				},"gm confirm charge order")
				PromoteRelationUtils.reportCharge(module.data.userID,module.data.itemID,module.data.confirmItemCount,Rpc.center)
				return {
					data:module.data
				}
			} break 
			case ChargeDefine.PayType.AppleCard: {
				let chargeConfig = await Module_ChargeConfigAppleCard.getMain(module.data.typeID)
				if(!chargeConfig) {
					await module.release()
					return baseService.errJson(1,"找不到充值配置")
				}
				if(!params.confirm) {
					module.data.status = ChargeDefine.ChargeStatus.Fail
					module.data.gmUserID = userID
					module.data.reason = params.reason || "GM拒绝充值"
					module.data.confirmTimestamp = kdutils.getMillionSecond()
					module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
					await module.saveAndRelease()
					return {
						data:module.data
					}
				}
				// let confirmAmount = GlobalUtils.roundDown(new Decimal(params.confirmAmount || module.data.confirmAmount))
				let confirmItemCount = GlobalUtils.roundDown(confirmAmount.mul(chargeConfig.rate))
				if(confirmAmount.lte(0)) {
					await module.release()
					return baseService.errJson(1,"确认金额必须大于0")
				}
				if(confirmItemCount.lte(0)) {
					await module.release()
					return baseService.errJson(1,"确认道具数量必须大于0")
				}
				module.data.status = ChargeDefine.ChargeStatus.Success
				module.data.gmUserID = userID
				module.data.confirmTimestamp = kdutils.getMillionSecond()
				module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
				module.data.confirmAmount = confirmAmount.toString()
				module.data.confirmItemCount = confirmItemCount.toString()
				await module.saveAndRelease()
				Rpc.center.call(kds.item.add,module.data.userID,module.data.itemID,confirmItemCount.toString(),
					ItemDefine.SerialType.Charge,{
						chargeOrderID:module.data.orderID,
					}
				)
				PromoteRelationUtils.addBalance(module.data.userID,module.data.itemID,{
					exceptionValue:module.data.confirmItemCount,
					totalCharge:module.data.confirmItemCount,
				},"gm confirm charge order")
				PromoteRelationUtils.reportCharge(module.data.userID,module.data.itemID,module.data.confirmItemCount,Rpc.center)
				return {
					data:module.data
				}
			} break 
		}
		return baseService.errJson(1,"exception")
	}

	export async function getWithdrawOrders(userID:number,params:{
		payType?:ChargeDefine.PayType,
		statuss?:ChargeDefine.WithdrawStatus[],
		page:number,
		limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.ChargeConfirm)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let index:any = {}
		if(params.statuss && params.statuss.length > 0) {
			index.status = {$in:params.statuss}
		}
		if(params.payType != null) {
			index.payType = params.payType
		}
		let count = await Module_WithdrawOrder.getCount(index)
		let datas = await Module_WithdrawOrder.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{orderID:-1},
		})
		let userIDs = _.uniq(datas.map(v=>v.userID))
		let balances = await Module_UserBalance.get({userID:{$in:userIDs}})
		return {
			count,
			datas,
			balances,
		}
	}
	
	export async function confirmWithdrawOrder(userID:number,params:{
		orderID:number,
		confirm:boolean,
		reason?:string,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.ChargeConfirm)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_WithdrawOrder.searchLockedSingleData(params.orderID)
		if(!module) {
			return baseService.errJson(1,"提现订单不存在")
		}
		if(module.data.status != ChargeDefine.WithdrawStatus.Wait) {
			module.release()
			return baseService.errJson(1,"提现订单状态不正确")
		}
		if(!params.confirm) {
			module.data.status = ChargeDefine.WithdrawStatus.Fail
			module.data.gmUserID = userID
			module.data.reason = params.reason || "GM拒绝提现"
			module.data.confirmTimestamp = kdutils.getMillionSecond()
			module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
			await module.saveAndRelease()
			Rpc.center.call(kds.item.add,module.data.userID,module.data.itemID,module.data.itemCount,
				ItemDefine.SerialType.WithdrawFailed,{
					withdrawOrderID:module.data.orderID,
					gmUserID:userID,
				}
			)
			PromoteRelationUtils.addBalance(module.data.userID,module.data.itemID,{
				exceptionValue:module.data.itemCount,
				totalWithdraw:new Decimal(module.data.itemCount).neg().toString(),
			},"gm refuse withdraw order")
			return {
				data:module.data
			}
		}
		switch(module.data.payType) {
			case ChargeDefine.PayType.Blockchain:{
				module.data.status = ChargeDefine.WithdrawStatus.Processing
				module.data.gmUserID = userID
				module.data.confirmTimestamp = kdutils.getMillionSecond()
				module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
				await module.saveAndRelease()
				await Rpc.center.callException(kds.chain.withdraw,module.data.userID,module.data.orderID)
			} break 
			case ChargeDefine.PayType.Paypal:{
				module.data.status = ChargeDefine.WithdrawStatus.Success
				module.data.gmUserID = userID
				module.data.confirmTimestamp = kdutils.getMillionSecond()
				module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
				await module.saveAndRelease()
			} break 
			case ChargeDefine.PayType.Bank:{
				module.data.status = ChargeDefine.WithdrawStatus.Success
				module.data.gmUserID = userID
				module.data.confirmTimestamp = kdutils.getMillionSecond()
				module.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
				await module.saveAndRelease()
			} break 
		}
		return {
			data:module.data
		}
	}



	
	export async function getWithdrawConfig_Bank(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}

		let count = await Module_WithdrawConfigBank.getCount(index)
		let datas = await Module_WithdrawConfigBank.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	export async function updateWithdrawConfig_Bank(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tWithdrawBankConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_WithdrawConfigBank.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_WithdrawConfigBank.update(params.data)
		return {}
	}

	export async function setWithdrawConfigEnabled_Bank(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_WithdrawConfigBank.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getWithdrawConfig_Blockchain(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}

		let count = await Module_WithdrawConfigBlockchain.getCount(index)
		let datas = await Module_WithdrawConfigBlockchain.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}
	export async function updateWithdrawConfig_Blockchain(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tWithdrawBlockchainConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_WithdrawConfigBlockchain.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_WithdrawConfigBlockchain.update(params.data)
		return {}
	}
	export async function setWithdrawConfigEnabled_Blockchain(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_WithdrawConfigBlockchain.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getWithdrawConfig_Paypal(userID:number,params:{
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}
		let count = await Module_WithdrawConfigPaypal.getCount(index)
		let datas = await Module_WithdrawConfigPaypal.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{typeID:1},
		})
		return {
			count,
			datas,
		}
	}

	export async function updateWithdrawConfig_Paypal(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tWithdrawPaypalConfig
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.typeID = await IDUtils.getChargeTypeID()
			await Module_WithdrawConfigPaypal.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_WithdrawConfigPaypal.update(params.data)
		return {}
	}
	export async function setWithdrawConfigEnabled_Paypal(userID:number,params:{
		typeID:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_WithdrawConfigPaypal.searchLockedSingleData(params.typeID)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}

	export async function getWithdrawChainMainAddress(userID:number,params:{
		chainID?:number,
		withDisabled?:boolean,
		page:number,
		limit:number,
	}) {
		let index:any = {}
		if(params.withDisabled !== true) {
			index.enabled = true
		}
		if(params.chainID != null) {
			index.chainID = params.chainID
		}

		let count = await Module_WithdrawChainMainAddress.getCount(index)
		let datas = await Module_WithdrawChainMainAddress.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{no:1},
		})
		return {
			count,
			datas,
		}
	}

	export async function updateWithdrawChainMainAddress(userID:number,params:{
		create?:boolean,
		data:ChargeDefine.tWithdrawChainMainAddress
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		if(params.create) {
			params.data.no = await IDUtils.getWithdrawChainMainAddressNo()
			params.data.address = params.data.address ||
				await Rpc.center.callException(kds.chain.getSubMainAddress,"chain"+params.data.chainID + "-no" + params.data.no,params.data.chainID)
			await Module_WithdrawChainMainAddress.insert(params.data)
			return {
				data:params.data,
			}
		}
		await Module_WithdrawChainMainAddress.update(params.data)
		return {
			data:params.data 
		}
	}

	export async function setWithdrawChainMainAddressEnabled(userID:number,params:{
		no:number,
		enabled:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.Charge)) {
			return baseService.errJson(1,"没有权限操作")
		}
		let module = await Module_WithdrawChainMainAddress.searchLockedSingleData(params.no)
		if(!module) {
			return baseService.errJson(1,"配置不存在")
		}
		module.data.enabled = params.enabled
		await module.saveAndRelease()
		return {
			data:module.data,
		}
	}
}