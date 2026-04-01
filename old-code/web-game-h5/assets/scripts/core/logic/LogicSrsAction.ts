import { GSMatchUserMsg } from "../../ServerDefines/GSMatchUserMsg"
import { RoomDefine } from "../../ServerDefines/RoomDefine"
import { SrsUserMsg } from "../../ServerDefines/SrsUserMsg"
import { LogicBase } from "./LogicBase"

export class LogicSrsAction extends LogicBase {
	onLogicStart() {
		kcore.gnet(this.node)
			.listenConnected(					kcore.api.handler(this,this.handleConnected))
			.listenConnectFailed(				kcore.api.handler(this,this.handleConnectFailed))
			.listenClosed(						kcore.api.handler(this,this.handleClosed))

			.listen(SrsUserMsg.Login,			kcore.api.handler(this,this.handleLogin))
			.listen(SrsUserMsg.EnterRoom,		kcore.api.handler(this,this.handleEnterRoom))
			.listen(SrsUserMsg.EnterGroup,		kcore.api.handler(this,this.handleEnterGroup))
			//.listen(SrsUserMsg.Tea,				kcore.api.handler(this,this.handleEnterTea))
			.listen(SrsUserMsg.Heart,			kcore.api.handler(this,this.handleHeart))
			.listen(SrsUserMsg.SimpleHeart,		kcore.api.handler(this,this.handleHeart))

			.listen(GSMatchUserMsg.MatchStartEnterRoom, kcore.api.handler(this,this.handleMatchStartEnterRoom))

			// .listen(SrsUserNotify.EnterLobby,	kcore.api.handler(this,this.handleNotifyEnterLobby))
			// .listen(SrsUserNotify.EnterRoom,	kcore.api.handler(this,this.handleNotifyEnterRoom))
			//.listen(SrsUserNotify.EnterTea,		kcore.api.handler(this,this.handleNotifyEnterTea))
			// .listen(SrsUserNotify.Error,		kcore.api.handler(this,this.handleNotifyError))
			
		let self = this 
		this.pushAction(
			ActionType.Connect,
			PushType.Oper_ClearAll | PushType.Append,
			<Data_Connect>{
				delaySec:0,
				active:false,
			}
		)
		// new MatchNotifyMgr(this.node)
	}

	enterGame(boxCodeOrRoomID:string | number,udp?:boolean) {
		if(typeof(boxCodeOrRoomID) == "string") {
			this.pushAction(
				ActionType.SendEnterGame,
				PushType.Oper_ClearMain | PushType.Append,
				<Data_SendEnterGame>{
					boxCode:boxCodeOrRoomID,
					udp:udp,
					delaySec:0,
				}
			)
		} else {
			this.pushAction(
				ActionType.SendEnterGame,
				PushType.Oper_ClearMain | PushType.Append,
				<Data_SendEnterGame>{
					roomID:boxCodeOrRoomID,
					udp:udp,
					delaySec:0,
				}
			)
		}
	}

	checkConnect() {
		if(kcore.gnet.isConnected()) {
			return true 
		}
		this.pushAction(
			ActionType.CheckConnect,
			PushType.Oper_ClearMain | PushType.Top,
			<Data_Common>{
				delaySec:1,
			}
		)
		return false 
	}

	private actions_:SrsAction[] = []
	pushAction(type:ActionType,oper:PushType,data:any) {
		kcore.log.info("[SRS] handle push type = " + type + " oper = " + oper + " data = " + JSON.stringify(data))
		let action:SrsAction = {
			typeFlag:kcore.flag(type),
			pushFlag:kcore.flag(oper),
			data:data,
		}
		let mainType = action.typeFlag.check(0xF00)
		if(action.pushFlag.contains(PushType.Oper_ClearAll)) {
			this.actions_.splice(0)
		} else if(action.pushFlag.contains(PushType.Oper_ClearMain)) {
			for(let i = this.actions_.length - 1; i >= 0 ; i --) {
				let other = this.actions_[i]
				if(other.typeFlag.check(0xF00) == mainType) {
					kcore.log.info("[SRS] clear type = " + other.typeFlag.n)
					this.actions_.splice(i,1)
				}
			}
		}
		if(action.pushFlag.contains(PushType.Top)) {
			this.actions_.splice(0,0,action)
		} else {
			this.actions_.push(action)
		}

		switch(type) {
			case ActionType.Connect: {
				this.waitForWSClosed_ = false
				this.logined_ = false 
				this.prevHeart_ = 0
				this.prevSendHeartTime_ = 0
				kcore.gnet.close()
			} break 
			case ActionType.Stop: {

			} break 
			case ActionType.Reconnect: {
				this.waitForWSClosed_ = false
				this.logined_ = false 
				this.prevHeart_ = 0
				this.prevSendHeartTime_ = 0
				kcore.gnet.close()
			} break 
			case ActionType.CheckConnect: {

			} break 
			case ActionType.SendEnterGame: {

			} break 
			case ActionType.EnterGame: {

			} break 
		}
	}

	private logined_ = false 
	private prevHeart_ = 0
	private prevSendHeartTime_ = 0
	private waitForWSClosed_ = false 
	onLogicUpdate(dt:number) {
		if(kcore.gnet.isConnected() && this.logined_) {
			let time = Date.now()
			let recvTimeout = 5000
			if(this.waitForWSClosed_) {
				recvTimeout = 1000
			}
			// 收到上一个心跳4秒后才能发下一个心跳
			if(this.prevHeart_ == 0 || (this.prevSendHeartTime_ == 0 && (time - this.prevHeart_) > 4000)) {
				this.sendHeart(time)
				//this.prevHeartSended_ = true 
			} else if(this.prevSendHeartTime_ > 0 && (time - this.prevSendHeartTime_) > recvTimeout) {
				// 第二次接收超时，强制重连
				if(this.waitForWSClosed_) {
					kcore.log.info("[SRS] heart recv timeout again, force reconnect")
					this.pushAction(
						ActionType.Connect,
						PushType.Oper_ClearMain | PushType.Top,
						<Data_Connect>{
							delaySec:1,
							active:false,
						}
					)
					return 
				}
				// 第一次接收超时，等待Websocket响应
				kcore.log.info("[SRS] heart recv timeout, send heart again")
				this.waitForWSClosed_ = true
				this.pushAction(
					ActionType.CheckConnect,
					PushType.Oper_ClearMain | PushType.Top,
					<Data_Common>{
						delaySec:1,
					}
				)
				this.sendHeart(time)
			}
		}
		let action = this.actions_[0]
		if(!action) {
			return 
		}
		{
			let data:Data_Common = action.data
			if(data && data.delaySec != null && data.delaySec > 0) {
				data.delaySec -= dt 
				return 
			}
		}
		try {
			kcore.log.info("[SRS] do action type = " + action.typeFlag.n + " data = " + JSON.stringify(action.data))

			switch(action.typeFlag.n) {
				case ActionType.Connect: {
					if(!action.data.active) {
						action.data.active = true 
						kcore.gnet.connect()
					}
				} break 
				case ActionType.Stop: {
					kcore.gnet.close()
				} break 
				case ActionType.Reconnect: {
					if(!action.data.active) {
						action.data.active = true 
						kcore.gnet.connect()
					}
				} break 
				case ActionType.CheckConnect: {
					kcore.log.info("[SRS] check connect action = " + kcore.gnet.isConnected())
					if(!kcore.gnet.isConnected()) {
						this.pushAction(
							ActionType.Connect,
							PushType.Oper_ClearMain | PushType.Top,
							<Data_Connect>{
								delaySec:1,
								active:false,
							}
						)
					}
				} break 
				case ActionType.SendEnterGame: {
					let data = <Data_SendEnterGame>action.data
					kcore.gnet.send(SrsUserMsg.EnterRoom,{
						boxCode:data.boxCode,
						roomID:data.roomID,
						enterReq:{
							udp:data.udp,
							location:null,
						},
					})
				} break 
				case ActionType.EnterGame: {
					let data = <Data_EnterGame>action.data
					kcore.layer.enterGameByRoomID(data.roomID)
				} break 
			}
		} catch (error) {
			console.error("[SRS] action failed " + JSON.stringify(action),error)
		}
		switch(action.typeFlag.n) {
			case ActionType.Stop: 
			case ActionType.CheckConnect: 
			case ActionType.SendEnterGame: 
			case ActionType.EnterGame: {
				let idx = this.actions_.indexOf(action)
				if(idx >= 0) {
					this.actions_.splice(0,1)
				}
			} break 
		}
	}

	clearActionsAndClose() {
		this.actions_ = []
		kcore.gnet.close()
	}

	onLogicBlock() {
		return "正在连接"
	}

	onLogicStop(): void {
		kcore.log.info("onLogicStop")
		this.clearActionsAndClose()
	}

	sendHeart(time?:number) {
		time = time == null ? Date.now() : time
		this.prevHeart_ = time 
		this.prevSendHeartTime_ = time 
		kcore.gnet.send(SrsUserMsg.SimpleHeart,{})
	}

	handleHeart() {
		this.prevSendHeartTime_ = 0
	}

	private firstConnect_ = true 
	handleConnected() {
		kcore.gnet.send(SrsUserMsg.Login,{ak:kcore.httpAK.ak})
	}

	handleConnectFailed() {
		kcore.log.info("[logic-lobby] connect failed")
		this.setBlockVisible(false)

		this.logined_ = false 
		this.clearActionsAndClose()
		kcore.tip.push("提示","服务器连接失败",1,function() {
			kcore.layer.login()
		})
	}

	handleClosed() {
		this.setBlockVisible(false)
		kcore.log.info("[logic-lobby] handle ws closed")
		this.pushAction(
			ActionType.Connect,
			PushType.Oper_ClearMain | PushType.Top,
			<Data_Connect>{
				delaySec:1,
				active:false,
			}
		)
	}

	handleLogin(t:SrsUserMsg.tLoginRes) {
		kcore.log.info("[logic-lobby] login ret = " + t.success)
		this.setBlockVisible(false)
		let action = this.actions_[0]
		if(action && action.typeFlag.n == ActionType.Connect) {
			this.actions_.splice(0,1)
		}
		if(t.success) {
			this.logined_ = true 
			if(t.roomID) {
				// 继续进入游戏
				kcore.layer.enterGameByRoomID(t.roomID)
			} else {
				// if(!kcore.ui.repushBoard()) {
					kcore.layer.lobby()
				// }
			}
		} else {
			this.logined_ = false 
			this.clearActionsAndClose()
			kcore.tip.push("提示","网关登录失败",1,function() {
				kcore.layer.login()
			})
		}
	}
	
	handleEnterRoom(t:SrsUserMsg.tEnterRoomRes) {
		// this.setBlockVisible(false)
		// if(!t.success) {
		// 	//kcore.tip.push("提示","进入房间失败")
		// 	this.onCallback(false,t.reason)
		// } else {
		// 	this.onCallback(true)
		// }
		if(!t.b) {
			kcore.tip.push("提示",t.reason || "进入游戏失败",1,(b)=>{
				kcore.layer.lobby()
			})
		} else {
			let def = kcore.game.getGame(t.gameID)
			if(def == null) {
				kcore.log.info("[SRS] cannot enter game id = " + t.gameID,t)
				return 
			}
			// kcore.gnet.getTcp().startCache()
			kroom.env.bundleName = null 
			if(def.prefab) {
				kcore.ui.push(def.prefab)
			} else {
				kroom.env.bundleName = 
					kcore.bundle.getBundleNameByAssetName(def.prefabName)
					||
					kcore.bundle.getBundleNameByAssetName("layers/" + def.prefabName)
				kcore.ui.push(def.prefabName)
			}
		}
	}

	handleEnterGroup(t:SrsUserMsg.tEnterGroupRes) {
		if(!t.roomID) {
			kcore.log.error("[SRS] enter group failed",t)
		} else {
			kcore.layer.enterGameByRoomID(t.roomID)
			// let def = kcore.game.getGame(t.gameData.gameID)
			// if(def == null) {
			// 	kcore.log.info("[SRS] cannot enter group game id = " + t.gameData.gameID,t)
			// 	return 
			// }
			// // kcore.gnet.getTcp().startCache()
			// kroom.env.bundleName = null 
			// if(def.prefab) {
			// 	kcore.ui.push(def.prefab)
			// } else {
			// 	kroom.env.bundleName = 
			// 		kcore.bundle.getBundleNameByAssetName(def.prefabName)
			// 		||
			// 		kcore.bundle.getBundleNameByAssetName("layers/" + def.prefabName)
			// 	kcore.ui.push(def.prefabName)
			// }
		}
	}
	
	// handleNotifyEnterRoom(t:SrsUserNotify.tEnterRoom) {
	// 	kcore.log.info("[handleNotifyEnterRoom] ",t)
	// 	kcore.layer.setCurrentRoomID(t.gameID)
	// 	let def = kcore.game.getGame(t.gameID)
	// 	if(def == null) {
	// 		kcore.log.info("[SRS] cannot enter game id = " + t.gameID,t)
	// 		return 
	// 	}
	// 	kcore.gnet.getTcp().startCache()
	// 	if(def.prefab) {
	// 		kcore.ui.push(def.prefab)
	// 	} else {
	// 		kcore.ui.push(def.prefabName)
	// 	}
	// }

	// handleNotifyError(t:SrsUserNotify.tError) {
	// 	kcore.log.info("[SRS] error from srs ",t)
	// 	kcore.layer.login()
	// }

	handleMatchStartEnterRoom(t:GSMatchUserMsg.tMatchStartEnterRoomReq) {
		kcore.log.info("[SRS] handleMatchStartEnterRoom",t)
		kcore.layer.enterGameByRoomID(t.roomID)
	}
	
}

enum ActionType {
	Main_Tcp = 0x100,
	Connect,
	Stop,
	Reconnect,
	CheckConnect,

	Main_Layer = 0x300,
	SendEnterGame,
	EnterGame,
	WXOnShow,
}

enum PushType {
	Oper_ClearMain 	= 0x100,
	Oper_ClearAll	= 0x200,

	Append = 1,		// 追加
	Top,			// 插入到列队最前
}
type SrsAction = {
	typeFlag:kcore.IFlag,
	pushFlag:kcore.IFlag,
	data:any,
}

type Data_Common = {
	delaySec:number,
}
type Data_SendEnterGame = {
	delaySec:number,
	boxCode?:string,
	roomID?:number,
	udp?:boolean,
}
type Data_EnterGame = {
	delaySec:number,
	boxCode?:string,
	roomID?:number,
}
type Data_Connect = {
	delaySec:number,
	active:boolean,
}

type Data_WXOnShow = {
	res:any,
}