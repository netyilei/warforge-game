

declare namespace kroom {
	enum GameLayerAniPos {
		Board,
		Middle,
		Top,
	}

	interface IBaseGameLayer extends cc.Component {
		dispMsg:kcore.IEventDispatcher
		node:cc.Node

		getAniPosNode(pos:GameLayerAniPos):cc.Node
		readonly playingChairNos:number[]
		readonly players:kroom.IBasePlayer[]
		readonly gameStartData:any 
		readonly isFupan:boolean 
		readonly selfChairNo:number 
		readonly selfUser:ServerUserData
		readonly selfPlayer:IBasePlayer
		readonly gameSet:any 
		readonly roomID:number 
		chairToView(chairNo:number):number
		viewToChair(viewID:number):number

		isChairNoWatcher(chairNo:number):boolean
	}
	interface IBaseLayerExtension<GameLayerClass = IBaseGameLayer> {
		readonly gameLayer:GameLayerClass
		onInitExtension(gameLayer:GameLayerClass)
		onLayerUpdate(dt:number)
		onLayerDestroy()
		/**
		 * 只会阻断GameLayer 和 LayerModule对某个消息的处理
		 * @param mjMsgName MJMsg.$MsgName
		 */
		isBlockMsg(mjMsgName:string):boolean
	}

	
	interface ServerUserData {
		chairNo:number,
		userID:number,
		nickName:string,
		iconUrl:string,
		sex:number,
		score:string,
		online:boolean,
		tuoguan:boolean,
	}
	interface Decimal {

	}
	interface IBasePlayer {
		userData:ServerUserData
		readonly chairNo:number 
		readonly userID:number

		online:boolean
		tuoguan:boolean 
		score:string 
		setScoreChanged(score:string,changed:string)
		ready:boolean
		status:number

		readonly node:cc.Node
		readonly sprIcon:cc.Sprite

		readonly viewID:number 
		readonly gameLayer:IBaseGameLayer
		initPlayer(gameLayer:kroom.IBaseGameLayer,viewID:number,userData:ServerUserData)

		addExtensions(prefab:cc.Prefab,pos:number,layer:number)
		addPot(node:cc.Node,pos:number,type:number,layer?:PlayerPotLayer)

		setupPotProxy(proxyNode:cc.Node,pos:PlayerPotPos,layer?:PlayerPotLayer) 
		
		onUserDataChanged()
		onRelease()
		onLayerUpdate(dt:number)

		
		removePotByPos(pos:PlayerPotPos):boolean
		removePotByNode(node:cc.Node):boolean
		removePotIndex(idx:number):boolean
		getPotByPos(pos:PlayerPotPos):cc.Node
		filterPotByPos(pos:PlayerPotPos):cc.Node[]
	}

	interface IBasePlayerExtension<GameLayerClass extends IBaseGameLayer,PlayerClass extends IBasePlayer> {
		readonly gameLayer:GameLayerClass
		readonly player:PlayerClass
		onInitPlayer(gameLayer:GameLayerClass,player:PlayerClass)
		
		onUserDataChanged()
		onPlayerRelease()
		onLayerUpdate(dt:number)
	}

	interface IBasePlayerExtensionEventDelegate {

	}

	namespace env {
		let bundleName:string
		let gameLayer:kroom.IBaseGameLayer
	}
}