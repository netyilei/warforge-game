import { KDSServerConfigType, ServerConfig, ServerValues } from "../pp-base-define/ServerConfig";
import { kdlog } from "kdweb-core/lib/log";
import { LocalConfig } from "../pp-base-define/LocalConfig";
import { Log } from "./log";


type OtherConfig = {
	robotHost:string,
	robotPort:number,
}
export namespace Config {
	export let myName = process.env.sname
	export let otherConfig:OtherConfig
}

if(!ServerValues.logEngine) {
	kdlog.enabled.rpc = false
	kdlog.enabled.rpcRemote = false
	kdlog.enabled.req = false
	kdlog.enabled.ws = false
	kdlog.enabled.db = false
	kdlog.enabled.engine = false
}