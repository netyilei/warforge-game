import { GameSet } from "../../ServerDefines/GameSet"
import { Config } from "../Config"


enum LayerState {
	None,
	Login,
	Lobby,
	Game,
	Tea,
}

let cachedRoomID:number = null
let cacheOnLaunch = false 

let srsLogic:kcore.LogicSrsAction = null
let layerState = LayerState.None
let currentRoomID:number = null
export namespace LayerTools {
	function keepSrsLogic() {
		if(srsLogic != null) {
			return srsLogic
		}
		srsLogic = kcore.logic.startLogic(kcore.LogicSrsAction)
		kcore.nodeCycle.listenDestroy(srsLogic.node,function() {
			srsLogic = null
		})
		return srsLogic
	}
	export function getLayerState() {
		return layerState
	}
	export function getCurrentRoomID() {
		return currentRoomID
	}
	export function setCurrentRoomID(roomID:number) {
		currentRoomID = roomID
		if(roomID != null) {
			layerState = LayerState.Game
		}
	}
	export function login() {
		setCurrentRoomID(null)

		layerState = LayerState.Login
		kcore.log.info("[LayerTools] login")
		kcore.logic.stopAll()
		srsLogic = null 
		
		
		kcore.log.info("[LayerTools] init login url = " + Config.loginUrl)
		kcore.httpAK.loginUrl = Config.loginUrl
		kcore.httpAK.lobbyUrl = null 
		kcore.httpAK.ak = null 
		kcore.gnet.close()
		kcore.gnet.wsHost = null 

		kcore.ui.popStaticAll()

		// Web.defaultErrorFunc = function() {
		// 	console.log("web error")
		// 	//kcore.ui.push("MainLayer")
		// }
		kcore.ui.push("LoginLayer",true)
	}

	export function lobby(first?:boolean) {
		setCurrentRoomID(null)

		layerState = LayerState.Lobby
		kcore.log.info("[LayerTools] lobby")
		keepSrsLogic()
		if(!first) {
			let layerName = kcore.data.get("lobbyName") || "LobbyMainLayer"
			kcore.ui.push(layerName)
		}
	}
	

	export function enterGame(boxCode:string,failState?:LayerState) {
		setCurrentRoomID(null)

		kcore.log.info("[LayerTools] enterGame boxCode = " + boxCode)
		keepSrsLogic().enterGame(boxCode)
	}

	export function enterGameByRoomID(roomID:number,failState?:LayerState) {
		setCurrentRoomID(null)

		kcore.log.info("[LayerTools] enterGameByRoomID roomID = " + roomID)
		keepSrsLogic().enterGame(roomID)
	}
	export function enterGameByOnLaunch(roomID:number) {
		setCurrentRoomID(null)

		kcore.log.info("[LayerTools] enterGameByOnLaunch roomID = " + roomID)
		keepSrsLogic().enterGame(roomID)
	}

	export async function createGame(gameSet:GameSet) {
		// setCurrentRoomID(null)

		// kcore.log.info("[LayerTools] createGame gameSet = ",gameSet)
		// let res = await Req.createRoom({gameData:gameSet.gameData})
		// if(res.errCode) {
		// 	TipFunc.push("提示",res.errMsg || "创建房间失败",1)
		// 	return null 
		// }
		// rcStorage.setValue("boxCodeCache",{
		// 	boxCode:res.roomData.boxCode
		// })
		// return res.roomData
	}
	
	export function enterTea(codeOrID:string | number,failState?:LayerState) {
		setCurrentRoomID(null)
		kcore.log.info("[LayerTools] enterTea codeOrID = " + codeOrID)

		kcore.ui.push("TeaLayer",codeOrID)
		// layerState = LayerState.Tea
		// let callback = function(b,reason) {
		// 	if(!b) {
		// 		if(failState != null) {
		// 			TipFunc.push("提示",reason || "进入亲友圈失败",1,function() {
		// 				switch(failState) {
		// 					case LayerState.Login: {
		// 						LayerTools.login()
		// 					} break 
		// 					case LayerState.Tea:
		// 					case LayerState.Lobby: 
		// 					default: {
		// 						LayerTools.lobby()
		// 					} break 
		// 				}
		// 			})
		// 		} else {
		// 			TipFunc.push("提示",reason || "进入亲友圈失败")
		// 		}
		// 	}
		// }
		// if(typeof(codeOrID) == "string") {
		// 	keepSrsLogic().enterTea(codeOrID,callback)
		// } else {
		// 	keepSrsLogic().enterTeaByID(codeOrID,callback)
		// }
	}

	// export function setCachedNextRoomID(roomID:number,useLaunch?:boolean) {
	// 	cachedRoomID = roomID
	// 	cacheOnLaunch = useLaunch
	// }
	// export function getCachedNextRoomID() {
	// 	return cachedRoomID
	// }
	// export function getCachedOnLaunch() {
	// 	return cacheOnLaunch
	// }
	// export function clearCachedNextRoomID() {
	// 	cachedRoomID = null
	// 	cacheOnLaunch = null 
	// }

}