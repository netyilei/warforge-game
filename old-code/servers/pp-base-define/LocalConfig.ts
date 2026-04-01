import path = require("path")

export class LocalConfig {
	static config = null
	static get js() {
		if(LocalConfig.config == null) {
			
			try {
				let projDirname = path.resolve()
				let configPath = path.join(projDirname,"local-config.js")
				LocalConfig.config = require(configPath)
				console.log("log local config success " + JSON.stringify(LocalConfig.config))
			} catch(error) {
				console.log(error)
			}
		}
		return LocalConfig.config
	}
	static custom(fileName:string) {
		if(LocalConfig.config == null) {
			
			try {
				let projDirname = path.resolve()
				let configPath = path.join(projDirname,fileName)
				LocalConfig.config = require(configPath)
				console.log("log local config success " + JSON.stringify(LocalConfig.config))
			} catch(error) {
				console.log(error)
			}
		}
		return LocalConfig.config
	}
}