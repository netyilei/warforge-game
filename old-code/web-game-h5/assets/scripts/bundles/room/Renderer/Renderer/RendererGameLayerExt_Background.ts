import { BaseGameLayerExtension } from "../../BaseGameLayerExtension";
import { GameLayerEvents } from "../../GameLayerEvents";


const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/renderer/RendererGameLayerExt_Background")
@menu("game/extension/RendererGameLayerExt_Background")
export default class RendererGameLayerExt_Background extends BaseGameLayerExtension implements krenderer.IBackground {
	
	@property(cc.Sprite)
	sprBG:cc.Sprite = null
	@property(cc.Node)
	nodeClickBackground:cc.Node = null

	get type() {
		return krenderer.RType.Background
	}
	
	onInitLayerExtension(): void {
		if(this.nodeClickBackground) {
			kcore.click.click(this.nodeClickBackground,()=>{
				this.gameLayer.dispMsg.dispatch(GameLayerEvents.ON_CLICKBOARD)
			})
		}
		krenderer.atlas.disp.addNode(this.node,null,this)
			.listen(krenderer.AtlasEvent.OnSkinChanged,(rtype:krenderer.RType,skin:krenderer.ISkin)=>{
				if(rtype == krenderer.RType.Background) {
					this.useSkin(skin as krenderer.ISkinBackground)
				}
			})
		let defaultSkin = krenderer.atlas.getDefaultSkin(krenderer.RType.Background)
		if(defaultSkin) {
			this.useSkin(defaultSkin as krenderer.ISkinBackground)
		}
	}

	useSkin(skin:krenderer.ISkinBackground) {
		if(!skin) {
			return 
		}
		this.sprBG.spriteFrame = skin.frame
		return true 
	}

	useSkin2(skin: krenderer.ISkin): boolean {
		return false 
	}

	onInitRenderer() {}
}