import { NewsDefine } from "../../../ServerDefines/NewsDefine"

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/widgets/ActiveItemWidget")
export default class ActiveItemWidget extends cc.Component {
	@property(cc.Label)
	lblTitle:cc.Label = null
	@property(cc.Label)
	lblContent:cc.Label = null
	@property(cc.Sprite)
	sprImage:cc.Sprite = null
	@property()
	titleFixedLength:number = 20
	@property()
	contentFixedLength:number = 50


	private data_:NewsDefine.tData
	setData(data?:NewsDefine.tData) {
		this.data_ = data
		if(!data) {
			this.lblTitle.string = ""
			this.lblContent.string = ""	
			this.sprImage.node.active = false
			return
		}
		this.lblTitle.string = kcore.api.fixedLen(data.listTitle || data.title,this.titleFixedLength)
		this.lblContent.string = kcore.api.fixedLen(data.listAbstract,this.contentFixedLength)

		this.sprImage.node.active = true
		kcore.display.setWebTextureStyle(this.sprImage,data.listImageUrl,{
			style:"opacity",
			func:(frame)=>{
				console.log(frame)
			}
		})
	}

	onClick() {
		kcore.click.playAudio()
		kcore.ui.push("NewsDetailLayer",this.data_)
	}
}