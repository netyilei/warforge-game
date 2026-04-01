import { Config } from "../../../core/Config";
import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import { SrsUserMsg } from "../../../ServerDefines/SrsUserMsg";
import { BasePlayerExtension } from "../BasePlayerExtension";

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/extension/PlayerExt_LoginData")
export default class PlayerExt_LoginData<
		GameLayerClass extends kroom.IBaseGameLayer = kroom.IBaseGameLayer,
		PlayerClass extends kroom.IBasePlayer = kroom.IBasePlayer
	> 
	extends BasePlayerExtension<GameLayerClass,PlayerClass> {
	
	@property(cc.Label)
	lblName:cc.Label = null
	@property()
	nameLength:number = 5
	@property()
	namePattern:string = ".."

	@property(cc.Sprite)
	sprIcon:cc.Sprite = null

	onInitPlayerExtension(): void {
		this.onUserDataChanged()
		kcore.click.click(this.sprIcon.node,()=>{
			kcore.ui.push("GameUserLayer",this.player.chairNo,this.gameLayer)
		})
	}
	onUserDataChanged(): void {
		if(this.nameLength > 0) {
			// this.lblName.string = kcore.api.fixedLen(this.player.userData.nickName,this.nameLength,"..")
			this.lblName.string = this.player.userData.nickName
		} else {
			this.lblName.string = this.player.userData.nickName
		}

		kcore.display.setWebTextureOpt(this.sprIcon,this.player.userData.iconUrl,{
			defaultSpriteFrame:Config.defaultIconSpriteFrame,
			func:(frame)=>{
				if(!frame) {
					this.sprIcon.node.opacity = 0
				} else {
					this.sprIcon.node.opacity = 255
				}
			}
		})
	}
}