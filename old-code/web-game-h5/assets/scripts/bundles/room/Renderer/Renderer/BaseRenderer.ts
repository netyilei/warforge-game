
const { ccclass, property } = cc._decorator

@ccclass
export default class BaseRenderer extends cc.Component implements krenderer.IRenderer {
	get type() {
		return null 
	}

	useSkin(skin:krenderer.ISkin):boolean {
		return false 
	}
	useSkin2(skin:krenderer.ISkin):boolean {
		return false 
	}

	onInitRenderer(...params: any[]) {
		
	}
}