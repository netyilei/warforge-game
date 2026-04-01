
import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Config } from "./config"
import { Rpc } from "./rpc"
import { baseService, lambdaAsyncService } from "kdweb-core/lib/service/base"
import { Log } from "./log"
import { knRpcTools } from "../src/knRpcTools"
import { DB } from "../src/db"
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "../src/TimeDate"
import md5 = require("md5")
import { DBDefine } from "../pp-base-define/DBDefine"
import { GMUser } from "./service/GMUser"
import { AKVerifyFuncs } from "../src/AKVerifyFuncs"

let AKVerifyFunctional = AKVerifyFuncs.ConsoleVerifyFunctional
let AKVerifyFunctional_Record = AKVerifyFuncs.ConsoleVerifyFunctional_Record

Rpc.init()
.then(async ()=>{
	let config = await knRpcTools.getKDSConfig(Config.myName)
	let app = new wcore.service.entity(config.servicePort)
	app.setAllowOrigin()
	// 获取用户展示信息
	// 需要展示登录时返回的loginData，和这个接口返回的邀请码(leaderTag)
	app.addInstance("/user/getdisplay",				AKVerifyFunctional(GMUser.getDisplay))
	// 获取用户列表
	app.addInstance("/user/getusers",				AKVerifyFunctional(GMUser.getUsers))
	// 根据道具数量获取用户列表
	app.addInstance("/user/getuserswithvalue",		AKVerifyFunctional(GMUser.getUsersWithValue))
	// 获取用户流水
	app.addInstance("/user/getserials",				AKVerifyFunctional(GMUser.getSerials))

	app.listen()
})