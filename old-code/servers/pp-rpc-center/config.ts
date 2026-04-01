import { KDSServerConfigType, ServerConfig, ServerValues } from "../pp-base-define/ServerConfig";
import { kdlog } from "kdweb-core/lib/log";
import { LocalConfig } from "../pp-base-define/LocalConfig";
import { Log } from "./log";

import path = require("path")
import fs = require("fs")

type localConfigType = {
	name:string,
}
let js = null 
if(process.argv.length > 2) {
	js = LocalConfig.custom(process.argv[2])
	Log.oth.info("use system argv fileName = " + process.argv[2])
} else {
	js = LocalConfig.js
}

let listPath = path.join(path.resolve(),"server_list.json")
export namespace Config {
	export let localConfig:localConfigType = js
	export let myName = process.env.sname || localConfig.name
	export let myConfig = getConfig(myName)
	export function getConfig(name:string) {
		let t:{
			name:string,
			server:string,
			wsPort:number,
			wsHost:string,
			servicePort:number,
			serviceHost:string,
			other:any,
		}[] = JSON.parse(fs.readFileSync(listPath,"utf-8"))
		let config:KDSServerConfigType = t.find(v=>v.name == name)
		return config
	}
	export function getBlur(params:{
		prefix?:string,
		suffix?:string,
		pattern?:string,
	}) {
		let t:{
			name:string,
			server:string,
			wsPort:number,
			wsHost:string,
			servicePort:number,
			serviceHost:string,
			other:any,
		}[] = JSON.parse(fs.readFileSync(listPath,"utf-8"))
		let ret:KDSServerConfigType[] = []
		for(let config of t) {
			if(params.prefix && config.name.startsWith(params.prefix)) {
				ret.push(config)
			} else if(params.suffix && config.name.endsWith(params.suffix)) {
				ret.push(config)
			} else if(params.pattern && config.name.includes(params.pattern)) {
				ret.push(config)
			}
		}
		return ret 
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