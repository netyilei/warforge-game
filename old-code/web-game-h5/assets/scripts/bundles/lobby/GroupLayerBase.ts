import { UIBase } from "../../core/ui/UIBase";
import { UIBoardBase } from "../../core/ui/UIBoardBase";
import UIRightAction from "../../core/ui/UIRightAction";
import { ReqGame } from "../../requests/ReqGame";
import { SrsUserMsg } from "../../ServerDefines/SrsUserMsg";


const { ccclass, property } = cc._decorator

// 匹配界面基类
// 其他游戏应该从此类继承，或者直接使用此类
@ccclass
export default class GroupLayerBase extends UIBase {
	
	initBase() {
		kcore.gnet(this.node)
			.listen(SrsUserMsg.EnterGroup,kcore.api.handler(this,this.handleEnterGroup))
			.listen(SrsUserMsg.ExitGroup,kcore.api.handler(this,this.handleExitGroup))
	}

	/**
	 * 开始匹配
	 * 调用此方法时，需要开启"匹配中"弹窗
	 * @param groupID 
	 */
	async enterGroup(groupID:number,ignoreRoomIDs?:number[]) {
		kcore.gnet.send(SrsUserMsg.EnterGroup,<SrsUserMsg.tEnterGroupReq>{
			groupID,
			ignoreRoomIDs:ignoreRoomIDs,
		})
	}

	/**
	 * 中断匹配
	 * 不是立即中断，需要通知服务器
	 * "匹配中"弹窗可以提前关闭
	 */
	async exitGroup() {
		kcore.gnet.send(SrsUserMsg.ExitGroup,<SrsUserMsg.tExitGroupReq>{
		})
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


}