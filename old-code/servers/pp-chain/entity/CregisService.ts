import { kdutils } from "kdweb-core/lib/utils"
import { Config } from "../config"
import md5 = require("md5")
import { kdreq } from "kdweb-core/lib/service/req"
import { Log } from "../log"
import { ChargeDefine } from "../../pp-base-define/ChargeDefine"


export namespace CregisService {

	let randStrs = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	export function sign(data:any) {
		let nonce = ""
		for(let i = 0 ; i < 6 ; i++) {
			let idx = Math.floor(Math.random() * randStrs.length)
			nonce += randStrs[idx]
		}
		data.nonce = data.nonce || nonce
		data.timestamp = data.timestamp || kdutils.getMillionSecond()

		let keys = Object.keys(data)
		let idx = keys.indexOf("sign")
		if(idx >= 0) {
			keys.splice(idx,1)
		}
		keys.sort()
		let str = ""
		for(let k of keys) {
			str += k + data[k]
		}
		str = Config.localConfig.key + str 

		return md5(str)
	}

	export async function post(path:string,data:any) {
		data.sign = sign(data)
		let url = Config.localConfig.host + path
		Log.oth.info("CregisService post ",url,data)
		let ret = await kdreq.postJson(url,data)
		if(ret.error || !ret.body) {
			Log.oth.error("CregisService post error ",url,ret.error)
			return null 
		}
		Log.oth.info("CregisService post ret ",url,ret.body)
		return ret.body
	}

	export async function sendWithdraw(config:ChargeDefine.tWithdrawBlockchainConfig,order:ChargeDefine.tWithdrawOrder,fromAddress?:string) {
		let currency = config.chainID + "@" + (config.contractAddress || config.chainID)
		let data = {
			"pid": Config.localConfig.pid,
			"currency": currency,
			"from_address": fromAddress,
			"to_address": order.blockchain.address,
			"amount": order.amount,
			"remark": "withdraw",
			// "memo": "null",
			"third_party_id": order.strOrderID,
			"callback_url": Config.otherConfig.callbackHost + "/callback/withdraw",
		}
		let ret = await post("/api/v1/sub_address_withdrawal",data)
		let b = ret?.code == "00000"
		if(!b) {
			Log.oth.error("CregisService sendWithdraw failed ",order.orderID,config.typeID,ret)
		}
		return b
	}
	
	export async function getAddress(userID:number,config:ChargeDefine.tChargeBlockchainConfig) {
		let data = {
			"pid": Config.localConfig.pid,
			"callback_url": Config.otherConfig.callbackHost + "/callback/charge",
			"chain_id": String(config.chainID),
			"alias": "USERID:" + String(userID),
		}
		let ret = await post("/api/v1/address/create",data)
		if(ret?.code != "00000") {
			Log.oth.error("CregisService getAddress failed ",userID,config.typeID,ret)
			return null 
		}
		return ret?.data?.address
	}
	export async function getTagAddress(tag:string,config:ChargeDefine.tChargeBlockchainConfig) {
		let data = {
			"pid": Config.localConfig.pid,
			"callback_url": Config.otherConfig.callbackHost + "/callback/charge",
			"chain_id": String(config.chainID),
			"alias": "TAG:" + String(tag),
		}
		let ret = await post("/api/v1/address/create",data)
		if(ret?.code != "00000") {
			Log.oth.error("CregisService getTagAddress failed ",tag,config.typeID,ret)
			return null 
		}
		return ret?.data?.address
	}

	export async function changeCallback(address:string) {
		let data = {
			"pid": Config.localConfig.pid,
			"address": address,
			"callback_url": Config.otherConfig.callbackHost + "/callback/charge",
		}
		let ret = await post("/api/v1/address/update",data)
		if(ret?.code != "00000") {
			Log.oth.error("CregisService changeCallback failed ",address,ret)
			return false 
		}
		return true
	}

	export async function getCoins() {
		let data = {
			"pid": Config.localConfig.pid,
		}
		let ret = await post("/api/v1/coins",data)
		if(ret?.code != "00000") {
			Log.oth.error("CregisService getCoins failed ",ret)
			return null 
		}
		Log.oth.info("CregisService getCoins ret ",JSON.stringify(ret,null,4))
		return ret?.data
	}
}