import { NewsDefine } from "../../ServerDefines/NewsDefine";
import { GameConfig_Texas } from "../../games/GameConfig_Texas";


const gameID2GroupLayer: Map<number, string> = new Map()
gameID2GroupLayer.set(GameConfig_Texas.gameID, "GroupLayer_Texas")

export namespace JumpUtils {
	export function doJump(jump: NewsDefine.tJump) {
		if (!jump) {
			return
		}
		if (jump.groupID != null) {
			kcore.ui.push("EnterGroupLayer", jump.groupID)
		} else if (jump.matchID != null) {
			kcore.ui.push("MatchDetailLayer", { matchID: jump.matchID })
		} else if (jump.gameID != null) {
			let layerName = gameID2GroupLayer.get(jump.gameID)
			if (layerName) {
				kcore.ui.push(layerName)
			} else {
				kcore.toast.push("The game is not yet available")
			}
		} else if (jump.webUrl != null) {
			cc.sys.openURL(jump.webUrl)
		}
	}
	export function isValidJump(jump: NewsDefine.tJump): boolean {
		return jump && (jump.gameID != null || jump.matchID != null || jump.groupID != null || jump.webUrl != null)
	}
}