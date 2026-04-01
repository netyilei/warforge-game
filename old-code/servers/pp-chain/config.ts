import { KDSServerConfigType, ServerConfig, ServerValues } from "../pp-base-define/ServerConfig";
import { kdlog } from "kdweb-core/lib/log";
import { LocalConfig } from "../pp-base-define/LocalConfig";
import { Log } from "./log";


type localConfigType = {
	pid:number,
	key:string,
	host:string, 

	paypal:{
		baseUrl:string,
		clientID:string,
		secret:string,
		sandbox:boolean,

		returnUrl:string,
		cancelUrl:string,
	}
}

let js = null 
if(process.argv.length > 2) {
	js = LocalConfig.custom(process.argv[2])
	Log.oth.info("use system argv fileName = " + process.argv[2])
} else {
	js = LocalConfig.js
}
export namespace Config {
	export let myName = process.env.sname
	export let kdsConfig:KDSServerConfigType
	export let otherConfig:{
		callbackHost:string,
	}
	export let localConfig:localConfigType = js
}

if(!ServerValues.logEngine) {
	kdlog.enabled.rpc = false
	kdlog.enabled.rpcRemote = false
	kdlog.enabled.req = false
	kdlog.enabled.ws = false
	kdlog.enabled.db = false
	kdlog.enabled.engine = false
}