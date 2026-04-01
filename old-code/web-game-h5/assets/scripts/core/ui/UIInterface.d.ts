
declare enum UIType {
	Board,
	HalfBoard,
	Normal,
	Normal2,

	Drop,		// static 
	DropAni,		// static 
	ScreenShot,
	Guide,
	Group,		// static 
	Tip,
	Dialog,
	MatchTip,	// static 
	Toast, 
	Announce,

	ComAD,
	Block,
	Top, 

	TypeEnd,
} 

declare namespace UINodeEvent {
	/**
	 * arg1: boolean 
	 */
	let OnTop:string
}
declare interface UIBaseInterface {
	node:cc.Node 
	uiName:string 
	
	onPush(...params:any[])
	onRePush(...params:any[]):boolean 
	onPop()
	onMask()
	onFocusDone(b:boolean)
	onFocus(b:boolean):boolean

	onDead()

	readonly uiType:UIType
	readonly boardCacheEnabled:boolean


	getBoardCacheParams(...params:any[]):any[]

	_Focus:boolean

	maskPopEnabled:boolean

	activePrefab:boolean
	prefab:cc.Prefab 
	readonly isPoped:boolean
	readonly mask:cc.Node

	popSelf()

	setActive(b:boolean)

	_onPush(popFunc:Function,...params:any[])
	_onRePush(...params:any[])

	// for tip layer
	setIgnoreOutBound()
}
