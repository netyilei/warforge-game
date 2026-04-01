import GroupLayerBase from "../../bundles/lobby/GroupLayerBase";
import { SrsUserMsg } from "../../ServerDefines/SrsUserMsg";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/EnterGroupLayer')
export default class EnterGroupLayer extends GroupLayerBase {
	onPush(groupID: number, ignoreRoomIDs?: number[]): void {
		this.maskPopEnabled = false
		this.enterGroup(groupID, ignoreRoomIDs)
	}
	
	handleEnterGroup(t:SrsUserMsg.tEnterGroupRes) {
		// 此处接收是否成功进入房间
	}
	handleExitGroup(t:SrsUserMsg.tExitGroupRes) {
		// 此处接收是否成功退出匹配
		if(!t.b) {
			kcore.log.info("exit group failed")
		} else {
			// 关闭"匹配中"弹窗
		}
	}

	onClickExit() {
		kcore.click.playAudio()
		this.exitGroup()
		this.popSelf()
	}

}