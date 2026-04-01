

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { DB } from "../src/db"
import { DBDefine } from "../pp-base-define/DBDefine"
import { serviceEntity } from "kdweb-core/lib/service/entity"
import { CregisCallbackService } from "./entity/CregisCallbackService"
import { Module_ChargeWalletUserAddress } from "../pp-base-define/DM_ChargeDefine"
import { CregisService } from "./entity/CregisService"
import { Log } from "./log"
import { PaypalService } from "./entity/PaypalService"

Rpc.init(async ()=>{
	let app = new serviceEntity(Config.kdsConfig.servicePort)
	app.setAllowOrigin()
	app.addInstance("/callback/charge",new CregisCallbackService.ChargeCallback)
	app.addInstance("/callback/withdraw",new CregisCallbackService.WithdrawCallback)
	app.addInstance("/callback/paypal",new PaypalService.WebhookService)
	app.listen()

	let redis = DB.getRedis()
	let callbackHost = await redis.hget("t_cregis_service","cache-callback")
	if(callbackHost && callbackHost != Config.otherConfig.callbackHost) {
		Log.oth.info("CregisService update callback host ",callbackHost," -> ",Config.otherConfig.callbackHost)
		let addressInfos = await Module_ChargeWalletUserAddress.get({})
		for(let info of addressInfos) {
			info.callbackUrl = callbackHost + "/callback/charge"
			await Module_ChargeWalletUserAddress.update(info)

			await CregisService.changeCallback(info.address)
			Log.oth.info("CregisService change callback ",info.address, " userID = ",info.userID)
		}
	}

	CregisService.getCoins()
})