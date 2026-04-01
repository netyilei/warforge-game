

declare namespace kcore {
	let utils: IUtils
	let api: IApis
	let ui: IUIManager
	let uiactions: IUIActions
	let nodeCycle: INodeCycle
	let audio: IAudioManager
	let log: ILog
	let logConfig: {
		withDate: boolean,
		forceConsole: boolean,
		dispLog: boolean,
		dispStackLog: boolean,
		closeLog: boolean,
	}
	let award:IAwardFunc
	/**
	 * 构造事件派发管理器
	 */
	let disp: () => kcore.IEventDispatcher

	// let click		:(node:cc.Node)=>IClickHelper

	/**
	 * 通用提示弹窗
	 */
	let tip: ITipFunc
	/**
	 * 通用加载弹窗
	 */
	let block: IBlockFactory
	/**
	 * 通用提示弹窗
	 */
	let toast: IToastFunc


	let prefab: IPrefabManager

	let display: IDisplay

	let cache: ICacheManager

	let data: IData

	let bundle: IBundleManager

	/**
	 * @returns 0~1
	 */
	interface BundleProgressDataType {
		getProgress: () => number
	}
	let bundleProgressDataPath: string // = "bundle/progress"


	let storage: IStorage

	let http: IHttp

	let httpAK: IHttpAK

	let crypto: ICrypto

	let logic: ILogicCenter

	let flag: (n?: number) => IFlag

	let club: IClubDataHelper

	let lang: IMultiLangManager

	
	interface IUIManager {
		static touchBlock: boolean
		readonly root: cc.Node
		readonly board: UIBaseInterface

		exceptionFunc: Function
		restartFunc: Function

		restart()
		ignoreBoardChangedNext: boolean

		getUIClazz<T extends UIBase>(clazz: { new(): T }): any
		getUI(uiName: string): UIBaseInterface

		popUIClazz<T extends UIBase>(clazz: { new(): T }): boolean
		popUI(uiName: string): boolean
		async push(prefabOrName: cc.Prefab | string, ...params: any[]): Promise<cc.Node>
		pushNoLoad(prefabOrName: cc.Prefab | string, ...params: any[]):cc.Node

		repushBoard(): boolean

		clearReush()

		loadPrefab(name: string): Promise<cc.Prefab>

		pop(com: UIBase): boolean

		popSingle(type: UIType): boolean

		popAll()

		popStaticAll()

		popType(type: UIType)

		getCount(type: UIType): number
	}
	interface IUIActions {
		focusIn(uibase: UIBaseInterface, func?: Function)
		focusOut(uibase: UIBaseInterface, func?: Function)

		moveInFromLeft(uibase: UIBaseInterface, func?: Function)

		moveInFromRight(uibase: UIBaseInterface, func?: Function, offset?: number)

		moveOutToRight(uibase: UIBaseInterface, func?: Function, offset?: number)

		moveOutToLeft(uibase: UIBaseInterface, func?: Function)

		moveInFromTop(uibase: UIBaseInterface, func?: Function, offset?: number)
		moveOutToTop(uibase: UIBaseInterface, func?: Function)

		moveFadeInFromBottom(uibase: UIBaseInterface, func?: Function, offset?: number)
		moveFadeOutToBottom(uibase: UIBaseInterface, func?: Function, offset?: number)
	}
	interface IBlocker {
		start(forceShow?: boolean)

		stop()

		isStart(): boolean

		setContent(content: string)
	}

	interface IBlockFactory {
		readonly create: (content?: string, node?: cc.Node) => kcore.IBlocker
	}

	interface ITipFunc {
		push: (title?: string, content?: string, btnNum?: number, func?: (b: boolean) => any) => UIBaseInterface
	}
	interface IToastFunc {
		push: (content?: string, duration?: number) => void
	}
	interface IAwardFunc{
		push:(param:{ itemID: string, count: number } | { itemID: string, count: number }[])=>void
	}
	enum ConvertType {
		LS_to_LS,
		LS_to_PS,
		PS_to_PS,
		PS_to_LS
	}
	interface IUtils {
		/**
		 * 是否是钱包登陆
		 */
		isWalletLogin():boolean
		async copyToClipboard(content: string):Promise<boolean>
		async getClipboard():Promise<string>
		async clearClipboard():Promise<boolean>
		getQueryString(name:string)
		calculateAge(idCard: string)
		safeNumber(value: any)
		generateRandomString(length: number)
		cutString(str: string, len: number, readd: string = "...")
		tweenTruncation(tween: cc.Tween, reStartTime: number)
		printCallStack()

		// 浮动值 per < 1
		valuePer(value: number, per: number): number

		// initDesignSize()

		getCanvasSize(): cc.Size

		/**
		 * 从 from 自己的坐标系到 to.parent的坐标系
		 * @param from 
		 * @param to 
		 * @param pos 
		 */
		convertPosition(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2
		/**
		 * 从 from 自己的坐标系到 to 的坐标系
		 * @param from 
		 * @param to 
		 * @param pos 
		 */
		convertPositionST(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2

		// local space
		convertPositionLS(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2
		// parent space
		convertPositionPS(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2

		convertPositionType(from: cc.Node, to: cc.Node, pos: cc.Vec2, type: ConvertType): cc.Vec2

		// x,y使用左上角坐标系
		convertBoundingBoxToView(node: cc.Node): cc.Rect

		getBoundingBox(node: cc.Node, pos?: cc.Vec2, toNodeSpace?: cc.Node): cc.Rect


		scaleToSize(node: cc.Node, size: cc.Size)

		getScaledContentSize(node: cc.Node): cc.Size

		checkComponent<T extends cc.Component>(node: cc.Node, type: { prototype: T, new(): T }): T

		getComponentByMethod<T>(node: cc.Node, methodName: string): T
		getComponentsByMethod<T>(node: cc.Node, methodName: string): T[]

		// (-size ~ size)
		randomSizeRange(sizeOrW: cc.Size | number, h?: number): cc.Vec2
		// (-v ~ v)
		randomRangeSingle(v): number

		/**
		 * a ~ b 随机取值
		 * @param a 
		 * @param b 
		 */
		randomRange(a, b): number

		// 整数随机，return [a,b)
		intRandomRange(a: number, b: number): number

		addToNewParent(node: cc.Node, parent: cc.Node): cc.Node
		/**
		* @description 是否频繁点击
		* @param 判断重点的一个id，用于区分不同时机 
		* @duration 少于该时长即认为发生了重复点击（毫秒）     
		**/
		isQuickClick(tag?: string, duration?: number): boolean
		createUUID(len, radix): string
	}

	interface IFuncGroup {
		add(func: Function)
		call(...params: any[])
		clearcall(...params: any[])
		clear()
	}
	interface IApis {
		stringformat(fmt, ...arg: any[]): string


		GBKBufferToUTF8(array: ArrayBuffer, len?: number): string

		UTF8ToGBKBuffer(strUTF: string): ArrayBuffer

		StringToUint8Array(str: string, maxlen: number = -1): Uint8Array

		Uint8ArrayToString(array: Uint8Array | number[]): string

		ifcall(obj: any, funcName: string, ...params: any[]): any

		swap(obj1: any, obj2: any, propertyName: string)


		getClassName(clazz: any): string
		/**
		 * obj1和obj2是否是同一类型
		 */
		sameClass(obj1: any, obj2: any): boolean

		/**
		 * obj的类型是否是ty
		 */
		isType(obj: any, ty: any): boolean

		/**
		 * obj的类型是否是数组 
		 */
		isArray(obj: any): boolean

		/**
		 * 对拷
		 */
		copyTo(src: any, dst: any)

		/**
		 * or
		 */
		or<T>(...params: T[]): T

		/**
		 * and 
		 */
		and(...params: any[]): boolean

		/**
		 * clamp
		 */
		clamp<T>(v: T, min: T, max: T): T

		clone(obj: any): any
		handler<T>(self, selfFunc: T): T

		lifeFunc(node: cc.Node, func: Function, unActiveFunc?: Function): Function


		/**
		 * 回调函数集合
		 */
		funcs(): IFuncGroup
		base64ToArrayBuffer(base64String): ArrayBuffer
		base64ToUint8Array(base64String): Uint8Array

		encodeBase64Fast(arraybuffer): string
		decodeBase64Fast(base64): ArrayBuffer
		getBase64BufferByteLength(base64): number
		gzip(str: string): string

		gzipArr(str: string): Uint8Array
		gunzip(base64String: string): string

		gunzipArr(arr: Uint8Array): string

		arrayBufferToBase64(buffer): string
		arrayBufferToString(buffer): string

		Uint8ArrayToBase64(bytes): string

		fixedLen(str: string, len: number, pattern?: string): string
		strlen(str: string): number
		fixedBytesLen(str: string, len: number, pattern?: string)

		extends(clazz: any, superClazz: any)
	}

	namespace file {
		function selectLocalFile(node:cc.Node,accept?:string): Promise<{
			uri:string,
			ext:string,
			blob:Blob,
		}>
		function selectLocalFileBase64(node:cc.Node,accept?:string): Promise<{
			ext:string,
			base64:string,
		}>
	}

	interface INodeCycle {
		listenDestroy(node: cc.Node, func: Function)
	}

	type EventFunc = (...datas) => any

	interface IEventDispatcher {
		readonly parent: IEventDispatcher
		link(node: cc.Node)
		listen(eventName: string, func: EventFunc,thiz?:any): IEventDispatcher

		removeEventFuncs(eventName: string): IEventDispatcher
		removeFunc(func: EventFunc): IEventDispatcher

		addNode(node: cc.Node, dispName?: string, defaultThiz?:any): IEventDispatcher

		getDisp(node: cc.Node, dispName?: string): IEventDispatcher

		addChild(disp: IEventDispatcher): IEventDispatcher

		removeChild(disp: IEventDispatcher): IEventDispatcher

		removeAllChildren(): IEventDispatcher

		removeFromParent(): IEventDispatcher

		removeAll(): IEventDispatcher

		clear()

		dispatch(eventName: string, ...datas): IEventDispatcher
	}

	interface IAudioManager {
		playMusic(name: string): boolean
		playMusicClip(clip: cc.AudioClip): boolean
		stopMusic()
		stopAllEffects()
		playEffect(name: string, forcePlay?: boolean): boolean
		playEffectClip(clip: cc.AudioClip, forcePlay?: boolean): boolean
		playWebEffect(url: string, readyFunc?: Function, forcePlay?: boolean)

		playIDEffect(clip: cc.AudioClip, loop?: boolean, forcePlay?: boolean): number
		pauseEffect(id: number)
		resumeEffect(id: number)
		stopEffect(id: number)

		pushParserStack(obj: any)
		popParserStack(obj: any)
		addParser(parser: IAudioParser)

		musicEnabled: boolean
		effectEnabled: boolean
	}

	interface IAudioParser {
		parse(assetName: string): string[]
	}
	// interface IClickHelper {
	// 	r(nodeName:string | cc.Node | cc.Button,func,silence?:boolean):IClickHelper

	// }
	namespace click {
		function create(node: cc.Node): IClickHelper
		function click(node: cc.Node | cc.Button, func, silence?: boolean): IClickHelper
		function playAudio()
	}
	interface ILog {
		info(title: string, ...params: any[])
		error(title: string, ...params: any[])
	}

	interface IConsole {
		info(title: string, ...params: any[])
		error(title: string, ...params: any[])
	}


	type StepFuncType = () => Promise<void>
	type BlockFuncType = (arg: any) => boolean
	type ContinueFuncType = (arg: any) => void
	interface IYield {
		readonly isRunning: boolean
		readonly forceShutdown: any
		start(): Promise<void>
		shutdown()
		tick(arg: any)
		block<T>(func: BlockFuncType): Promise<T>
	}

	namespace async {

		async function safeCall<T>(func: (...params: any) => Promise<T>, ...params: any[]): Promise<T>
		async function blockSafeCall<T>(content: string, func: (...params: any) => Promise<T>, ...params: any[]): Promise<T>

		async function timeout<T>(interval: number, data?: T): Promise<T>
		interface waitLike<T = any> {
			promise: Promise<T>
			resolve(ret?: T)
		}
		class wait<T = any> implements waitLike<T> {
			constructor()
			readonly promise: Promise<T>
			readonly isResolved: boolean
			resolve(ret?: T)
		}

		class waitTimeout<T = any> implements waitLike<T> {
			constructor(timeout: number)
			readonly isTimeout: boolean
			readonly promise: Promise<T>
			resolve(ret?: T)
		}
		class queue {
			readonly length: number
			/*
				return value: giveup function
			*/
			call(func: Function): Function
		}

		type queueFuncType = (...params) => Promise<any>
		// func必须是async
		function queueFunc<T>(func: (...params) => Promise<T>, obj?: any): (...params) => Promise<T>
	}

	interface IPrefabManager {
		getPrefab(name: string): cc.Prefab
	}

	interface IDisplay {
		newSprite(params: {
			frame?: cc.SpriteFrame,
			url?: string,

			size?: cc.Size,
			scale?: number,
			pos?: cc.Vec2,

			color?: cc.Color,
			opacity?: number,
		}): cc.Sprite
		newNode(params: {
			pos?: cc.Vec2,
			size?: cc.Size,
			scale?: number,
		}): cc.Node
		setupSprite(sprite: cc.Sprite, spriteFrame: cc.SpriteFrame, size?: cc.Size, autoRef?: boolean)
		loadWebTexture(url: string, node?: cc.Node): Promise<cc.SpriteFrame>
		setWebTexture(sprite: cc.Sprite, url: string, size?: cc.Size, defaultSpriteFrame?: cc.SpriteFrame): boolean
		setWebTextureOpt(sprite: cc.Sprite, url: string, opt?: {
			size?: cc.Size,
			defaultSpriteFrame?: cc.SpriteFrame,
			func?: (frame: cc.SpriteFrame) => any,
		}): boolean
		setWebTextureStyle(sprite: cc.Sprite, url: string, opt: {
			style: "opacity" | "active",
			defaultSpriteFrame?: cc.SpriteFrame,
			func?: (frame: cc.SpriteFrame) => any,
		}): boolean
		instantiate(prefab: cc.Prefab): cc.Node
		instantiate(node: cc.Node): cc.Node
		createAnimation(prefab: cc.Prefab): cc.Animation
	}

	interface IData {
		get(path: string, dv?: any)
		set<T = any>(path: string, v: T, ignoreEvent?: boolean): T
		change(input: string | any, dv?: any)
		clear()
		listen(path, node, func)
		unlisten(path, node)
		unlistenall(node)
		listenget(path, dv, node, func)
		listencallget(path, node, func, getfunc)
		getDisp()
		dump()
	}
	interface ICacheManager {
		pushStack(node: cc.Node)

		loadImg(url: string, opt?: {
			timeoutMS?: number,
			noWait?: boolean,	// 不等待重复加载
			noLoad?: boolean,	// 有缓存就返回，不然返回null
		}): Promise<cc.SpriteFrame>

		loadAsset<T extends cc.Asset>(url: string, type?: { prototype: T }, opt?: {
			timeoutMS?: number,
			noWait?: boolean,	// 不等待重复加载
			noLoad?: boolean,	// 有缓存就返回，不然返回null
		}): Promise<T>

		parseInternalAssetPath(kinUrl:string):string
		readonly internalAssetUrlPrefix:string
	}
	interface BundleMapInfo {
		name:string
		assetNames:string[]
		remote:boolean
		root:string
		deps:string[]
	}
	interface IBundleManager {
		readonly loadedBundleNames:string[]
		readonly bundleMaps:BundleMapInfo[]

		loadAsset<T extends cc.Asset>(name: string, type?: { prototype: T }, ignoreBlock?: boolean): Promise<T>
		loadAssetInBundle<T extends cc.Asset>(name: string, bundleName: string, type?: { prototype: T }, ignoreBlock?: boolean): Promise<T>
		loadPrefab(name: string, ignoreBlock?: boolean): Promise<cc.Prefab>
		loadBundle(name: string): Promise<cc.AssetManager.Bundle>
		getBundleNameByAssetName(name: string, inLoad?: boolean): string
		unloadAllBundles()
		unloadAsset(asset:cc.Asset):boolean

		clearProgress()
	}
	interface IStorage {
		getValue(key: string): any
		setValue(key: string, obj: any)
		clearValue(key: string)
	}


	interface HttpReturnValue {
		data: any
		error: any
	}
	interface IHttp {
		postJson(params: {
			url: string,
			headers?: Map<string, string>,
			data?: any,
			timeout?: number,
			block?: string,
			blockForceShow?: boolean,
		}): Promise<HttpReturnValue>

		get(params: {
			url: string,
			headers?: Map<string, string>,
			timeout?: number,
			block?: string,
			blockForceShow?: boolean,
		}): Promise<HttpReturnValue>

		getJson(params: {
			url: string,
			headers?: Map<string, string>,
			timeout?: number,
			block?: string,
			blockForceShow?: boolean,
		}): Promise<HttpReturnValue>
	}

	interface IHttpAK {
		ak: string
		loginUrl: string
		lobbyUrl: string
		customerUrl: string

		postJson(params: {
			path: string,
			headers?: Map<string, string>,
			data?: any,
			timeout?: number,
			ignoreAK?: boolean,
			block?: string,
			blockForceShow?: boolean,
		}): Promise<HttpReturnValue>

		postCustomerJson(params: {
			path: string,
			headers?: Map<string, string>,
			data?: any,
			timeout?: number,
			ignoreAK?: boolean,
			block?: string,
			blockForceShow?: boolean,
		}): Promise<HttpReturnValue>

		upload(params:{
			path:string,
			pathType:"login" | "lobby" | "customer",
			file:File,
			tag:string,
		}):Promise<any>
	}

	interface ICrypto {
		encodeReq(t): any
		decodeRes(t): any
	}

	namespace SHAKFuncs {
		function req<ReqType = any, ResType = any>(path: string, blockContent?: string):
			(jsonObj: ReqType) => Promise<ResType>

		function reqAK<ReqType = any, ResType = any>(path: string, blockContent?: string):
			(jsonObj: ReqType) => Promise<ResType>

		function reqCustomer<ReqType = any, ResType = any>(path: string, blockContent?: string):
			(jsonObj: ReqType) => Promise<ResType>

		let blockContent: string
		let blockDelayShow: boolean
		let ignoreBlock: boolean
		let ignoreBlockPathList: string[]
	}

	class LogicBase extends cc.Component {
		onLogicStart(...params: any[])
		onLogicStop()
		onLogicBlock(): string
		onLogicUpdate(dt)

		stopSelf()

		setBlockVisible(b: boolean)

		isBlockVisible(): boolean

		isLogicValid(): boolean
	}

	interface ILogicCenter {
		startLogic<T extends LogicBase>(clazz: { new(): T }, ...params): T

		stopLogic(logic: LogicBase): boolean

		stopAll<T extends LogicBase>(clazz?: { new(): T })

		stopBut<T extends LogicBase>(clazz: { new(): T })

		isLogicRunning(logic: LogicBase)

		isLogicClassRunning<T extends LogicBase>(clazz: { new(): T })

		getLogic<T extends LogicBase>(clazz?: { new(): T }): T

		getCount(clazz: { prototype: LogicBase }, ...params): number
	}

	class LogicSrsAction extends LogicBase {
		enterGame(boxCodeOrRoomID: string | number, udp?: boolean)
	}
	class Tcp {
		crypto: ICrypto
		readonly ready: boolean
		readonly connecting: boolean
		connect(host?: string): Tcp

		close(): Tcp


		startCache()

		endCache()

		removeCache()

		send(msgName: string, jsonObj): boolean

		listen(msgName: string, func: kcore.EventFunc): Tcp

		unlisten(func: kcore.EventFunc): Tcp

		listenNode(node: cc.Node, dispName?: string): IEventDispatcher

		listenDisp(disp: kcore.IEventDispatcher): Tcp

		removeAllListener(): Tcp
	}
	
	namespace TcpEvent {
		const Connected = "TcpEventConnect"
		const ConnectFailed = "TcpEventConnectFailed"
		const Error = "TcpEventError"
		const Closed = "TcpEventClosed"
		const Message = "TcpEventMessage"
	}


	interface IGNetNode {
		listen(eventName: string, func): IGNetNode

		listenConnected(func): IGNetNode
		listenClosed(func): IGNetNode
		listenConnectFailed(func): IGNetNode
		dispatchTcp(eventName: string, jsonObj)
		clear()
	}
	function gnet(node: cc.Node): IGNetNode

	namespace gnet {

		let wsHost: string
		function setCrypto(crypto: ICrypto)
		function getTcp(): Tcp

		function send(msgName: string, jsonObj)
		function isConnected(): boolean
		function isConnecting(): boolean
		function close()
		function connect()
		function dispatchTcp(eventName: string, jsonObj)
	}

	interface IFlag {
		n: number
		contains(v: number): boolean
		compare(v: number): boolean
		check(v: number): number
		add(v: number): number
	}

	// namespace Flag {
	// 	/**
	// 	 * @returns (a & b) == b
	// 	 */
	// 	function contains(a:number,b:number):boolean
	// 	/**
	// 	 * @returns (a & b) > 0
	// 	 */
	// 	function compare(a:number,b:number):boolean
	// }

	enum LayerState {
		None,
		Login,
		Lobby,
		Game,
		Tea,
	}
	namespace layer {

		function getLayerState(): LayerState

		function getCurrentRoomID(): number
		function setCurrentRoomID(roomID: number)

		function login()

		function lobby(first?: boolean)


		function enterGame(boxCode: string, failState?: LayerState)

		function enterGameByRoomID(roomID: number, failState?: LayerState)
		function enterGameByOnLaunch(roomID: number)
		async function createGame(gameSet: GameSet): any

		function enterTea(codeOrID: string | number, failState?: LayerState)

	}

	interface GameDefineType {
		name: string,
		gameID: number,
		pri: number,
		version: string,
		prefabName: string,
		prefab: cc.Prefab
	}

	namespace game {
		function getGame(gameNameOrID: string | number): GameDefineType
	}

	
	namespace dcn {
		function listen(dkey:string,node:cc.Node,func)
		function unlisten(dkey:string,node:cc.Node)
		function unlistenNode(node:cc.Node)
		function clear()
	}

	interface IClubDataHelper {
		rootNode:cc.Node
		initWithClubID(node:cc.Node,clubID:number):Promise<boolean>
	
		getJoinedClubDatas():Promise<_ClubInternalDefine_.tData[]>
		readonly clubID:number
		readonly data:_ClubInternalDefine_.tData
		readonly pathData:string
	
		readonly templates:_ClubInternalDefine_.tRoomTemplate[]
		readonly pathTemplates:string

		readonly setting:_ClubInternalDefine_.tSetting
		readonly pathSetting:string

		readonly selfAccount:_ClubInternalDefine_.tUserAccount
		readonly pathSelfAccount:string
		readonly selfMember:_ClubInternalDefine_.tUserMember
		readonly pathSelfMember:string

		readonly subMembers:_ClubInternalDefine_.tUserMember[]
		readonly pathSubMembers:string
		readonly subAccounts:_ClubInternalDefine_.tUserAccount[]
		readonly pathSubAccounts:string

		readonly rooms:_RoomInternalDefine_.RoomRealtime[]
		readonly pathRooms:string
		readonly pathRoomChangedIDs:string
		readonly pathRoomRemovedIDs:string
		
		createRoom(templateID:number):Promise<boolean>
		jiesanRoom(roomID:number):Promise<any>
	}


	// 同ClubDefine的内部二次定义

	namespace _ClubInternalDefine_ {
		interface tData {
			clubID:number
			code:string
			bossUserID:number
	
			name:string
			desc:string
			iconUrl:string
		}
	
		interface tSetting {
			clubID:number
			autoDesk:boolean
			mode:number
			invite:number
			adminAcceptReq:boolean
			adminCreateTemplate:boolean
			adminCreateRoom:boolean
		}
	
		interface tUserAccount {
			clubID:number
			userID:number
			values:string[]
		}
	
		interface tUserMember {
			clubID:number
			userID:number
			leaderUserID:number
	
			type:MemberType
			job:JobType
			joinTimestamp:number
		}
	
		interface tUserRelation {
			clubID:number
			userID:number
			leaders:number[]	// 由近及远的上级链条
			subs:number[]		// 所有直接下级
		}
	
		interface tRoomTemplate {
			templateID:number
			clubID:number
			name:string
			desc:string
			gameData:RoomDefine.GameData
			userID?:number
	
			timestamp:number
			date:string
		}
	}

	namespace _RoomInternalDefine_ {

		type UserRealtime = {
			userID?:number
			chairNo:number
			score:string
		}

		type RoomRealtime = {
			roomID:number,
			boxCode?:string,
			groupID?:number,
			clubID?:number,
			status:RoomStatus,
			layerName?:string,
			nodeName?:string,
			gsName?:string,
			users:UserRealtime[],
		}
	}

	export type LVSetupFunction = (idx:number,node:cc.Node,forClean?:boolean)=>boolean
	class ListViewEx extends cc.Component {
		view:cc.ScrollView = null
		prefab:cc.Prefab | (()=>cc.Node) = null 
		itemCount:number = 0
		startIndex:number = -1
		maxIndexInView:number = 0
		itemSize:cc.Size = null
		itemAp:cc.Vec2 = null 
		rootNode:cc.Node = null 
		layoutNode:cc.Node = null 
		unusedActive:boolean = false
		setupFunction:LVSetupFunction = null

		initWithView(view:cc.ScrollView,itemPrefab:cc.Prefab | (()=>cc.Node),func:LVSetupFunction)
		onItemCount();
		refreshIndex(idx:number)
		refreshRange(start:number,count:number)
		refreshCallItems(force?:boolean)
		getIndexPosition(idx:number) 
		getCurStartIndex()
		jumpToTop()
		update()
	}
	namespace ListViewEx {
		function create(view:cc.ScrollView,itemPrefab:cc.Prefab | (()=>cc.Node),func:LVSetupFunction):ListViewEx
	}

	type Section = {
		from:number,
		count:number,
		loading?:boolean,
		success?:boolean,
	}

	type PageRequest = {
		page:number,
		limit:number,
	}

	type PageResponse = {
		count:number,
		datas:any[],
	}
	class PageLimitCaller<T> {
		datas:T[] = []
		sections:Section[] = []
		loadStep:number = 20
		top:number = null
		readonly maxCount:number = 0
		funcLoadCursor:(req:PageRequest)=>Promise<PageResponse> = null 
		funcSectionDone:(success:boolean,from:number,count:number)=>any = null
		clear()
		clearAll()
		getSection(index:number) 
		needLoad(index:number)
		load(index:number)
		loadNextSection()
		listViewEx:ListViewEx = null 
		static createListViewEx<DataType>(opt:{
			loadStep?:number,loadNow?:boolean,
			view:cc.ScrollView,itemPrefab:cc.Prefab | (()=>cc.Node),
			func:(idx:number,data:DataType,node:cc.Node)=>any,
			funcClear?:(node:cc.Node)=>any,
			funcLoadCursor:(req:PageRequest)=>Promise<PageResponse>,
		})
	}

	class VMultiLangLabel extends cc.Component {
		lbl:cc.Label = null
	}

	interface IMultiLangManager {
		addLabel(label:VMultiLangLabel)
		removeLabel(label:VMultiLangLabel)
		updateLabel(label:VMultiLangLabel)
		get(key:string):string
		langKey:string,
	}
}


declare namespace kbundle {
	let StartComponentPrefabName:string /*= "bundle_init"*/
	interface IStartComponent {
		node:cc.Node,
		
		onBundleLoaded(isMain:boolean)
		onBundleUnLoaded(isMain:boolean)
	}
}