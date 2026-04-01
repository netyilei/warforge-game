import { jsonAsyncService } from "kdweb-core/lib/service/base";
import { Config } from "../config";
import * as express from "express";
import { Log } from "../log";
import { Module_ChargeConfigBlockchain, Module_ChargeOrder, Module_ChargeWalletUserAddress, Module_WithdrawOrder } from "../../pp-base-define/DM_ChargeDefine";
import Decimal from "decimal.js";
import { GlobalUtils } from "../../src/GlobalUtils";
import { ChargeDefine } from "../../pp-base-define/ChargeDefine";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { CregisService } from "./CregisService";
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils";


export namespace CregisCallbackService {
	export class ChargeCallback extends jsonAsyncService {
		async work(params: {
			"pid": number,
			"cid": number,
			"chain_id":string,
			"token_id":string,
			"currency":string,
			"amount":string,
			"address":string,
			"status": string,
			"txid": string,
			"block_height": string,
			"block_time": string,
			"nonce": string,
			"timestamp": number,
			"sign": string
		}) {
			let sign = CregisService.sign(params)
			if(sign != params.sign) {
				Log.oth.error("ChargeCallback sign invalid ",params)
				return "success" as any
			}
			do {
				if(params.pid != Config.localConfig.pid) {
					Log.oth.error("ChargeCallback pid not match ",params)
					break 
				}

				let chainID = new Decimal(params.chain_id).toNumber()
				let chainConfig = await Module_ChargeConfigBlockchain.getSingle({
					chainID,
					symbol:params.currency
				})
				if(!chainConfig) {
					Log.oth.error("ChargeCallback cannot find chain config ",params)
					break 
				}
				if(!chainConfig.enabled) {
					Log.oth.error("ChargeCallback chain not enabled ",params)
					break 
				}
				let address = params.address.toLowerCase()
				let userAddress = await Module_ChargeWalletUserAddress.getSingle({
					chainID,
					// coinID:chainConfig.symbol,
					address:address
				})
				if(!userAddress) {
					Log.oth.error("ChargeCallback cannot find user address ",params)
					break 
				}
				let itemCount = GlobalUtils.roundDown(Decimal.mul(params.amount,chainConfig.rate))
				if(itemCount.lessThanOrEqualTo(0)) {
					Log.oth.error("ChargeCallback amount too small ",params)
					break 
				}
				let orderID = await IDUtils.getChargeOrderID()
				let time = kdutils.getMillionSecond()
				let date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
				let order:ChargeDefine.tChargeOrder = {
					orderID:orderID,				// 
					strOrderID:String(orderID),
					userID:userAddress.userID,
					payType:ChargeDefine.PayType.Blockchain,			// 充值方式
					typeID:chainConfig.typeID,				// 充值方式类型ID
					currencyUnit:params.currency,		// 充值货币单位
					amount:params.amount,				// 充值金额
					hash:params.txid,				// 区块链交易哈希
					itemID:chainConfig.itemID,				// 道具ID
					itemCount:itemCount.toString(),			// 道具数量
					imgUrls:null,			// 充值凭证图片URL列表

					status:ChargeDefine.ChargeStatus.Success,		// 充值状态

					gmUserID:-1,			// 充值审核管理员ID
					reason:"callback",				// 充值失败或拒绝原因
					confirmAmount:params.amount,		// 实际到账数量
					confirmItemCount:itemCount.toString(),	// 实际到账道具数量

					timestamp:time,
					date:date,

					data:params,

					confirmTimestamp:time,
					confirmDate:date,
				}
				await Module_ChargeOrder.insert(order)

				Rpc.center.call(kds.item.add,userAddress.userID,order.itemID,itemCount.toString(),ItemDefine.SerialType.Charge,{
					orderID:order.orderID,
				})
				PromoteRelationUtils.addBalance(order.userID,order.itemID,{
					exceptionValue:order.itemCount,
					totalCharge:order.itemCount,
				},"chain charge callback")
				PromoteRelationUtils.reportCharge(order.userID,order.itemID,order.itemCount,Rpc.center)
				Log.oth.info("ChargeCallback success ",order)
			} while(false)
			return "success" as any
		}
	}

	/**
	 * 状态(status)	描述
		2	签名驳回
		4	审批驳回
		6	交易成功
		7	交易失败
	 */
	export class WithdrawCallback extends jsonAsyncService {
		async work(params:{
			"pid": number,
			"cid": number,
			"from_address": string,
			"to_address": string,
			"chain_id": string,
			"token_id": string,
			"currency": string,
			"amount": string,
			"third_party_id": string,
			"remark": string,
			"memo": string,
			"status": number,
			"txid": string,
			"block_height": string,
			"block_time": number,
			"nonce": string,
			"timestamp": number,
			"sign": string
		}) {
			let sign = CregisService.sign(params)
			if(sign != params.sign) {
				Log.oth.error("WithdrawCallback sign invalid ",params)
				return "success" as any
			}
			Log.oth.info("WithdrawCallback ",params)
			do {
				let order = await Module_WithdrawOrder.searchLockedSingleData(params.third_party_id)
				if(!order) {
					Log.oth.error("WithdrawCallback cannot find order id = " + params.third_party_id)
					break
				}
				if(order.data.status != ChargeDefine.WithdrawStatus.Wait) {
					Log.oth.error("WithdrawCallback order status invalid id = " + params.third_party_id,order)
					order.release()
					break
				}
				let failed = false 
				switch(params.status) {
					case 2:{
						order.data.status = ChargeDefine.WithdrawStatus.Refuse
						order.data.reason = "signature rejected"
						order.data.confirmTimestamp = kdutils.getMillionSecond()
						order.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",order.data.confirmTimestamp)
						await Module_WithdrawOrder.update(order.data)
						Log.oth.info("WithdrawCallback signature rejected id = " + params.third_party_id)
						await order.saveAndRelease()
						failed = true
					} break 
					case 4:{
						order.data.status = ChargeDefine.WithdrawStatus.Refuse
						order.data.reason = "approval rejected"
						order.data.confirmTimestamp = kdutils.getMillionSecond()
						order.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",order.data.confirmTimestamp)
						await Module_WithdrawOrder.update(order.data)
						Log.oth.info("WithdrawCallback approval rejected id = " + params.third_party_id)
						await order.saveAndRelease()
						failed = true
					} break 
					case 6:{
						order.data.status = ChargeDefine.WithdrawStatus.Success
						order.data.blockchain = order.data.blockchain || <any>{}
						order.data.blockchain.hash = params.txid
						order.data.confirmTimestamp = kdutils.getMillionSecond()
						order.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",order.data.confirmTimestamp)
						await Module_WithdrawOrder.update(order.data)
						Log.oth.info("WithdrawCallback approval rejected id = " + params.third_party_id)
						await order.saveAndRelease()
					} break 
					case 7:{
						order.data.status = ChargeDefine.WithdrawStatus.Fail
						order.data.reason = "transaction failed"
						order.data.confirmTimestamp = kdutils.getMillionSecond()
						order.data.confirmDate = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",order.data.confirmTimestamp)
						await Module_WithdrawOrder.update(order.data)
						Log.oth.info("WithdrawCallback transaction failed id = " + params.third_party_id)
						await order.saveAndRelease()
						failed = true
					} break 
				}
				if(failed) {
					// 返还道具
					Rpc.center.call(kds.item.add,order.data.userID,order.data.itemID,order.data.itemCount,ItemDefine.SerialType.WithdrawFailed,{
						orderID:order.data.orderID,
					})
					PromoteRelationUtils.addBalance(order.data.userID,order.data.itemID,{
						exceptionValue:order.data.itemCount,
						totalWithdraw:new Decimal(order.data.itemCount).neg().toString(),
					},"chainwithdraw callback failed")
				}
			} while(false)
			return "success" as any
		}
	}
}