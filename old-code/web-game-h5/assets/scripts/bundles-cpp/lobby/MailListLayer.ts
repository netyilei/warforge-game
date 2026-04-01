import moment = require("moment");
import { UIBase } from "../../core/ui/UIBase";
import { MailDefine } from "../../ServerDefines/MailDefine";
import { ReqLobby } from "../../requests/ReqLobby";
import { ReqUser } from "../../requests/ReqUser";
import ItemUtils from "../../core/utils/ItemUtils";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/MailListLayer')
export default class MailListLayer extends UIBase {
	@property(cc.ScrollView)
	list:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null

	onPush(...params: any[]): void {
		this.maskPopEnabled = false 
		this.nodeTemplate.active = false 
		let caller = kcore.PageLimitCaller.createListViewEx<MailDefine.tMail>({
			loadStep:10,
			loadNow:true,
			view:this.list,
			itemPrefab:()=>{
				let itemNode = cc.instantiate(this.nodeTemplate)
				itemNode.active = true
				return itemNode
			},
			funcLoadCursor:async (cursor)=>{
				let res = await ReqUser.getUserMailList({
					page:cursor.page,
					limit:cursor.limit,
				})
				if(res == null || res.errMsg) {
					kcore.tip.push("提示",res ? res.errMsg : "请求失败")
					return
				}
				
				return {
					count:res.count,
					datas:res.datas,
				}
			},
			func:(idx,data,node)=>{
				let lblTitle = node.childCom("lbl_title",cc.Label)
				let lblType = node.childCom("lbl_type",cc.Label)
				let lblDate = node.childCom("lbl_date",cc.Label)
				let nodeRed = node.child("node_red")
				lblTitle.string = data.title
				lblDate.string = moment(data.sendTime).format("YYYY-MM-DD HH:mm:ss")
				nodeRed.active = !data.isRead
				switch(data.type) {
					case MailDefine.MailType.System: {
						lblType.string = "系统邮件"
					} break
					default: {
						lblType.string = "系统邮件"
					} break
				}
				node["_data_"] = data
				if(!node["_click_"]) {
					kcore.click.click(node,()=>{
						let data:MailDefine.tMail = node["_data_"]
						if(data) {
							kcore.ui.push("MailDetailLayer",data)
							nodeRed.active = false
							data.isRead = true 
						}
					})
				}
			},
			funcClear:(node)=>{
				node["_data_"] = null
			},
		})
	}
}