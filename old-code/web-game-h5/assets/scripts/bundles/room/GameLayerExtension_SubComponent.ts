import { BaseGameLayerExtension } from "./BaseGameLayerExtension"
import { PlayerPotLayer, PlayerPotPos } from "./BasePlayer"
import { BasePlayerExtension } from "./BasePlayerExtension"
import { GameLayerEvents } from "./GameLayerEvents"

const { ccclass, property, menu } = cc._decorator

export enum GameLayerExtensionPosition {
	Up,
	Middle,
	Down,
}
const ccGameLayerExtensionDefine = cc.Class({
	name:"ccGameLayerExtensionDefine",
	properties:{
		comment:{
			default:"",
		},
		position:{
			type:cc.Enum(GameLayerExtensionPosition),
			default:GameLayerExtensionPosition.Up,
		},
		prefab:{
			type:cc.Prefab,
			default:null,
		},
	}
})
type GameLayerExtensionDefine = {
	position:GameLayerExtensionPosition,
	prefab:cc.Prefab,
}

const ccGamePlayerExtensionDefine = cc.Class({
	name:"ccGamePlayerExtensionDefine",
	properties:{
		comment:{
			default:"",
		},
		position:{
			type:cc.Enum(PlayerPotPos),
			default:PlayerPotPos.Status,
		},
		layer:{
			type:cc.Enum(PlayerPotLayer),
			default:PlayerPotLayer.None,
		},
		viewIDSpecial:{
			default:-1,
		},
		prefab:{
			type:cc.Prefab,
			default:null,
		},
	}
})
type GamePlayerExtensionDefine = {
	position:PlayerPotPos,
	layer:PlayerPotLayer,
	viewIDSpecial:number,
	prefab:cc.Prefab,
}
@ccclass
@menu("game/GameLayerExtension_SubComponent")
export default class GameLayerExtension_SubComponent extends cc.Component {
	@property([BaseGameLayerExtension])
	selfExtensions:BaseGameLayerExtension[] = []
	@property([cc.Node])
	selfExtensionNodes:cc.Node[] = []
	@property([ccGameLayerExtensionDefine])
	layerExtensionDefines:GameLayerExtensionDefine[] = []
	@property([ccGamePlayerExtensionDefine])
	playerExtensionDefines:GamePlayerExtensionDefine[] = []
}