import { NewsDefine } from "../../ServerDefines/NewsDefine";


export namespace JumpUtils {
	export function doJump(jump:NewsDefine.tJump) {
		if(!jump) {
			return 
		}
		if(jump.gameID != null) {
		} else if(jump.matchID != null) {
		} else if(jump.groupID != null) {
		} else if(jump.webUrl != null) {
			cc.sys.openURL(jump.webUrl)
		}
	}
	export function isValidJump(jump:NewsDefine.tJump):boolean {
		return jump && (jump.gameID != null || jump.matchID != null || jump.groupID != null || jump.webUrl != null)
	}
}