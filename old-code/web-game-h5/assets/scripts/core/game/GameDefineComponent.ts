

const {ccclass, property} = cc._decorator;

let ccGameDefine = cc.Class({
	name:"ccGameDefine",
	properties: {
		name:{
			default:"GameName",
		},
		gameID:{
			default:0,
		},
		pri:{
			default:0,
		},
		version:{
			default:"1.0",
		},
		prefabName:{
			default:""
		},
		prefab:{
			type:cc.Prefab,
			default:null,
		}
	}
})
export type GameDefineType = kcore.GameDefineType

@ccclass
export default class GameDefineComponent extends cc.Component {
	@property([ccGameDefine])
	games:GameDefineType[] = []

	static instance:GameDefineComponent = null 
	onLoad() {
		GameDefineComponent.instance = this 
		this.games.sort((a,b)=>b.pri - a.pri)
	}
}

export namespace GameDefine {
	export function getGame(gameNameOrID:string | number) {
		if(typeof(gameNameOrID) == "string") {
			return GameDefineComponent.instance.games.find(v=>v.name == gameNameOrID)
		} else {
			return GameDefineComponent.instance.games.find(v=>v.gameID == gameNameOrID)
		}
		return null
	}
}