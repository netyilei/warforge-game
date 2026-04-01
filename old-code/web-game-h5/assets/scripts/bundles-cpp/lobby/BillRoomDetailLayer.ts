import { UIBase } from "../../core/ui/UIBase";
import { GameConfigDefines } from "../../games/GameConfigDefines";
import { ReqGame } from "../../requests/ReqGame";
import { GameSet } from "../../ServerDefines/GameSet";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import BillJuListItemWidget from "./widgets/BillJuListItemWidget";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/BillRoomDetailLayer")
export default class BillRoomDetailLayer extends UIBase {
	@property(cc.ScrollView)
	list:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property(cc.Label)
	lblInfo1:cc.Label = null
	@property(cc.Label)
	lblInfo2:cc.Label = null

	onPush(finalBill:RoomDefine.FinalBillData): void {
		this.nodeTemplate.active = false 
		this.lblInfo1.string = "房间ID:" + finalBill.roomID
		let gameSet = GameSet.createWithData(finalBill.gameData)
		this.lblInfo2.string = GameConfigDefines.getSerialize(gameSet).getRuleInList()

		let caller = kcore.PageLimitCaller.createListViewEx<RoomDefine.BillData>({
			loadStep:20,
			loadNow:true,
			view: this.list,
			itemPrefab:()=>{
				let node = kcore.display.instantiate(this.nodeTemplate)
				node.active = true 
				return node 
			},
			funcLoadCursor: async (cursor)=>{
				let res = await ReqGame.getBills({
					roomID:finalBill.roomID,
					page:cursor.page,
					limit:cursor.limit,
				})
				if(res == null || res.errMsg) {
					kcore.tip.push("提示",res ? res.errMsg : "请求失败")
					return null
				}
				return {
					datas:res.datas,
					count:res.count,
				}
			},
			func:(idx,data,node)=>{
				let com = node.getComponent(BillJuListItemWidget)
				com.setData(data)
			}
		})
	}

}