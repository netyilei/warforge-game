import Decimal from "decimaljs";
import { Config } from "../../../core/Config";
import { GameConfig_Texas } from "../../../games/GameConfig_Texas";
import { ItemDefine, ItemID } from "../../../ServerDefines/ItemDefine";
import { UserDefine } from "../../../ServerDefines/UserDefine";
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox";
import LobbyControl_Base from "./LobbyControl_Base";
import { NewsDefine } from "../../../ServerDefines/NewsDefine";
import { PageLimitCaller } from "../../../core/utils/PageLimitCaller";
import { ReqLobby } from "../../../requests/ReqLobby";
import { JumpUtils } from "../../utils/JumpUtils";
import ActiveItemWidget from "./ActiveItemWidget";

const { ccclass, property, menu } = cc._decorator


const ccLobbyLayer_GameDefine = cc.Class({
	name:"ccLobbyLayer_GameDefine",
	properties:{
		gameID:{
			default:0,
		},
		lblUserCount:{
			type:cc.Label,
			default:null,
		},
		open:{
			default:false,
		},
		randUserCount:{
			default:0,
		},
		offsetUserCount:{
			default:0,
		},
	}
})
type LobbyLayer_GameDefine = {
	gameID:number,
	lblUserCount:cc.Label,

	open:boolean,
	randUserCount:number,
	offsetUserCount:number,
}

@ccclass
@menu('cpp/widgets/LobbyControl_Lobby')
export default class LobbyControl_Lobby extends LobbyControl_Base {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Label)
	lblGold:cc.Label = null
	@property(cc.Label)
	lblNickname:cc.Label = null
	@property(cc.Label)
	lblUserID:cc.Label = null

	@property(cc.ScrollView)
	listNews:cc.ScrollView = null
	@property(cc.Node)
	nodeNewsTemplate:cc.Node = null
	@property([ccLobbyLayer_GameDefine])
	gameDefines:LobbyLayer_GameDefine[] = []

	@property(cc.PageView)
	pageBanner:cc.PageView = null
	@property(cc.Node)
	nodeBannerTemplate:cc.Node = null

	@property([ButtonCheckBox])
	activeChecks:ButtonCheckBox[] = []

	protected onLoad(): void {
		kcore.data.listenget("login/data",null,this.node,(data:UserDefine.tLoginData)=>{
			this.lblNickname.string = kcore.utils.cutString(data.nickName,12,"..")
			this.lblUserID.string = "ID:" + data.userID
			kcore.display.loadWebTexture(data.iconUrl).then((frame)=>{
				frame ? (this.sprIcon.spriteFrame = frame) : (this.sprIcon.spriteFrame = Config.defaultIconSpriteFrame)
			})
		})
		kcore.data.listenget("user/items",null,this.node,(items:ItemDefine.tItem[])=>{
			let goldItem = items?.find(v=>v.id == ItemID.Gold)
			let goldCount = goldItem ? goldItem.count : 0
			this.lblGold.string = new Decimal(goldCount).toFixed(2)
		})
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

		let userCounts:{gameID:number,count:number}[] = kcore.data.get("lobby/userCounts",[])
		for(let def of this.gameDefines) {
			let userCountDef = userCounts.find(v=>v.gameID == def.gameID)
			if(userCountDef) {
				def.lblUserCount.string = `${userCountDef.count}`
			} else if(def.randUserCount > 0) {
				def.lblUserCount.string = `${def.offsetUserCount + Math.floor(Math.random() * def.randUserCount)}`
			}
		}

		this.nodeBannerTemplate.active = false 
		this.loadBanners(false)
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
	
	
	async loadBanners(force?:boolean) {
		let banners:NewsDefine.tBanner[] = kcore.data.get("lobby/banners",[])
		if((banners == null || banners.length == 0) || force) {
			let res = await ReqLobby.getBanners({})
			banners = res?.banners || []
			kcore.data.set("lobby/banners",banners)
		}
		this.pageBanner.removeAllPages()
		for(let banner of banners) {
			let page = kcore.display.instantiate(this.nodeBannerTemplate)
			page.active = true 
			let spr = page.getComponent(cc.Sprite)
			this.pageBanner.addPage(page)
			kcore.display.setWebTextureStyle(spr,banner.iconUrl,{
				style:"opacity",
				func:(frame)=>{
					if(!frame) {
						this.pageBanner.removePage(page)
					} else {
						page.opacity = 0
						page.runAction(cc.fadeIn(0.2))
					}
				}
			})
			kcore.click.click(page,()=>{
				if(JumpUtils.isValidJump(banner.jump)) {
					JumpUtils.doJump(banner.jump)
				}
			})
		}

	}

	onClickGame(_,str) {
		kcore.click.playAudio()
		let gameID = parseInt(str)
		let def = this.gameDefines.find(v=>v.gameID == gameID)
		if(def && def.open) {
			switch(gameID) {
				case GameConfig_Texas.gameID: {
					kcore.ui.push("GroupLayer_Texas")
					return 
				} break 
			}
		}
		kcore.toast.push("游戏暂未开放，敬请期待")
	}

	onClickMoreActive() {
		kcore.click.playAudio()
		kcore.ui.push("NewsLayer")
	}
}