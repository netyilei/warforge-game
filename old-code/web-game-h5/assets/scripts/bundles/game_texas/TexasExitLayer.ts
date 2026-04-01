import { UIBase } from '../../core/ui/UIBase'
import { GSUserMsg } from '../../ServerDefines/GSUserMsg'

const { ccclass, property } = cc._decorator

@ccclass
export default class TexasExitLayer extends UIBase {
	@property({ type: cc.Label })
	contentLbl: cc.Label = null
	@property({ type: cc.Label })
	buttonLbl: cc.Label = null

	/**
	 *
	 * @param isOnlooker 是否是旁观者
	 */
	onPush(isOnlooker: boolean): void {
		if (!isOnlooker) {
			this.contentLbl.string =
				'你正在进行游戏中，需要申请退出后，在当前对局结束后才能离开房间，是否立即申请？'
			this.buttonLbl.string = '立即申请'
		} else {
			this.contentLbl.string = `你当前的状态可以随时退出当前房间，是否立即退出？`
			this.buttonLbl.string = '立即退出'
		}

		

	}

	onClick(){
		kcore.click.playAudio()
		kcore.gnet.send(GSUserMsg.UserExit,{})
		this.popSelf()
	}
}
