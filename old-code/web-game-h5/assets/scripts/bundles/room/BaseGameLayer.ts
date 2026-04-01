import { UIBoardBase } from "../../core/ui/UIBoardBase";
import { TcpEvent } from "../../core/web/Tcp";
import { GameSet } from "../../ServerDefines/GameSet";
import { GSCommonMsg } from "../../ServerDefines/GSCommonMsg";
import { GSMatchUserMsg } from "../../ServerDefines/GSMatchUserMsg";
import { GSUserMsg } from "../../ServerDefines/GSUserMsg";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import { SrsUserMsg } from "../../ServerDefines/SrsUserMsg";
import BasePlayer, { PlayerPotLayer, PlayerPotPos, PlayerPotType } from "./BasePlayer";
import { GameLayerEvents } from "./GameLayerEvents";
import GameLayerExtensionManager from "./GameLayerExtensionManager";
import GameLayerPlayer_SubComponent, { ccBaseGameLayerPlayerPositionDefine, BaseGameLayerPlayerPositionDefine } from "./GameLayerPlayer_SubComponent";


const { ccclass, property } = cc._decorator

enum GameLayerAniPos {
	Board,
	Middle,
	Top,
}

const ccBaseGameLayerAniPosDefine = cc.Class({
	name:"ccBaseGameLayerAniPosDefine",
	properties:{
		pos:{
			type:cc.Enum(GameLayerAniPos),
			default:GameLayerAniPos.Board
		},
		node:{
			type:cc.Node,
			default:null,
		}
	}
})
type BaseGameLayerAniPosDefine = {
	pos:GameLayerAniPos,
	node:cc.Node,
}
@ccclass 
export default class BaseGameLayer extends UIBoardBase implements kroom.IBaseGameLayer {
	@property(cc.Prefab)
	prefabAssetManager:cc.Prefab = null
	@property(GameLayerExtensionManager)
	extensionManager:GameLayerExtensionManager = null
	@property(cc.Prefab)
	playerPrefab:cc.Prefab = null
	@property([ccBaseGameLayerPlayerPositionDefine])
	playerDefines:BaseGameLayerPlayerPositionDefine[] = []
	@property([ccBaseGameLayerAniPosDefine])
	aniPosDefines:BaseGameLayerAniPosDefine[] = []
	onLoad() {
		let subs = this.node.getComponentsInChildren(GameLayerPlayer_SubComponent) || []
		for(let sub of subs) {
			for(let def of sub.playerDefines) {
				if(!def.node) {
					continue 
				}
				this.playerDefines.push(def)
			}
		}
		kroom.env.gameLayer = this 
	}
	protected onDestroy(): void {
		kroom.env.gameLayer == this && (kroom.env.gameLayer = null)
		// super.onDestroy()
	}
	onPush(opt?:{
		fupanData?:string,
	}): void {
		this.dispMsg_ = kcore.disp()
		this.dispMsg_.link(this.node)

		kcore.gnet(this.node)
			.listen(GSUserMsg.RoomInfo, 		kcore.api.handler(this,this.handleRoomInfo))
			.listen(GSUserMsg.UserEnter, 		kcore.api.handler(this,this.handleUserEnter))
			.listen(GSUserMsg.UserExit, 		kcore.api.handler(this,this.handleUserExit))
			.listen(GSUserMsg.RoundStart, 		kcore.api.handler(this,this.handleRoundStart))
			.listen(GSUserMsg.RoundEnd, 		kcore.api.handler(this,this.handleRoundEnd))
			.listen(GSUserMsg.GameStart, 		kcore.api.handler(this,this.handleGameStart))
			.listen(GSUserMsg.GameEnd, 			kcore.api.handler(this,this.handleGameEnd))
			.listen(GSUserMsg.ScoreChange, 		kcore.api.handler(this,this.handleScoreChange))
			.listen(GSUserMsg.Online, 			kcore.api.handler(this,this.handleOnline))
			.listen(GSUserMsg.Tuoguan, 			kcore.api.handler(this,this.handleTuoguan))
			.listen(GSUserMsg.UserSitdown, 		kcore.api.handler(this,this.handleUserSitdown))
			.listen(GSUserMsg.UserStandUp, 		kcore.api.handler(this,this.handleUserStandup))
			.listen(GSUserMsg.Ready, 			kcore.api.handler(this,this.handleReady))
			.listen(GSUserMsg.GameSync, 		kcore.api.handler(this,this.handleGameSync))
			.listen(GSUserMsg.Error, 			kcore.api.handler(this,this.handleError))
			.listen(GSUserMsg.Jiesan, 			kcore.api.handler(this,this.handleJiesan))
			.listen(GSUserMsg.FupanStart, 		kcore.api.handler(this,this.handleFupanStart))

			.listen(GSMatchUserMsg.WaitForCombine, 		kcore.api.handler(this,this.handleWaitForCombine))
			.listen(GSMatchUserMsg.CombineFinished, 	kcore.api.handler(this,this.handleCombineFinished))

			.listen(GSCommonMsg.GameResult,		kcore.api.handler(this,this.handleGSCGameResult))

			.listen(TcpEvent.Message,			(msgName:string,jsonObj:any)=>{
				if(msgName != SrsUserMsg.Heart && msgName != SrsUserMsg.SimpleHeart) {
					this.dispMsg.dispatch(msgName,jsonObj)
					return 
				}
			})

		if(opt && opt.fupanData) {
			this.isFupan_ = true 
		} else {
			this.isFupan_ = false 
		}
		
		this.onInitLayer()
		.then(()=>{
			if(!this.isValid) {
				return 
			}
			this.extensionManager.onInitLayer(this)
			
			if(opt && opt.fupanData) {
				this.dispMsg.dispatch(GameLayerEvents.ON_FUPANSTART,opt.fupanData)
			} else {
				kcore.gnet.send(GSUserMsg.ReadyToEnter,{})
			}
		})
	}

	private dispMsg_:kcore.IEventDispatcher = null
	get dispMsg() {
		return this.dispMsg_
	}

	private layerInited_:boolean = false 
	get layerInited() {
		return this.layerInited_
	}

	private isRoundStart_:boolean = false 
	get isRoundStart() {
		return this.isRoundStart_
	}
	private isRoundEnd_:boolean = false 
	get isRoundEnd() {
		return this.isRoundEnd_
	}
	private ignoreBackToLobbyWhenRoundEnd_:boolean = false 
	get ignoreBackToLobbyWhenRoundEnd() {
		return this.ignoreBackToLobbyWhenRoundEnd_
	}
	set ignoreBackToLobbyWhenRoundEnd(v) {
		this.ignoreBackToLobbyWhenRoundEnd_ = v
	}
	private isJuStart_:boolean = false 
	get isJuStart() {
		return this.isJuStart_
	}
	private juStartTime_:number = 0
	get juStartTime() {
		return this.juStartTime_
	}
	private juEndTime_:number = 0
	get juEndTime() {
		return this.juEndTime_
	}
	private roundStartTime_:number = 0
	get roundStartTime() {
		return this.roundStartTime_
	}

	private roundEndTime_:number = 0
	get roundEndTime() {
		return this.roundEndTime_
	}

	private gameData_:RoomDefine.GameData = null 
	get gameData() {
		return this.gameData_
	}
	private roomInfo_:GSUserMsg.tRoomInfoNT = null 
	get roomInfo() {
		return this.roomInfo_
	}
	protected filterPlayerDefines_:BaseGameLayerPlayerPositionDefine[]
	get filterPlayerDefines() {
		return this.filterPlayerDefines_
	}

	get club() {
		return this.roomInfo?.club
	}
	get roomID() {
		return this.roomInfo?.roomID
	}
	private gameSet_:GameSet = null
	get gameSet() {
		return this.gameSet_
	}

	private users_:GSUserMsg.tUserEnterData[] = []
	get users() {
		return this.users_
	}

	private players_:kroom.IBasePlayer[] = []
	get players() {
		return this.players_
	}

	get selfChairNo() {
		let selfUserID = this.selfUserID
		let user = this.users_.find(v=>v.userID == selfUserID)
		if(!user) {
			return -1
		}
		return user.chairNo
	}
	
	get selfUser() {
		let selfUserID = this.selfUserID
		return this.users_.find(v=>v.userID == selfUserID)
	}

	get selfPlayer() {
		let selfUserID = this.selfUserID
		return this.players_.find(v=>v.userData.userID == selfUserID)
	}

	get selfUserID() {
		return kcore.data.get("login/data").userID
	}

	get isSelfWatch() {
		let chairNo = this.selfChairNo
		if(chairNo < 0) {
			return false 
		}
		return this.isChairNoWatcher(chairNo)
	}

	private isFupan_:boolean = false 
	get isFupan() {
		return this.isFupan_
	}

	private isWaitingForCombine_:boolean = false 
	get isWaitingForCombine() {
		return this.isWaitingForCombine_
	}

	chairToView(chairNo:number) {
		let view0ChairNo = this.selfChairNo
		if(this.isSelfWatch || view0ChairNo < 0) {
			view0ChairNo = 0
		}
		let ret = chairNo - view0ChairNo
		return ret < 0  ? ret + this.filterPlayerDefines.length : ret 
	}

	viewToChair(viewID:number) {
		let view0ChairNo = this.selfChairNo
		if(this.isSelfWatch || view0ChairNo < 0) {
			view0ChairNo = 0
		}
		return (viewID + view0ChairNo) % this.filterPlayerDefines.length
	}

	getWatchChairNoOffset() {
		return 100000
	}

	isChairNoWatcher(chairNo:number) {
		return chairNo >= this.getWatchChairNoOffset()
	}

	backToLobby() {
		kcore.layer.lobby()
	}

	relogin() {
		this.scheduleOnce(()=>{
			kcore.gnet(this.node).clear()
			kcore.layer.enterGameByRoomID(this.roomID)
		})
	}

	getAniPosNode(pos:kroom.GameLayerAniPos) {
		return this.aniPosDefines.find(v=>v.pos == pos)?.node
	}
	async onInitLayer() {
		let node = this.prefabAssetManager ? kcore.display.instantiate(this.prefabAssetManager) : null 
		if(node) {
			let assetManager:krenderer.IAssetManager = kcore.utils.getComponentByMethod(node,"initAssets")
			if(assetManager) {
				this.node.addChild(node)
				kcore.log.info("init asset manager prefab = " + this.prefabAssetManager.name)
				await assetManager.initAssets(this)
			} else {
				node.destroy()
				node = null 
			}
		}
	}

	onRoomInfo(msg:GSUserMsg.tRoomInfoNT) {

	}

	/**
	 * 在调用player.initPlayer之后
	 * @param player 
	 */
	onCreatePlayer(player:kroom.IBasePlayer) {

	}

	/**
	 * 在调用player.onRelease和player.node.destroy之前
	 * @param player 
	 */
	onRemovePlayer(player:kroom.IBasePlayer) {

	}

	/**
	 * 在onCreatePlayer之后
	 * @param userData 
	 * @param player 
	 */
	onUserEnter(userData:GSUserMsg.tUserEnterData,player:kroom.IBasePlayer) {

	}

	/**
	 * 在onRemovePlayer之后
	 * @param userData 
	 */
	onUserExit(userData:GSUserMsg.tUserEnterData) {
		
	}

	onRoundStart<T = any>(data?:T) {

	}

	onRoundEnd(removeType:RoomDefine.RemoveType) {

	}

	onDispLayerEvent(_,eventName:string) {
		this.dispMsg.dispatch(eventName)
	}

	private playingChairNos_:number[] = []
	get playingChairNos() {
		return this.playingChairNos_
	}
	private juCount_:number = 0
	get juCount() {
		return this.juCount_
	}

	private gameStartData_:any = null 
	get gameStartData() {
		return this.gameStartData_
	}

	private ignoreAutoExit_:boolean = false
	get ignoreAutoExit() {
		return this.ignoreAutoExit_
	}
	set ignoreAutoExit(v) {
		this.ignoreAutoExit_ = v
	}
	onGameStart(data?:any) {

	}

	onGameResult(result:GSCommonMsg.tGameResultNT) {

	}

	onGameEnd(data?:any) {

	}

	onUserOnline(chairNo:number,b:boolean) {

	}

	onUserTuoguan(chairNo:number,b:boolean) {

	}

	onUserReady(chairNo:number,b:boolean) {

	}

	onGameSync(data:any) {

	}

	createPlayer(userData:GSUserMsg.tUserEnterData) {
		if(this.isChairNoWatcher(userData.chairNo)) {
			return null
		}
		let viewID = this.chairToView(userData.chairNo)
		let def = this.playerDefines.find(v=>!!v.viewIDs.find(v=>v.viewID == viewID))
		if(!def) {
			kcore.log.error("cannot create player chairNo = " + userData.chairNo)
			return null 
		}
		let prefab = def.playerPrefab || this.playerPrefab
		let node = kcore.display.instantiate(prefab)
		let player = kcore.utils.getComponentByMethod<kroom.IBasePlayer>(node,"initPlayer")
		if(!player) {
			kcore.log.error("create player failed com not found chairNo = " + userData.chairNo)
			node.destroy()
			return null 
		}
		def.node.addChild(node)
		if(def.playerOnBoard) {
			node.zIndex = -1
		}
		for(let proxy of def.potProxyNodes) {
			if(!proxy.node) {
				continue
			}
			player.addPot(
				proxy.node,
				proxy.pos,
				proxy.refNoReset ? PlayerPotType.Ref_NoReset : PlayerPotType.Ref,
				proxy.useLayer ? proxy.layer : null
			)
		}
		this.players_.push(player)
		if(def.potProxyNodes && def.potProxyNodes.length > 0) {
			for(let proxyInfo of def.potProxyNodes) {
				player.setupPotProxy(proxyInfo.node,proxyInfo.pos,proxyInfo.useLayer ? proxyInfo.layer : null)
			}
		}
		player.initPlayer(this,viewID,userData)
		this.onCreatePlayer(player)
	}

	removePlayer(player:kroom.IBasePlayer) {
		let idx = this.players_.indexOf(player)
		if(idx < 0) {
			return false 
		}
		kcore.log.info("remove player userID = " + player.userID + " chairNo = " + player.chairNo)
		this.onRemovePlayer(player)
		player.onRelease()
		player.node.destroy()
		this.players_.splice(idx,1)
		return true 
	}

	handleRoomInfo(msg:GSUserMsg.tRoomInfoNT) {
		this.roomInfo_ = msg 
		this.gameSet_ = GameSet.createWithData(msg.gameData)
		let userCount = this.gameSet.getUserCount()
		this.filterPlayerDefines_ = this.playerDefines.filter(v=>!!v.viewIDs.find(v=>v.userCount < 0 || v.userCount == userCount))
		this.juCount_ = msg.juCount
		if(!this.layerInited) {
			return
		}
		this.onRoomInfo(msg)
	}
	
	handleUserEnter(msg:GSUserMsg.tUserEnterNT) {
		for(let user of msg.users) {
			let idx = this.users_.findIndex(v=>v.userID == user.userID)
			if(idx < 0) {
				kcore.log.info("user enter userID = " + user.userID + " chairNo = " + user.chairNo)
				this.users_.push(user)
			} else {
				kcore.log.info("user update userID = " + user.userID + " chairNo = " + user.chairNo)
				this.users_[idx] = user
			}
		}
		for(let user of msg.users) {
			let player = this.players_.find(v=>v.userID == user.userID)
			let isWatch = this.isChairNoWatcher(user.chairNo)
			if(isWatch) {
				if(player) {
					this.removePlayer(player)
					player = null 
				}
			} else {
				if(!player) {
					this.createPlayer(user)
				}
			}
			this.onUserEnter(user,player)
		}
	}

	handleUserExit(msg:GSUserMsg.tUserExitNT) {
		console.log("handleUserExit",msg)
		let idx = this.users_.findIndex(v=>v.chairNo == msg.chairNo)
		if(idx < 0) {
			kcore.log.info("user exit failed chairNo = " + msg.chairNo)
			return 
		}
		let selfChairNo = this.selfChairNo
		let user = this.users_[idx]
		kcore.log.info("user exit userID = " + user.userID + " chairNo = " + user.chairNo)
		this.users_.splice(idx,1)
		let player = this.players_.find(v=>v.userID == user.userID)
		if(player) {
			this.removePlayer(player)
		}
		this.onUserExit(user)

		/**
		 * 如果是自己
		 * 退出到首页
		 */
		if(msg.chairNo == selfChairNo) {
			if(!this.ignoreAutoExit) {
				kcore.layer.lobby()
			}
		}
	}


	handleRoundStart(msg:GSUserMsg.tRoundStartNT) {
		this.isRoundStart_ = true 
		this.isRoundEnd_ = false 
		this.roundStartTime_ = Date.now()
		this.roundEndTime_ = Date.now()

		this.onRoundStart(msg.data)
	}

	handleRoundEnd(msg:GSUserMsg.tRoundEndNT) {
		this.isRoundEnd_ = true 
		this.onRoundEnd(msg.removeType)
		if(this.isValid) {
			if(this.ignoreBackToLobbyWhenRoundEnd) {
				return 
			}
			this.backToLobby()
		}
	}

	handleGameStart(msg:GSUserMsg.tGameStartNT) {
		if(msg.gameData) {
			kcore.log.info("game start: gameSet changed")
			this.gameSet_ = GameSet.createWithData(msg.gameData)
		}
		this.playingChairNos_ = msg.playingChairNos.slice()
		this.juCount_ = msg.juCount
		this.juStartTime_ = Date.now()
		this.isJuStart_ = true 
		this.gameStartData_ = msg.data
		this.onGameStart(msg.data)
	}

	handleGameEnd(msg:GSUserMsg.tGameEndNT) {
		this.isJuStart_ = false 
		this.juEndTime_ = Date.now()

		this.onGameEnd(msg.data)
	}

	handleScoreChange(msg:GSUserMsg.tScoreChangeNT) {
		let player = this.players.find(v=>v.chairNo == msg.chairNo)
		if(player) {
			player.setScoreChanged(msg.score,msg.scoreChanged)
		}
	}

	handleOnline(msg:GSUserMsg.tOnlineNT) {
		let player = this.players.find(v=>v.chairNo == msg.chairNo)
		if(player) {
			player.online = !!msg.b
		}
		let user = this.users.find(v=>v.chairNo == msg.chairNo)
		if(user) {
			user.online = !!msg.b 
		}
		this.onUserOnline(msg.chairNo,!!msg.b)
	}

	handleTuoguan(msg:GSUserMsg.tTuoguanNT) {
		let player = this.players.find(v=>v.chairNo == msg.chairNo)
		if(player) {
			player.tuoguan = !!msg.b
		}
		let user = this.users.find(v=>v.chairNo == msg.chairNo)
		if(user) {
			user.tuoguan = !!msg.b 
		}
		this.onUserTuoguan(msg.chairNo,!!msg.b)
	}

	handleUserSitdown(msg:GSUserMsg.tUserSitdownNT) {
		let user = this.users.find(v=>v.chairNo == msg.chairNo)
		if(user.userID == this.selfUserID && !this.isChairNoWatcher(msg.toChairNo)) {
			this.relogin()
		} else {
			let player = this.players.find(v=>v.chairNo == msg.chairNo)
			if(!user) {
				kcore.log.error("sitdown failed cannot find user chairNo = " + msg.chairNo)
				return 
			}
			user.chairNo = msg.toChairNo
			if(player) {
				this.removePlayer(player)
			}
			this.createPlayer(user)
		}
	}

	handleUserStandup(msg:GSUserMsg.tUserStandUpNT) {
		let user = this.users.find(v=>v.chairNo == msg.chairNo)
		let player = this.players.find(v=>v.chairNo == msg.chairNo)
		if(!user) {
			kcore.log.error("standup failed cannot find user chairNo = " + msg.chairNo)
			return 
		}
		user.chairNo = msg.toChairNo
		this.onUserStandup(user)
		if(player) {
			this.removePlayer(player)
		}
	}

	onUserStandup(user:GSUserMsg.tUserEnterData){
		
	}

	handleReady(msg:GSUserMsg.tReadyNT) {
		for(let user of msg.users) {
			let player = this.players.find(v=>v.chairNo == user.chairNo)
			if(player) {
				player.ready = !!user.ready
			}
			this.onUserReady(user.chairNo,!!user.ready)
		}
	}

	handleGameSync(msg:GSUserMsg.tGameSyncNT) {
		this.handleRoomInfo(msg.roomNT)
		this.dispMsg.dispatch(GSUserMsg.RoomInfo,msg.roomNT)

		this.handleUserEnter({
			users:msg.users
		})
		if(msg.gameStartNT) {
			this.handleGameStart(msg.gameStartNT)
		}
		this.onGameSync(msg.syncData)
		if(msg.gameStartNT) {
			this.dispMsg.dispatch(GSUserMsg.GameStart,msg.gameStartNT)
		}
	}

	handleError(msg:GSUserMsg.tErrorNT) {
		console.log("handleError",msg)
		kcore.tip.push("错误",msg.errMsg,1,()=>{
			if(msg.needRestart) {
				this.relogin()
			}
		})
	}

	handleJiesan(msg:GSUserMsg.tJiesanNT) {
		console.log("handleJiesan",msg)
		if(msg.juEnd) {
			kcore.tip.push("提示","房主已发起解散\n本局游戏结束后退出房间")
		} else {
			kcore.tip.push("提示","房主已解散房间")
		}
	}

	handleGSCGameResult(msg:GSCommonMsg.tGameResultNT) {
		this.onGameResult(msg)
	}

	handleFupanStart(msg:GSUserMsg.tFupanStartNT) {
		this.juCount_ = msg.juCount
		this.handleRoomInfo(msg.roomInfo)
		this.dispMsg.dispatch(GSUserMsg.RoomInfo,msg.roomInfo)

		this.handleUserEnter({
			users:msg.users
		})
	}

	handleWaitForCombine(msg:GSMatchUserMsg.tWaitForCombineNT) {
		console.log("handleWaitForCombine",msg)
		if(msg.roomID) {
			this.isWaitingForCombine_ = true 
		} else {
			this.isWaitingForCombine_ = false
		}
		// kcore.tip.push("提示","正在等待其他玩家合并房间...")
	}
	handleCombineFinished(msg:GSMatchUserMsg.tCombineFinishedNT) {
		console.log("handleCombineFinished",msg)
		this.isWaitingForCombine_ = false 
		if(msg.roomID != this.roomID) {
			kcore.layer.enterGameByRoomID(msg.roomID)
		}
	}
}