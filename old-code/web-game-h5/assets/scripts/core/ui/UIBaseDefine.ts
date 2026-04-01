
export enum UIType {
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

export namespace UINodeEvent {
	/**
	 * arg1: boolean 
	 */
	export const OnTop = "_ex_node_event_top_"
}
