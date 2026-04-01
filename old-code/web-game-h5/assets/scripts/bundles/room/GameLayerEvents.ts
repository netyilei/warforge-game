

export namespace GameLayerEvents {
	// 当创建桌面用户
	export const ON_CREATEPLAYER = "Layer_OnCreatePlayer"
	export type tON_CREATEPLAYER = kroom.IBasePlayer

	// 当点击游戏桌面
	export const ON_CLICKBOARD = "Layer_OnClickBoard"
	
	export const ON_CLICKMENU = "Layer_OnClickMenu"
	export const ON_FUPANSTART = "Layer_OnFupanStart"
}