

const { ccclass, property } = cc._decorator

@ccclass
export class BaseGameLayerExtension<GameLayerClass = kroom.IBaseGameLayer> extends cc.Component implements kroom.IBaseLayerExtension<GameLayerClass> {
	
	private gameLayer_:GameLayerClass
	get gameLayer() {
		return this.gameLayer_
	}

	/**
	 * 不应重写本方法
	 * @param gameLayer 
	 * @param player 
	 */
	onInitExtension(gameLayer:GameLayerClass) {
		this.gameLayer_ = gameLayer
		this.onInitLayerExtension()
	}

	/**
	 * 初始化使用本方法
	 */
	onInitLayerExtension() {

	}
	
	onLayerUpdate(dt:number) {

	}
	onLayerDestroy() {

	}

	isBlockMsg(mjMsgName:string) {
		return false 
	}

}