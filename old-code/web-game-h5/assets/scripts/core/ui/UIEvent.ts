

export namespace UIEvent {
	export const LayerChanged = "UIEvent_LayerChanged"
	export type tLayerChanged = "login" | "lobby" | "game"

	export const BoardUIChanged = "UIEvent_BoardUIChanged"
	export type tBoardUIChanged = string 

	export const LayerPushed = "UIEvent_LayerPushed"
	export type tLayerPushed = string
}