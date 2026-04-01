import { kdlock } from "kdweb-core/lib/tools/lock"
import { ChargeDefine } from "../../pp-base-define/ChargeDefine"
import { Module_ChargeChainInfo, Module_ChargeConfigBlockchain, Module_ChargeWalletUserAddress, Module_WithdrawChainMainAddress, Module_WithdrawConfigBlockchain, Module_WithdrawOrder } from "../../pp-base-define/DM_ChargeDefine"
import { RedisLock } from "../../src/RedisLock"
import { CregisService } from "../entity/CregisService"
import { Log } from "../log"
import { Config } from "../config"
import Decimal from "decimal.js"
import { IDUtils } from "../../src/IDUtils"
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "../../src/TimeDate"
import { Rpc } from "../rpc"
import { kds } from "../../pp-base-define/GlobalMethods"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { getAddress } from "ethers"
import { DB } from "../../src/db"


let redis = DB.getRedis()
async function getChargeAddress(h:string,userID:number,chainID:number) {
	let config = await Module_ChargeConfigBlockchain.getSingle({chainID,enabled:true})
	if(!config) {
		return null
	}
	let addressInfo = await Module_ChargeWalletUserAddress.getSingle({
		userID,
		chainID,
	})
	if(addressInfo) {
		return addressInfo.address
	}
	return await RedisLock.callInLock(RedisLock.ReqWalletAddress(userID),30,async ()=>{
		addressInfo = await Module_ChargeWalletUserAddress.getSingle({
			userID,
			chainID,
		})
		if(addressInfo) {
			return addressInfo.address
		}
		let callbackUrl = Config.otherConfig.callbackHost + "/callback/charge"
		let address:string = await CregisService.getAddress(userID,config)
		if(!address) {
			Log.oth.error("getChargeAddress get address failed ",userID,chainID)
			return null 
		}
		address = String(address).toLowerCase()
		addressInfo = {
			userID,
			chainID,
			address,
			callbackUrl
		}
		await Module_ChargeWalletUserAddress.insert(addressInfo)
		return addressInfo.address
	})
}

async function getSubMainAddress(h:string,tag:string,chainID:number) {
	let config = await Module_ChargeConfigBlockchain.getSingle({chainID,enabled:true})
	if(!config) {
		return null
	}
	let key = chainID + "_" + tag
	let address = await redis.hget("t_withdraw_chain_main_address",key)
	if(address) {
		return address
	}
	return await RedisLock.callInLock(RedisLock.ReqWithdrawMainAddress(tag),30,async ()=>{
		address = await redis.hget("t_withdraw_chain_main_address",key)
		if(address) {
			return address
		}
		let callbackUrl = Config.otherConfig.callbackHost + "/callback/charge"
		address = await CregisService.getTagAddress(tag,config)
		if(!address) {
			Log.oth.error("getSubMainAddress get address failed ",tag,chainID)
			return null 
		}
		address = String(address).toLowerCase()
		await redis.hset("t_withdraw_chain_main_address",key,address)
		return address
	})
}

async function withdrawReq(h:string,userID:number,req:ChargeDefine.tUserWithdrawReq) {
	if(!req.blockchain) {
		return false 
	}
	let config  = await Module_WithdrawConfigBlockchain.getSingle({chainID:req.blockchain.chainID,enabled:true})
	if(!config) {
		return false 
	}
	let amount = Decimal.mul(req.itemCount,config.rate).toDecimalPlaces(config.decimals,Decimal.ROUND_DOWN)
	if(amount.lessThanOrEqualTo(0)) {
		Log.oth.error("withdraw amount invalid ",userID,req,amount.toString())
		return false 
	}

	let orderID = await IDUtils.getWithdrawOrderID()
	let b = await Rpc.center.callException(kds.item.use,userID,req.itemID,req.itemCount,false,ItemDefine.SerialType.Withdraw,{
		orderID,
	})
	return await kdlock.redis.callInLock(Module_WithdrawOrder.getLockName(orderID),30,async ()=>{ 
		let order:ChargeDefine.tWithdrawOrder = {
			orderID:orderID,
			strOrderID:String(orderID),
			userID:userID,
			payType:ChargeDefine.PayType.Blockchain,
			typeID:config.typeID,
			currencyUnit:config.symbol,
			amount:amount.toString(),
			feeAmount:"0",
			itemID:config.itemID,
			itemCount:req.itemCount,
			blockchain:{
				chainID:req.blockchain.chainID,
				address:req.blockchain.address,
			},
			gmUserID:-1,
			status:ChargeDefine.WithdrawStatus.Processing,
			reason:null,

			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
			confirmTimestamp:null,
			confirmDate:null,
		}
		await Module_WithdrawOrder.insert(order)
		let b = await CregisService.sendWithdraw(config,order)
		if(!b) {
			Log.oth.error("withdraw sendWithdraw failed ",userID,order)
			await Rpc.center.callException(kds.item.add,userID,req.itemID,req.itemCount,ItemDefine.SerialType.WithdrawFailed,{
				orderID:orderID,
			})
			await Module_WithdrawOrder.updateOrigin({orderID:orderID},{
				$set:{
					status:ChargeDefine.WithdrawStatus.Fail,
					reason:"send withdraw failed",
				}
			})
		}
	})
}
async function withdraw(h:string,userID:number,orderID:number) {
	let module = await Module_WithdrawOrder.searchLockedSingleData(orderID)
	if(!module) {
		return false 
	}
	let config  = await Module_WithdrawConfigBlockchain.getSingle({chainID:module.data.blockchain?.chainID,enabled:true})
	if(!config) {
		module.release()
		return false 
	}

	try {
		let mainAddress = await Module_WithdrawChainMainAddress.getSingle({chainID:config.chainID},{
			sort:{
				pri:-1,
			},
			limit:1,
		})
		let from = mainAddress.address || await getChargeAddress(h,userID,config.chainID) 

		let b = await CregisService.sendWithdraw(config,module.data,from)
		if(!b) {
			Log.oth.error("withdraw sendWithdraw failed ",userID,module.data)
			await Rpc.center.call(kds.item.add,userID,module.data.itemID,module.data.itemCount,ItemDefine.SerialType.WithdrawFailed,{
				orderID:orderID,
			})
			module.data.status = ChargeDefine.WithdrawStatus.Fail
			module.data.reason = "send withdraw failed"
			await module.saveAndRelease()
		} else {
			module.data.status = ChargeDefine.WithdrawStatus.Processing
			await module.saveAndRelease()
		}
	} catch (error) {
		Log.oth.error("withdraw blockchain error",module.data,error)
		if(module.data.status != ChargeDefine.WithdrawStatus.Fail) {
			await Rpc.center.call(kds.item.add,userID,module.data.itemID,module.data.itemCount,ItemDefine.SerialType.WithdrawFailed,{
				orderID:orderID,
			})
			module.data.status = ChargeDefine.WithdrawStatus.Fail
			module.data.reason = "send withdraw error"
			await module.saveAndRelease()
		}
	} finally {
		module.release()
	}
}

export let RpcChain = {
	getChargeAddress,
	getSubMainAddress,
	// withdrawReq,
	withdraw,
}