import { GameSet } from "../ServerDefines/GameSet";
import { ICreateGameDelegate } from "../kds/UI/CreateGame/ICreateGameDelegate";
import { GameConfigSerialize } from "./GameConfigSerialize";
import { GameConfigSerialize_Texas } from "./GameConfigSerialize_Texas";
import { GameConfig_Texas } from "./GameConfig_Texas";


export type GameConfigCreateFunc = (gameSet:GameSet,delegate:ICreateGameDelegate,opt:any)=>void
let gameConfigs = new Map<number,tGameConfig>()
let gameCreateFuncs = new Map<number,GameConfigCreateFunc>()
let gameSerialize = new Map<number,any>()
export namespace GameConfigDefines {
	export function getGameIDs() {
		let ret:number[] = []
		gameConfigs.forEach(function(v,k) {
			ret.push(k)
		})
		return ret 
	}
	export function getGameConfig(gameID:number) {
		return gameConfigs.get(gameID)
	}

	export function parseGameConfig(gameSet:GameSet) {
		let ret:tParsedGameConfig = null 

		return ret 
	}
	export function getCreateFunc(gameID:number) {
		let func = gameCreateFuncs.get(gameID)
		return func 
	}
	export function getSerialize(gameSet:GameSet):GameConfigSerialize {
		let clazz = gameSerialize.get(gameSet.gameID)
		if(clazz) {
			let config = getGameConfig(gameSet.gameID)
			return new clazz(gameSet,config)
		}
		return null 
	}
}

gameConfigs.set(GameConfig_Texas.gameID,GameConfig_Texas.config)
gameSerialize.set(GameConfig_Texas.gameID,GameConfigSerialize_Texas)

