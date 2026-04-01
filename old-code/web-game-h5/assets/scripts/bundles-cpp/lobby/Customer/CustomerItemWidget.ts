import moment = require("moment")
import { CustomerDefine } from "../../../ServerDefines/CustomerDefine"
import { UserDefine } from "../../../ServerDefines/UserDefine"
import UserUtils from "../../../core/utils/UserUtils"
import FollowSize from "../../../core/ui/FollowSize"


const { ccclass, property, menu } = cc._decorator

enum CustomerItemWidgetType {
	ChatLeft,
	ChatRight,
}
const ccCustomerItemWidgetLeftRightDefine = cc.Class({
	name:"ccCustomerItemWidgetLeftRightDefine",
	properties:{
		type:{
			default:CustomerItemWidgetType.ChatLeft,
			type:cc.Enum(CustomerItemWidgetType),
		},
		nodeRoot:{
			type:cc.Node,
			default:null,
		},
		nodeChatText:{
			type:cc.Node,
			default:null,
		},
		lblChatText:{
			type:cc.Label,
			default:null,
		},
		nodeChatImage:{
			type:cc.Node,
			default:null,
		},
		sprChatImage:{
			type:cc.Sprite,
			default:null,
		},
		lblDate:{
			type:cc.Label,
			default:null,
		},
		lblGMName:{
			type:cc.Label,
			default:null,
		},
		sprIcon:{
			type:cc.Sprite,
			default:null,
		}
	}
})
type CustomerItemWidgetLeftRightDefine = {
	type:CustomerItemWidgetType,
	nodeRoot:cc.Node,
	nodeChatText:cc.Node
	lblChatText:cc.Label
	nodeChatImage:cc.Node
	sprChatImage:cc.Sprite
	lblDate:cc.Label
	lblGMName:cc.Label
	sprIcon:cc.Sprite
}
@ccclass
@menu("cpp/lobby/customer/CustomerItemWidget")
export default class CustomerItemWidget extends cc.Component {
	@property([ccCustomerItemWidgetLeftRightDefine])
	leftRightDefines:CustomerItemWidgetLeftRightDefine[] = []
	@property(cc.Node)
	nodeLog:cc.Node = null
	@property(cc.Label)
	lblLog:cc.Label = null
	@property(FollowSize)
	follow:FollowSize = null

	clear() {
		this.chat_ = null 
		this.leftRightDefines.forEach(v=>{
			v.nodeChatImage.active = false
			v.nodeChatText.active = false
			v.nodeRoot.active = false
		})
		this.nodeLog.active = false 
	}
	private chat_:CustomerDefine.tChat
	setChat(chat:CustomerDefine.tChat) {
		this.clear()
		this.chat_ = chat
		let loginData:UserDefine.tLoginData = kcore.data.get("login/data")
		let isSelf = loginData && chat.userID == loginData.userID 
		let type = isSelf ? CustomerItemWidgetType.ChatRight : CustomerItemWidgetType.ChatLeft
		let define = this.leftRightDefines.find(v=>v.type == type)
		if(isSelf && define.sprIcon) {
			kcore.display.setWebTextureStyle(define.sprIcon,loginData.iconUrl,{
				style:"opacity",
			})
		}
		define.nodeRoot.active = true
		this.follow.nodeTarget = define.nodeRoot
		switch(chat.type) {
			case CustomerDefine.ChatType.Text:
				define.nodeChatText.active = true
				define.lblChatText.string = chat.content
				break
			case CustomerDefine.ChatType.Image:
				if(!chat.content || chat.content.startsWith("http") == false) {
					define.nodeChatText.active = true
					define.lblChatText.string = chat.content || "loading..."
					return
				}
				define.nodeChatImage.active = true
				kcore.display.setWebTextureStyle(define.sprChatImage,chat.content,{
					style:"opacity",
				})
				break
		}
		define.lblDate.string = moment(chat.timestamp).format("HH:mm")
		if(define.lblGMName) {
			if(isSelf) {
				define.lblGMName.string = ""
			} else {
				define.lblGMName.string = "GM"
				UserUtils.instance.load(chat.userID).then((data)=>{
					if(!this.isValid || this.chat_ != chat) {
						return
					}
					define.lblGMName.string = data ? data.nickName : "GM"
				})
			}
		}
	}

	setLog(content:string) {
		this.clear()
		this.nodeLog.active = true 
		this.lblLog.string = content

		this.follow.nodeTarget = this.nodeLog
	}
}