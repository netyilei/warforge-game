
declare namespace krenderer {
	interface IRenderer {
		node:cc.Node
		readonly type:RType

		onInitRenderer(...params)
		useSkin(skin:ISkin):boolean
		useSkin2(skin:ISkin):boolean
	}
	interface tCard {
		suit:number,
		value:number,
	}

	type tCardArray = tCard[]

	interface Card extends tCard {
		equal(card:tCard):boolean
	}
	interface CardArray {

	}
	interface ICard extends IRenderer {
		onInitRenderer(showBack?:boolean)
		onInitRenderer(suit:number,value:number,showBack?:boolean)
		onInitRenderer(card:tCard,showBack?:boolean)
		useSkin(skin:ISkinCard):boolean
		useSkin2(skin:ISkinCardBack):boolean

		card:tCard
		suit:number
		value:number
		showBack:boolean 
		autoShowBack:boolean 		// 当设置suit==0时自动设置showBack=true
		autoFlipToShow:boolean,		// 当设置suit!=0时自动flipXToShow

		flipAniDuration:number
		flipXToBack(func?:Function):boolean
		flipXToShow(func?:Function):boolean

		readonly touchDisp:kcore.IEventDispatcher
		touchEnabled:boolean 
	}

	interface HandSingleCard {
		card:Card,
		renderer:krenderer.ICard,
		selected:boolean,
		serialID:number,
	}
	interface HandSingleCardInternal extends HandSingleCard {
		notFirstPos?:boolean
		targetPos?:cc.Vec2,
	}
	interface IHandCards extends IRenderer {
		onInitRenderer(cards:tCardArray | CardArray)
		pushCards(cards:tCardArray | CardArray)
		pushCard(card:tCard)
		setCard(idx:number,card:tCard)
	
		readonly length:number
		removeAt(idx:number):boolean
		remove(card:tCard):boolean
		removeHandSingleCards(infos:krenderer.HandSingleCard[]):boolean
		at(idx:number):HandSingleCard
		indexOf(card:tCard):number
		contains(card:tCard):boolean
		containsArray(cards:tCardArray | CardArray):boolean
		clear()
		sortFunc:(a:krenderer.HandSingleCard,b:krenderer.HandSingleCard)=>number
		powerFunc:(a:tCard)=>number
	
		readonly defaultSortFunc:(a:krenderer.HandSingleCard,b:krenderer.HandSingleCard)=>number

		touchDisp:kcore.IEventDispatcher
		touchEnabled:boolean
		selectEnabled:boolean
		singleSelect:boolean
		showBack:boolean 
		autoShowBack:boolean 
		autoFlipToShow:boolean,

		setCardSelected(card:tCard,b:boolean)
		setCardsSelected(card:tCard,b:boolean)
		unSelectAll()
		readonly selects:HandSingleCard[]
	}

	namespace CardEvent {
		let Click:string		// card
		let TouchStart:string	// card, cc.Touch
		let TouchMove:string	// card, cc.Touch
		let TouchEnd:string		// card, cc.Touch
		let DragStart:string	// card, cc.Touch
		let DragMove:string		// card, cc.Touch
		let DragEnd:string		// card, cc.Touch
	}
	namespace HandCardsEvent {
		let Select:string		// card
	}

	interface IBackground extends IRenderer {
		onInitRenderer()
		useSkin(skin:ISkinBackground):boolean
	}

	interface IBaseTimer {
		node:cc.Node

		autoDisabled:boolean
		autoUpdate:boolean
		readonly startCountdown:number
		countdown:number
		paused:boolean
		setTimer(countdown?:number,paused?:boolean)
		onTimerSetup(countdown?:number)
		onTimerStart()
		onTimerEnd()
		onTimerUpdate()

		onUpdate(dt:number)
	}

	interface ITimer extends IRenderer,IBaseTimer {
		onInitRenderer()
		useSkin(skin:ISkinTimer):boolean
	}

	enum RType {
		Card,
		HandCards,
		Background,
		Timer,
		CardBack,
	}

	interface ISkin {
		node:cc.Node
		readonly renderers:IRenderer[]
		readonly type:RType
		readonly defaultFrame:cc.SpriteFrame
		addRenderer(renderer:IRenderer)
		removeRenderer(renderer:krenderer.IRenderer)
		clearRenderers()
	}

	interface ISkinBackground extends ISkin {
		frame:cc.SpriteFrame
	}

	interface ISkinCard extends ISkin {
		specialCardFaces:{suit:number,frame:cc.SpriteFrame}[]
		suitFrames:{suit:number,level:number,frame:cc.SpriteFrame}[]
		valueFrames:{
			suits:number[],
			level:number,
			values:{value:number,frame:cc.SpriteFrame}[]
		}[]
		face:cc.SpriteFrame,
		back:cc.SpriteFrame,
	}

	interface ISkinCardBack extends ISkin {
		back:cc.SpriteFrame,
	}

	enum CardLevel {
		None,
		Small,
		Big,
		Special,
	}

	interface ISkinTimer extends ISkin {
		prefab:cc.Prefab
	}

	interface IAssetManager {
		atlas:IAtlas,
		audio:IAudio,
		ani:IAniStack,
		chat:IChatAssets,

		initAssets(gamelayer:kroom.IBaseGameLayer):Promise<void>
	}
	let asset:IAssetManager

	interface IAtlas {
		disp:kcore.IEventDispatcher
		templates:{type:RType,prefab:cc.Prefab,node:cc.Node}[]

		loadSkinPrefab(prefab:cc.Prefab,rename?:string):ISkin
		loadSkinAsset(assetName:string,rename?:string):Promise<ISkin>
		loadSkin(name:string,skin:ISkin):boolean 
		changeSkin(name:string,renderer:IRenderer):boolean
		changeAllRendererSkin(type:RType,skin:ISkin)
		setDefaultSkin(type:RType,name?:string,changeAll?:boolean):boolean
		getDefaultSkin(type:RType):ISkin
		getSkin<T extends ISkin = ISkin>(name:string):T
		getSkinByType<T extends ISkin = ISkin>(type:RType,idx?:number):T
		getSkins<T extends ISkin = ISkin>(type:RType):{name:string,skin:T}[]

		createRenderer<T extends IRenderer = krenderer.IRenderer>(type:RType,...params):T
		createRendererByName<T extends IRenderer = krenderer.IRenderer>(skinName:string,...params):T
		createRendererBySkin<T extends IRenderer = krenderer.IRenderer>(skin:ISkin,...params):T
	}

	let atlas:IAtlas

	enum AudioLoadMode {
		Normal,				// 播放加载,clip为空
		PreloadBackground,	// 后台加载，加载完成前无法播放
		ForcePreload,		// 强制预加载
	}
	interface IAudioThemeClipDefine {
		name:string,		// name如果为空则使用assetName
		assetName:string,	// 必须带bundle内路径
		clip:cc.AudioClip,	// 可以为空，根据assetName加载
		loadMode:AudioLoadMode
	}
	interface IAudioThemeDefine {
		theme:string,				// 语音主题，切换方言等等
		desc:string,				// 描述
		basePathInBundle:string,	// 在bundle里的路径
		clips:IAudioThemeClipDefine[]
	}
	interface IAudioPlayOption {
		asBG?:boolean,			// 作为背景音乐循环播放
		forcePlay?:boolean,		// 即时是加载中，加载完成后强制播放
		findAll?:boolean,		// 如果当前theme没有，检索所有theme
	}
	interface IAudio {
		defaultTheme:string,
		commonDefine:IAudioThemeDefine	// 通用，播放时会先检索这里
		themeDefines:IAudioThemeDefine[]	// 主题，通用找不到会根据theme检索这里
		preloadPathsInBundle:string[]		// 预加载路径

		preload(layer:kroom.IBaseGameLayer):Promise<any>
		play(name:string,opt?:IAudioPlayOption):boolean
		playTheme(theme:string,name:string,opt?:IAudioPlayOption):boolean

		theme:string
	}
	let audio:IAudio
	
	namespace AtlasEvent {
		let OnSkinChanged:string		// RType, Skin
	}

	interface IAniEmojiDefine {
		index:number,
		desc:string,
		prefab:cc.Prefab,
		frame:cc.SpriteFrame
	}
	interface IAniStack {
		createAnimation(name:string):IAniControl	// 创建动画
		createEmoji(index:number):IAniControl		// 创建表情
		createToEmoji(index:number):IAniControl		// 创建交互表情

		getEmojiDefine(index:number):IAniEmojiDefine
		getToEmojiDefine(index:number):IAniEmojiDefine
		getAllEmojiDefines():IAniEmojiDefine[]
		getAllToEmojiDefines():IAniEmojiDefine[]

		/**
		 * 使用Move和End状态
		 */
		playToEmoji(index:number,opt:{
			fromNode:cc.Node,
			toNode:cc.Node,
			parent:cc.Node,
			duration?:number,
		}):IAniControl
		/**
		 * 使用Idle状态
		 */
		playEmoji(index:number,opt:{
			node:cc.Node,
			parent:cc.Node,
			delaySec?:number,
		}):IAniControl
	}

	enum AniStatus {
		Idle,
		Move,
		End,
	}

	enum AniPlayType {
		Loop,
		Destroy,
	}
	interface IAniControl {
		node:cc.Node
		runtimes:{status:AniStatus,playSync:boolean,items:IAniRuntimeItem[]}[]
		
		playSeqs(type:AniPlayType)	// 按顺序播放
		playStatus(status:AniStatus,type:AniPlayType)

		comid_IAniControl()
	}

	interface IAniRuntimeItem {
		node:cc.Node
		target:cc.Node
		playAnimation(callback?:Function)
		playLoopAnimation()
		stop()

		comid_IAniRuntimeItem()
	}

	interface IChatFastDefine {
		text:string,index:number,audioName:string
	}
	interface IChatAssets {
		fastDefines:IChatFastDefine[]
		getFast(index:number):IChatFastDefine
		playFast(index:number):string,			// 返回快捷内容
	}
}