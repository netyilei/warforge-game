// import { Web } from "../Web/Web"
// import { rcApis, rcLog } from "../../../../build/wechatgame/src/project"
// import { tGameConfig } from "./GameConfig"



// function getNameMapUrl() {
// 	return Web.gameConfigUrl + "/_pkg_name_map.json"
// }

// function getGameConfigUrl(areaID:number,gameID:number | string) {
// 	return rcApis.stringformat("{0}/{1}/{2}/gameconfig.json",Web.gameConfigUrl,areaID.toString(),gameID.toString())
// }

// let cacheNameMap = null
// // gameID - gameConfig
// let cacheGameConfigs:Map<string,tGameConfig> = null
// export namespace RemoteGameConfig {
// 	// init method
// 	export async function loadAll() {
// 		await getAllGameConfigs(true)
// 	}

// 	// non-async methods
// 	export function getGameConfigImmediately(gameID:number) {
// 		if(cacheGameConfigs == null) {
// 			return null
// 		}
// 		let ret = cacheGameConfigs.get(gameID.toString())
// 		return ret 
// 	}

// 	export function getAllGameIDsImmediately() {
// 		if(cacheNameMap == null) {
// 			return null
// 		}
// 		let idMap = cacheNameMap[Web.areaID]
// 		if(idMap == null) {
// 			return null
// 		}
// 		let ids = Object.keys(idMap)
// 		let ret:number[] = []
// 		for(let id of ids) {
// 			ret.push(Number.parseInt(id))
// 		}
// 		return ret 
// 	} 

// 	export function getPkgNameImmediately(gameID:number) {
// 		if(cacheNameMap == null) {
// 			return null
// 		}
// 		let idMap = cacheNameMap[Web.areaID]
// 		if(idMap == null) {
// 			return null
// 		}
// 		let name = idMap[gameID]
// 		return name 
// 	}

// 	// async methods
// 	export async function getGameConfig(gameID:number) {
// 		let map = await getAllGameConfigs()
// 		if(map == null) {
// 			return null
// 		}
// 		let ret = map.get(gameID.toString())
// 		return ret 
// 	}

// 	export async function getAllGameIDs() {
// 		let nameMap = await getNameMaps()
// 		if(nameMap == null) {
// 			return null
// 		}
// 		let idMap = nameMap[Web.areaID]
// 		if(idMap == null) {
// 			return null
// 		}
// 		let ids = Object.keys(idMap)
// 		let ret:number[] = []
// 		for(let id of ids) {
// 			ret.push(Number.parseInt(id))
// 		}
// 		return ret 
// 	}

// 	export async function getPkgName(gameID:number) {
// 		let nameMap = await getNameMaps()
// 		if(nameMap == null) {
// 			return null
// 		}
// 		let idMap = nameMap[Web.areaID]
// 		if(idMap == null) {
// 			return null
// 		}
// 		let name = idMap[gameID]
// 		return name 
// 	}

	
// 	export async function getAllGameConfigs(isReload?:boolean) {
// 		if(!isReload && cacheGameConfigs != cacheGameConfigs) {
// 			return cacheGameConfigs
// 		}
// 		let maps = await _reloadAllGameConfigs(isReload)
// 		if(maps) {
// 			cacheGameConfigs = maps
// 		}
// 		return maps
// 	}

// 	export async function loadGameConfig(gameID:number) {
// 		let nameMaps = await getNameMaps(false)
// 		if(nameMaps == null) {
// 			return null
// 		}
// 		let idNames = nameMaps[Web.areaID]
// 		if(idNames == null) {
// 			rcLog("[RemoteGameConfig] isReload all gameconfigs: idNames not found areaID = " + Web.areaID)
// 			return null
// 		}
// 		let ids = Object.keys(idNames)
// 		let url = getGameConfigUrl(Web.areaID,gameID)
// 		let data = await Web.getUrlAsync(url)
// 		if(data == null) {
// 			rcLog("[RemoteGameConfig] get game config failed areaID = " + Web.areaID + " | gameID = " + gameID)
// 			return null
// 		}
// 		let gameConfig:tGameConfig = null
// 		try {
// 			gameConfig = JSON.parse(data)
// 		} catch (error) {
			
// 		}
// 		if(gameConfig == null) {
// 			rcLog("[RemoteGameConfig] parse game config failed areaID = " + Web.areaID + " | gameID = " + gameID)
// 			return null
// 		}
// 		return gameConfig
// 	}


// 	export async function getNameMaps(isReload?:boolean) {
// 		if(!isReload && cacheNameMap != null) {
// 			return cacheNameMap
// 		}
// 		let nameMap = await _reloadNameMaps()
// 		if(nameMap) {
// 			cacheNameMap = nameMap
// 		}
// 		return nameMap
// 	}

// 	// private worker methods	
// 	async function _reloadAllGameConfigs(isReload:boolean) {
// 		let ret = new Map<string,tGameConfig>()
// 		let nameMaps = await getNameMaps(isReload)
// 		if(nameMaps == null) {
// 			return null
// 		}
// 		let idNames = nameMaps[Web.areaID]
// 		if(idNames == null) {
// 			rcLog("[RemoteGameConfig] isReload all gameconfigs: idNames not found areaID = " + Web.areaID)
// 			return null
// 		}
// 		let ids = Object.keys(idNames)
// 		for(let gameID of ids) {
// 			let url = getGameConfigUrl(Web.areaID,gameID)
// 			let data = await Web.getUrlAsync(url)
// 			if(data == null) {
// 				rcLog("[RemoteGameConfig] get game config failed areaID = " + Web.areaID + " | gameID = " + gameID)
// 				continue 
// 			}
// 			let gameConfig:tGameConfig = null
// 			try {
// 				gameConfig = JSON.parse(data)
// 			} catch (error) {
				
// 			}
// 			if(gameConfig == null) {
// 				rcLog("[RemoteGameConfig] parse game config failed areaID = " + Web.areaID + " | gameID = " + gameID)
// 				continue 
// 			}
// 			ret.set(gameID,gameConfig)
// 		}
// 		return ret 
// 	}

// 	async function _reloadNameMaps() {
// 		let data = await Web.getUrlAsync(getNameMapUrl())
// 		if(data == null) {
// 			return null
// 		}
// 		let obj = null
// 		try {
// 			obj = JSON.parse(data)
// 		} catch (error) {
// 			rcLog("[RemoteGameConfig] name map file parse failed")
// 		}
// 		return obj
// 	}
// }