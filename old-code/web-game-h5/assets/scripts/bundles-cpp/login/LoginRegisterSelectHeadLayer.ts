import { UIBase } from "../../core/ui/UIBase"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/LoginRegisterSelectHeadLayer')
export default class LoginRegisterSelectHeadLayer extends UIBase {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Node)
	nodeLayout:cc.Node = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property([cc.String])
	frameNames:string[] = []
	private func_:Function = null
	private nodes_:Array<cc.Node & {selNode_:cc.Node}> = []
	onPush(url:string,func:Function): void {
		this.maskPopEnabled = false 
		
		this.func_ = func
		this.nodeTemplate.active = false 
		url = url || this.frameNames[0]
		kcore.display.setWebTextureStyle(this.sprIcon,url,{
			style:"opacity"
		})


		this.nodeLayout.destroyAllChildren()
		for(let name of this.frameNames) {
			let node = cc.instantiate(this.nodeTemplate)
			node.active = true 
			this.nodeLayout.addChild(node)
			let spr = node.childCom("head",cc.Sprite)
			let url = kcore.cache.internalAssetUrlPrefix + name
			kcore.display.setWebTextureStyle(spr,url,{
				style:"opacity"
			})
			node["selNode_"] = node.child("sel")
			node["selNode_"].active = false
			this.nodes_.push(node as cc.Node & {selNode_:cc.Node})

			kcore.click.click(node,()=>{
				this.nodes_.forEach((n)=>{
					n["selNode_"].active = false
				})
				node["selNode_"].active = true 
				this.headUrl_ = url	

				kcore.display.setWebTextureStyle(this.sprIcon,url,{
					style:"opacity"
				})
			})
		}
	}

	private headUrl_ = ""
	async onClickModifyUserInfo() {
		kcore.click.playAudio()
		if(this.func_) {
			this.func_(this.headUrl_)
		}
		this.popSelf()
	}

	onClickBack() {
		this.popSelf()
	}
}