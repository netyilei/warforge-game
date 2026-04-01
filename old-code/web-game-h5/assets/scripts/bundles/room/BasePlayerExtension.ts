

const { ccclass, property } = cc._decorator

@ccclass
export class BasePlayerExtension<
		GameLayerClass extends kroom.IBaseGameLayer = kroom.IBaseGameLayer,
		PlayerClass extends kroom.IBasePlayer = kroom.IBasePlayer
	> 
	extends cc.Component 
	implements kroom.IBasePlayerExtension<GameLayerClass,PlayerClass> {
	
	private gameLayer_:GameLayerClass
	get gameLayer() {
		return this.gameLayer_
	}
	private player_:PlayerClass
	get player() {
		return this.player_
	}

	/**
	 * 不应重写本方法
	 * @param gameLayer 
	 * @param player 
	 */
	onInitPlayer(gameLayer:GameLayerClass,player:PlayerClass) {
		this.gameLayer_ = gameLayer
		this.player_ = player
		this.onInitPlayerExtension()
	}

	/**
	 * 初始化使用本方法
	 */
	onInitPlayerExtension() {

	}

	/**
	 * 刷新状态
	 */
	onUserDataChanged() {

	}
	
	onPlayerRelease() {
		if(this.gameLayer_) {
			this.gameLayer_.dispMsg.addNode(this.node).clear()
		}
		this.gameLayer_ = null 
		this.player_ = null 
	}
	onLayerUpdate(dt:number) {

	}
}