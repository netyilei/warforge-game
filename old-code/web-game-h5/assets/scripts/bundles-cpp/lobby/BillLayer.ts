import Foldout from "../../core/ui/Foldout";
import { UIBase } from "../../core/ui/UIBase";
import { ReqGame } from "../../requests/ReqGame";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import { UserDefine } from "../../ServerDefines/UserDefine";
import BillListItemWidget from "./widgets/BillListItemWidget";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/BillLayer")
export default class BillLayer extends UIBase {
	@property(cc.ScrollView)
	list:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property(Foldout)
	foldOut:Foldout = null

	private caller_:kcore.PageLimitCaller<RoomDefine.FinalBillData>
	onPush(...params: any[]): void {
		this.nodeTemplate.active = false
		this.caller_ = kcore.PageLimitCaller.createListViewEx<RoomDefine.FinalBillData>({
			loadStep:20,
			loadNow:true,
			view: this.list,
			itemPrefab:()=>{
				let node = kcore.display.instantiate(this.nodeTemplate)
				node.active = true
				return node
			},
			funcLoadCursor: async (cursor)=>{
				let res = await ReqGame.getFinalBills({
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
				let com = node.getComponent(BillListItemWidget)
				com.setData(data)
			}
		})
	}
	onClickBack() {
		kcore.click.playAudio()
		this.popSelf()
	}
	onClickMailBox() {
		kcore.click.playAudio()
		kcore.ui.push("MailListLayer")
	}
}