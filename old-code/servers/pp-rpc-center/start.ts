
import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Config } from "./config"
import { Rpc } from "./rpc"
import { lambdaAsyncService } from "kdweb-core/lib/service/base"
import { DB } from "../src/db"
import { KDSServerConfigType } from "../pp-base-define/ServerConfig"
import { knRpcCenter } from "kdweb-core/lib/rpc-kn/knRpcCenter"
import { knRpcTools } from "../src/knRpcTools"
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { kdutils } from "kdweb-core/lib/utils"
import { Log } from "./log"

knRpcTools.setupEnv()

class CenterService extends knRpcCenter.service {
	async getConfig(name: string) {
		let config = Config.getConfig(name)
		Log.oth.info("get config name = " + name,config)
		let ret:knRpcDefine.ServiceInfo = {
			name:config.name,
			serverPort:config.wsPort,
			serverHost:config.wsHost,
			startTime:kdutils.getMillionSecond(),
			startDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		}
		return ret 
	}
	async getKDSConfig(name: string) {
		let ret = Config.getConfig(name)
		Log.oth.info("get kds config name = " + name,ret)
		return ret 
	}

	async getConfigBlur(params:{
		prefix?:string,
		suffix?:string,
		pattern?:string,
	}) {
		let configs = Config.getBlur(params)
		Log.oth.info("get config blur params = ",params,configs)
		let ret:knRpcDefine.ServiceInfo[] = []
		for(let config of configs) {
			ret.push({
				name:config.name,
				serverPort:config.wsPort,
				serverHost:config.wsHost,
				startTime:kdutils.getMillionSecond(),
				startDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
			})
		}
		return ret 
	}
	async getKDSConfigBlur(params:{
		prefix?:string,
		suffix?:string,
		pattern?:string,
	}) {
		let configs = Config.getBlur(params)
		if(!configs) {
			Log.oth.info("get kds config blur failed = ",params)
			return null 
		}
		Log.oth.info("get kds config blur params = ",params,configs)
		return configs 
	}

	initCustom() {
		this.app.addInstance("/config/getblur",lambdaAsyncService.create(async (params:{
			prefix?:string,
			suffix?:string,
			pattern?:string
		})=>{
			return {
				configs:await this.getConfigBlur(params)
			}
		}))
		this.app.addInstance("/config/getkdsblur",lambdaAsyncService.create(async (params:{
			prefix?:string,
			suffix?:string,
			pattern?:string
		})=>{
			return {
				configs:await this.getKDSConfigBlur(params)
			}
		}))
	}
}
new CenterService(Config.myConfig.servicePort)

Rpc.init()