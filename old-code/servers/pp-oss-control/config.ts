import { ServerConfig, ServerValues } from "../pp-base-define/ServerConfig";
import { kdlog } from "kdweb-core/lib/log";
import { LocalConfig } from "../pp-base-define/LocalConfig";
import { KDSServerConfigType } from "../pp-base-define/ServerConfig";
import { Log } from "./log";



export type OSSConfigType = {
	name:string,
	cdnPrefix:string,
	iconOSSPathPrefix:string,
	region:string,
	bucketName:string,
	key:string,
	secret:string,

	type:string,
}

export type LocalOSConfigType = {
	name:string,
	cdnPrefix:string,
	localPath:string,
	type:string,
}
type localConfigType = {
	oss:OSSConfigType[], 
	local:LocalOSConfigType[],
	defaultOSS:string,
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
}

if(!ServerValues.logEngine) {
	kdlog.enabled.rpc = false
	kdlog.enabled.rpcRemote = false
	kdlog.enabled.req = false
	kdlog.enabled.ws = false
	kdlog.enabled.db = false
	kdlog.enabled.engine = false
}