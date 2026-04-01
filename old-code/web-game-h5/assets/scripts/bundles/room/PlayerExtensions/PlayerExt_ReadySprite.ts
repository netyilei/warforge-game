import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { SrsUserMsg } from "../../../ServerDefines/SrsUserMsg";
import { BasePlayerExtension } from "../BasePlayerExtension";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/PlayerExt_ReadySprite")
export default class PlayerExt_ReadySprite<
		GameLayerClass extends kroom.IBaseGameLayer = kroom.IBaseGameLayer,
		PlayerClass extends kroom.IBasePlayer = kroom.IBasePlayer
	>  
	extends BasePlayerExtension<GameLayerClass,PlayerClass> {
	
	@property(cc.Node)
	nodeReady:cc.Node = null
	@property(cc.Sprite)
	sprReady:cc.Sprite = null

	private isGameStart_:boolean = false 
	onInitPlayerExtension(): void {
		this.nodeReady.active = false 
		this.gameLayer.dispMsg.addNode(this.node,null,this)
			.listen(GSUserMsg.GameStart,(msg:GSUserMsg.tGameStartNT)=>{
				this.isGameStart_ = true 
				this.onUserDataChanged()
			})
			.listen(GSUserMsg.GameStart,(msg:GSUserMsg.tGameStartNT)=>{
				this.isGameStart_ = false 
				this.onUserDataChanged()
			})
			.listen(GSUserMsg.Ready,(msg:GSUserMsg.tReadyNT)=>{
				for(let user of msg.users) {
					if(user.chairNo == this.player.chairNo) {
						this.onUserDataChanged()
					}
				}
			})
	}
	onUserDataChanged(): void {
		this.nodeReady.active = !this.isGameStart_ && this.player.ready
	}
}