import { UserDefine } from "../../../ServerDefines/UserDefine"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/widgets/MailRedControl")
export default class MailRedControl extends cc.Component {
	@property(cc.Node)
	nodeRed:cc.Node = null
	protected onLoad(): void {
		kcore.data.listenget("mail/reddot",null,this.node,(reddot:UserDefine.UserRedBot)=>{
			(this.nodeRed || this.node).active = !!reddot.mail
		})
	}
	
}