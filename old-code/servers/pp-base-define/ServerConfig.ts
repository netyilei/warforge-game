import path = require("path")

export type KDSServerConfigType = {
	name:string,
	// http://localhost:888
	serviceHost:string,
	// ws://localhost:999
	wsHost:string,

	// 解析内容
	servicePort:number,
	wsPort:number,

	other:any,
}
let kdsConfig:{
	servers:KDSServerConfigType[]

	values:any,
} = null
try {
	let projDirname = path.resolve()
	let configPath = path.join(projDirname,"a-config.js")
	kdsConfig = require(configPath)
	console.log("log db config success " + JSON.stringify(kdsConfig))
	if(kdsConfig.servers) {
		for(let config of kdsConfig.servers) {
			if(config.serviceHost.indexOf(":") >= 0) {
				let a = config.serviceHost.split(":")
				let str = a[a.length - 1]
				let port = Number.parseInt(str)
				if(!Number.isNaN(port)) {
					config.servicePort = port 
				}
			}
			if(config.wsHost.indexOf(":") >= 0) {
				let a = config.wsHost.split(":")
				let str = a[a.length - 1]
				let port = Number.parseInt(str)
				if(!Number.isNaN(port)) {
					config.wsPort = port 
				}
			}
			console.log(JSON.stringify(config))
		}
	}
	
} catch (error) {
	console.log("load server config failed " + JSON.stringify(kdsConfig),error)
	kdsConfig = {
		servers:[],
		values:{},
	}
}

export namespace ServerConfig {
	export type ConfigType = KDSServerConfigType
	export function getConfig(name:string) {
		let arr = kdsConfig.servers
		let ret = arr.find((v)=>v.name == name)
		return ret 
	}
	export function filterConfigs(func:(config:KDSServerConfigType)=>boolean) {
		return kdsConfig.servers.filter(func)
	}

	export function getValue(name:string) {
		return kdsConfig == null ? null : kdsConfig.values[name]
	}

	export function getFullConfig() {
		return kdsConfig
	}
}

export namespace ServerValues {
	export const localIp		= ServerConfig.getValue("local-ip")

	export const projectTag		= ServerConfig.getValue("project-tag")
	
	export const rpcCenterHost 	= ServerConfig.getValue("rpc-center")
	export const rpcServiceHost	= ServerConfig.getValue("rpc-host")
	export const rpcToken 		= ServerConfig.getValue("rpc-token")
	
	export const rpcLoggerHost 	= ServerConfig.getValue("rpc-logger")

	export const srsCenterHost 	= ServerConfig.getValue("srs-center")
	export const srsToken 		= ServerConfig.getValue("srs-token")

	export const robotToken 	= ServerConfig.getValue("robot-token")

	export const dbConnectStr 	= ServerConfig.getValue("db-connect")
	export const dbSecConnectStr= ServerConfig.getValue("db-connect-sec")
	export const dbName			= ServerConfig.getValue("db-name")

	export const originDBName 	= ServerConfig.getValue("originDBName")

	export const robotCenterName= ServerConfig.getValue("robot-center-name")

	export const logInstance	= ServerConfig.getValue("log-instance")
	export const logEngine		= ServerConfig.getValue("log-engine")
}