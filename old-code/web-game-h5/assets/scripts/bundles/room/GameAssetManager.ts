

const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("game/GameAssetManager")
export default class GameAssetManager extends cc.Component implements krenderer.IAssetManager {
	atlas: krenderer.IAtlas;
	audio: krenderer.IAudio;
	ani: krenderer.IAniStack;
	chat: krenderer.IChatAssets;

	@property(cc.Prefab)
	prefabAtlas:cc.Prefab = null
	@property(cc.Prefab)
	prefabAudio:cc.Prefab = null
	@property(cc.Prefab)
	prefabAni:cc.Prefab = null
	@property(cc.Prefab)
	prefabChat:cc.Prefab = null

	onLoad (){
		window["krenderer"] = window["krenderer"] || <any>{}
		window["krenderer"].asset = this 
	}

	protected onDestroy(): void {
		if(window["krenderer"] && window["krenderer"].asset == this) {
			window["krenderer"].asset = null 
		}
	}

	private gameLayer_:kroom.IBaseGameLayer
	async initAssets(gameLayer:kroom.IBaseGameLayer) {
		this.gameLayer_ = gameLayer
		if(this.prefabAtlas) {
			let node = kcore.display.instantiate(this.prefabAtlas)
			this.node.addChild(node)
			this.atlas = kcore.utils.getComponentByMethod(node,"createRenderer")
		}
		if(this.prefabAudio) {
			let node = kcore.display.instantiate(this.prefabAudio)
			this.node.addChild(node)
			this.audio = kcore.utils.getComponentByMethod(node,"preload")
			if(this.audio) {
				await this.audio.preload(this.gameLayer_)
			}
		}
		if(this.prefabAni) {
			let node = kcore.display.instantiate(this.prefabAni)
			this.node.addChild(node)
			this.ani = kcore.utils.getComponentByMethod(node,"createAnimation")
		}
		if(this.prefabChat) {
			let node = kcore.display.instantiate(this.prefabChat)
			this.node.addChild(node)
			this.chat = kcore.utils.getComponentByMethod(node,"getFast")
		}
	}
}