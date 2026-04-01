import { BaseGameLayerExtension } from "./BaseGameLayerExtension"
import { PlayerPotLayer, PlayerPotPos } from "./BasePlayer"
import { BasePlayerExtension } from "./BasePlayerExtension"
import { GameLayerEvents } from "./GameLayerEvents"
import GameLayerExtension_SubComponent, { GameLayerExtensionPosition } from "./GameLayerExtension_SubComponent"

const { ccclass, property, menu } = cc._decorator

const ccBaseGameLayerPlayerPotProxyDefine = cc.Class({
	name:"ccBaseGameLayerPlayerPotProxyDefine",
	properties:{
		node:{
			type:cc.Node,
			default:null,
		},
		pos:{
			type:cc.Enum(PlayerPotPos),
			default:PlayerPotPos.Status,
		},
		refNoReset:{
			default:false,
		},
		useLayer:{
			default:false,
		},
		layer:{
			type:cc.Enum(PlayerPotLayer),
			default:PlayerPotLayer.None
		},
	}
})
type BaseGameLayerPlayerPotProxyDefine = {
	node:cc.Node,
	pos:PlayerPotPos,
	refNoReset:boolean,
	useLayer:boolean,
	layer:PlayerPotLayer,
}

const ccBaseGameLayerPlayerViewChairMap = cc.Class({
	name:"ccBaseGameLayerPlayerViewChairMap",
	properties:{
		userCount:{
			default:-1,
		},
		viewID:{
			default:-1
		},
	}
})
type BaseGameLayerPlayerViewChairMap = {
	userCount:number,
	viewID:number,
}
export const ccBaseGameLayerPlayerPositionDefine = cc.Class({
	name:"ccBaseGameLayerPlayerPositionDefine",
	properties:{
		viewIDs:{
			type:[ccBaseGameLayerPlayerViewChairMap],
			default:[],
		},
		node:{
			type:cc.Node,
			default:null
		},
		playerOnBoard:{
			default:true,
		},
		playerPrefab:{
			type:cc.Prefab,
			default:null,
		},
		potProxyNodes:{
			type:[ccBaseGameLayerPlayerPotProxyDefine],
			default:[],
		}
	}
})
export type BaseGameLayerPlayerPositionDefine = {
	viewIDs:BaseGameLayerPlayerViewChairMap[],
	node:cc.Node,
	playerOnBoard:boolean,
	playerPrefab:cc.Prefab,
	potProxyNodes:BaseGameLayerPlayerPotProxyDefine[],
}

@ccclass
@menu("game/GameLayerPlayer_SubComponent")
export default class GameLayerPlayer_SubComponent extends cc.Component {
	@property([ccBaseGameLayerPlayerPositionDefine])
	playerDefines:BaseGameLayerPlayerPositionDefine[] = []
}