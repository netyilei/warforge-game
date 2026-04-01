import Foldout from "../../core/ui/Foldout"
import { UIBase } from "../../core/ui/UIBase"
import { ReqUser } from "../../requests/ReqUser"
import { ItemDefine } from "../../ServerDefines/ItemDefine"
import { UserDefine } from "../../ServerDefines/UserDefine"
import UserSerialItemWidget from "./widgets/UserSerialItemWidget"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu("cpp/lobby/UserSerialLayer")
export default class UserSerialLayer extends UIBase {
	@property(cc.ScrollView)
	list:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property(Foldout)
	foldout:Foldout = null

	private caller_:kcore.PageLimitCaller<ItemDefine.tSerial>
	private type_:ItemDefine.SerialType
	onPush(...params: any[]): void {
		this.nodeTemplate.active = false
		this.caller_ = kcore.PageLimitCaller.createListViewEx<ItemDefine.tSerial>({
			loadStep:20,
			loadNow:true,
			view: this.list,
			itemPrefab:()=>{
				let node = kcore.display.instantiate(this.nodeTemplate)
				node.active = true
				return node
			},
			funcLoadCursor: async (cursor)=>{
				let res = await ReqUser.getSerials({
					type:this.type_,
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
				let com = node.getComponent(UserSerialItemWidget)
				com.setData(data)
			},
		})

		let typeInfos:{
			type:ItemDefine.SerialType,
			name:string,
		}[] = [
			{
				type:null,
				name:"全部",
			},
			{
				type:ItemDefine.SerialType.System,
				name:"系统",
			}
		]

		this.foldout.setup(typeInfos.map(v=>v.name), 0, (idx)=>{
			this.type_ = typeInfos[idx].type
			this.caller_.clear()
			this.caller_.load(0)
		})
	}

	onClickMailBox() {
		kcore.click.playAudio()
		kcore.ui.push("MailListLayer")
	}
}