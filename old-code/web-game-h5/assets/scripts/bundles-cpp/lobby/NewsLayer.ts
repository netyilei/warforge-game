import Decimal from "decimaljs";
import { UIBase } from "../../core/ui/UIBase";
import { PageLimitCaller } from "../../core/utils/PageLimitCaller";
import { ReqLobby } from "../../requests/ReqLobby";
import { NewsDefine } from "../../ServerDefines/NewsDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import ActiveItemWidget from "./widgets/ActiveItemWidget";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/NewsLayer')
export default class NewsLayer extends UIBase {
	@property(cc.ScrollView)
	listNews:cc.ScrollView = null
	@property(cc.Node)
	nodeNewsTemplate:cc.Node = null
	@property([ButtonCheckBox])
	activeChecks:ButtonCheckBox[] = []

	protected onLoad(): void {
		for(let i = 0 ; i < this.activeChecks.length ; i ++) {
			let check = this.activeChecks[i]
			check.isChecked = false 
			check.setFunc(()=>{
				this.onToggleChanged(i)
			})
		}
		this.activeChecks[0].isChecked = true
		this.nodeNewsTemplate.active = false 
		this.onToggleChanged(0)
	}

	private newsType_:NewsDefine.NewsType = null 
	private caller_:kcore.PageLimitCaller<NewsDefine.tData>
	onToggleChanged(activeIndex:number) {
		for(let i = 0 ; i < this.activeChecks.length ; i ++) {
			let check = this.activeChecks[i]
			check.isChecked = (i == activeIndex)
		}
		switch(activeIndex) {
			case 0:{	// 全部
				this.newsType_ = null
			} break 
			case 1:{	// 公告
				this.newsType_ = NewsDefine.NewsType.Announce
			} break 
			case 2:{	// 赛事
				this.newsType_ = NewsDefine.NewsType.Match
			} break 
			case 3:{	// 资讯
				this.newsType_ = NewsDefine.NewsType.News
			} break 
		}
		if(!this.caller_) {
			this.caller_ = PageLimitCaller.createListViewEx({
				loadStep:10,
				loadNow:true,
				view:this.listNews,
				itemPrefab:()=>{
					let node = kcore.display.instantiate(this.nodeNewsTemplate)
					node.active = true 
					return node 
				},
				func:(idx,data,node)=>{
					let com = node.getComponent(ActiveItemWidget)
					com.setData(data)
				},
				funcClear:(node)=>{
					let com = node.getComponent(ActiveItemWidget)
					com.setData(null)
				},
				funcLoadCursor:async (req)=>{
					return await ReqLobby.getNews({
						type:this.newsType_,
						page:req.page,
						limit:req.limit,
					})
				},
			})
		} else {
			this.caller_.clear()
			this.caller_.load(0)
		}
	}
	
	onClickBack() {
		kcore.click.playAudio()
		this.popSelf()
	}
}