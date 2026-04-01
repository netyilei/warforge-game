import { KDSServerConfigType, ServerConfig, ServerValues } from "../pp-base-define/ServerConfig";
import { kdlog } from "kdweb-core/lib/log";
import { LoginLobbyDefine } from "../pp-base-define/LoginLobbyDefine";
import { LocalConfig } from "../pp-base-define/LocalConfig";
import { Log } from "./log";

type LocalConfigType = {
	defaultAdmins:{
		account:string,
		pwdMD5:string,
	}[]
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
	export let localConfig:LocalConfigType = js
}

if(!ServerValues.logEngine) {
	kdlog.enabled.rpc = false
	kdlog.enabled.rpcRemote = false
	kdlog.enabled.req = false
	kdlog.enabled.ws = false
	kdlog.enabled.db = false
	kdlog.enabled.engine = false
}