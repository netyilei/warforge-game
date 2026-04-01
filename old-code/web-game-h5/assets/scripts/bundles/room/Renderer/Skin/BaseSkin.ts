

const { ccclass, property } = cc._decorator

@ccclass
export default class BaseSkin extends cc.Component implements krenderer.ISkin {
	private renderers_:krenderer.IRenderer[] = []
	get renderers() {
		return this.renderers_
	}

	get type() {
		return null 
	}

	get defaultFrame() {
		return null 
	}
	
	addRenderer(renderer: krenderer.IRenderer) {
		if(this.renderers_.includes(renderer)) {
			return 
		}
		this.renderers.push(renderer)
	}

	removeRenderer(renderer:krenderer.IRenderer) {
		let idx = this.renderers_.indexOf(renderer)
		if(idx >= 0) {
			this.renderers_.splice(idx,1)
			return true 
		}
		return false 
	}
	clearRenderers() {
		this.renderers.splice(0)
	}
	
}