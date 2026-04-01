import moment = require("moment");
import { UIBase } from "../../core/ui/UIBase";
import { ReqGame } from "../../requests/ReqGame";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import BillUserListItemWidget from "./widgets/BillUserListItemWidget";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/BillRoomUserDetailLayer")
export default class BillRoomUserDetailLayer extends UIBase {
	@property(cc.ScrollView)
	list:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property(cc.Label)
	lblInfo1:cc.Label = null
	@property(cc.Label)
	lblInfo2:cc.Label = null
	private bill_:RoomDefine.BillData
	onPush(bill:RoomDefine.BillData): void {
		this.bill_ = bill
		this.lblInfo1.string = "对局ID:" + bill.roomID + " " + bill.juCount
		this.lblInfo2.string = moment(bill.endTimestamp).format("YYYY-MM-DD HH:mm:ss")
		this.nodeTemplate.active = false 
		this.list.content.destroyAllChildren()
		for(let user of bill.users) {
			let node = kcore.display.instantiate(this.nodeTemplate)
			node.active = true
			this.list.content.addChild(node)
			let com = node.getComponent(BillUserListItemWidget)
			com.setData(user)
		}
	}

	async onClickFuPan() {
		kcore.click.playAudio()
		let res = await ReqGame.getFupanData({
			roomID:this.bill_.roomID,
			juCount:this.bill_.juCount,
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		let def = kcore.game.getGame(this.bill_.gameData.gameID)
		if(def.prefab) {
			kcore.ui.push(def.prefab,{fupanData:res.data.content})
		} else {
			kroom.env.bundleName = 
				kcore.bundle.getBundleNameByAssetName(def.prefabName)
				||
				kcore.bundle.getBundleNameByAssetName("layers/" + def.prefabName)
			kcore.ui.push(def.prefabName,{fupanData:res.data.content})
		}
	}
}