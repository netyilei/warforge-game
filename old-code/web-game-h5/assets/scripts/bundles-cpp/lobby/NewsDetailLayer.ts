import moment = require("moment");
import { UIBase } from "../../core/ui/UIBase";
import { ReqLobby } from "../../requests/ReqLobby";
import { NewsDefine } from "../../ServerDefines/NewsDefine";
import { JumpUtils } from "../utils/JumpUtils";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/NewsDetailLayer')
export default class NewsDetailLayer extends UIBase {
	@property(cc.Label)
	lblTitle:cc.Label = null
	@property(cc.Label)
	lblAuthor:cc.Label = null
	@property(cc.Label)
	lblDate:cc.Label = null
	@property(cc.Node)
	nodeLayout:cc.Node = null
	@property(cc.Node) 
	nodeTemplateContent:cc.Node = null
	@property(cc.Node)
	nodeTemplateImage:cc.Node = null

	private data_:NewsDefine.tData
	private fullData_:NewsDefine.tData
	onPush(data:NewsDefine.tData) {
		this.nodeTemplateContent.active = false
		this.nodeTemplateImage.active = false
		this.data_ = data
		this.lblTitle.string = data.title
		this.lblAuthor.string = data.author
		this.lblDate.string = moment(data.profileTimestamp).format("YYYY-MM-DD HH:mm:ss")

		this.nodeLayout.destroyAllChildren()
		this.loadData()
	}

	async loadData() {
		let res = await ReqLobby.getNewsDetail({newsID: this.data_.newsID})
		if(!this.isValid) {
			return
		}
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			this.popSelf()
			return
		}
		this.fullData_ = res.data
		for(let content of this.fullData_.contents) {
			if(content.text) {
				let node = kcore.display.instantiate(this.nodeTemplateContent)
				node.active = true 
				let lbl = node.getComponent(cc.Label)
				lbl.string = content.text
				this.nodeLayout.addChild(node)
				if(JumpUtils.isValidJump(content.jump)) {
					lbl.enableUnderline = true 
					kcore.click.click(node,()=>{
						JumpUtils.doJump(content.jump)
					})
				}
			}
			if(content.imgUrl) {
				let node = kcore.display.instantiate(this.nodeTemplateImage)
				node.active = true 
				this.nodeLayout.addChild(node)
				let sp = node.getComponentInChildren(cc.Sprite)
				kcore.display.setWebTextureStyle(sp,content.imgUrl,{
					style:"active",
					func:(frame)=>{
						if(!this.isValid) {
							return
						}
						if(frame) {
							sp.node.opacity = 0
							sp.node.runAction(cc.fadeIn(0.2))
						}
					}
				})
				if(JumpUtils.isValidJump(content.jump)) {
					kcore.click.click(node,()=>{
						JumpUtils.doJump(content.jump)
					})
				}
			}
		}
	}
}