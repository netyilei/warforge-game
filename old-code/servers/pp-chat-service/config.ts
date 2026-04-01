import { KDSServerConfigType, ServerConfig, ServerValues } from "../pp-base-define/ServerConfig";
import { kdlog } from "kdweb-core/lib/log";
import { LocalConfig } from "../pp-base-define/LocalConfig";
import { Log } from "./log";

type localConfigType = {
	mainIndex:boolean,
}

let js = null 
if(process.argv.length > 2) {
	js = LocalConfig.custom(process.argv[2])
	Log.oth.info("use system argv fileName = " + process.argv[2])
} else {
	js = LocalConfig.js
}

export namespace Config {
	export let localConfig:localConfigType = js
	export let myName = process.env.sname
	export let kdsConfig:KDSServerConfigType
	export let otherConfig:{
		userWSPort:number,
		userWSHost:string,

		userServiceHost:string,
		userServicePort:number,

		internalPort:number,
		internalHost:string,
	}
}

if(!ServerValues.logEngine) {
	kdlog.enabled.rpc = false
	kdlog.enabled.rpcRemote = false
	kdlog.enabled.req = false
	kdlog.enabled.ws = false
	kdlog.enabled.db = false
	kdlog.enabled.engine = false
}