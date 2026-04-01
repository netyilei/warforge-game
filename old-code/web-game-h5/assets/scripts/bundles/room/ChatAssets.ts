

const { ccclass, property, menu } = cc._decorator

const ccChatAssetsFastDefine = cc.Class({
	name:"ccChatAssetsFastDefine",
	properties:{
		text:{
			default:"",
		},
		index:{
			default:-1,
		},
		audioName:{
			tooltip:"定义在DefaultAudio里的名字",
			default:""
		},
	}
})
type ChatAssetsFastDefine = {
	text:string,index:number,audioName:string
}
@ccclass
@menu("game/ChatAssets")
export default class ChatAssets extends cc.Component implements krenderer.IChatAssets {
	@property([ccChatAssetsFastDefine])
	fastDefines:ChatAssetsFastDefine[] = []

	getFast(index: number): krenderer.IChatFastDefine {
		return this.fastDefines.find(v=>v.index == index)
	}

	playFast(index:number) {
		let def = this.getFast(index)
		if(!def) {
			return null 
		}
		if(krenderer.asset.audio) {
			krenderer.asset.audio.play(def.audioName)
		}
		return def.text
	}
}