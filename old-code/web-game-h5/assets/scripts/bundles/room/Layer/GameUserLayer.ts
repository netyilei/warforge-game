import { Config } from "../../../core/Config";
import { UIBase } from "../../../core/ui/UIBase";
import { ReqUser } from "../../../requests/ReqUser";
import { GameSet } from "../../../ServerDefines/GameSet";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";

const { ccclass, property, menu } = cc._decorator

namespace ActionNames {
	export const PlayAction_JuCount 	= "ju_count"	// 参与局数
	export const PlayAction_PreEnter 	= "pre_enter"	// 翻前入池
	export const PlayAction_WinCount 	= "win_count"	// 赢的局数
	export const PlayAction_Gift 		= "gift_count"	// 礼物数
}
@ccclass
@menu("game/layer/GameUserLayer")
export default class GameUserLayer extends UIBase {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Label)
	lblName:cc.Label = null
	@property(cc.Label)
	lblUserID:cc.Label = null

	@property(cc.Label)
	lblTotalCount:cc.Label = null
	@property(cc.Label)
	lblRuChi:cc.Label = null
	@property(cc.Label)
	lblWin:cc.Label = null


	@property(cc.Node)
	nodeToEmojiTemplate:cc.Node = null
	@property(cc.Node)
	nodeLayout:cc.Node = null
	private gameLayer_:kroom.IBaseGameLayer
	private chairNo_:number
	onPush(chairNo:number,gameLayer:kroom.IBaseGameLayer): void {
		this.gameLayer_ = gameLayer
		this.chairNo_ = chairNo

		this.nodeToEmojiTemplate.active = false 
		this.nodeLayout.destroyAllChildren()
		if(chairNo != gameLayer.selfChairNo) {
			if(krenderer && krenderer.asset && krenderer.asset.ani) {
				let defs = krenderer.asset.ani.getAllToEmojiDefines()
				for(let def of defs) {
					let idx = def.index
					let node = kcore.display.instantiate(this.nodeToEmojiTemplate)
					node.active = true 
					this.nodeLayout.addChild(node)
					let spr = node.getComponentInChildren(cc.Sprite)
					spr.spriteFrame = def.frame
	
					kcore.click.click(node,()=>{
						if(!this.gameLayer_.players.find(v=>v.chairNo == this.chairNo_)) {
							this.popSelf()
							return 
						}
						kcore.gnet.send(GSUserMsg.Chat,<GSUserMsg.tChatReq>{
							type:GSUserMsg.ChatType.ToEmoji,
							// text:def.text,
							toChairNo:chairNo,
							index:idx,
						})
						this.popSelf()
					})
				}
			}
		}
		this.initData() 
	}

	async initData() {
		this.lblTotalCount.string = "0"
		this.lblRuChi.string = "0%"
		this.lblWin.string = "0%"
		this.lblName.string = "-"
		this.lblUserID.string = ""
		this.sprIcon.node.active = false 
		let player = this.gameLayer_.players.find(v=>v.chairNo == this.chairNo_)
		if(!player) {
			return false 
		}
		this.sprIcon.node.active = true 
		this.lblName.string = player.userData.nickName
		this.lblUserID.string = "ID " + player.userData.userID
		kcore.display.setWebTextureOpt(this.sprIcon,player.userData.iconUrl,{
			defaultSpriteFrame:Config.defaultIconSpriteFrame,
			func:(frame)=>{
				if(!frame) {
					this.sprIcon.node.opacity = 0
				} else {
					this.sprIcon.node.opacity = 255
				}
			}
		})

		let gameSet:GameSet = this.gameLayer_.gameSet
		let res = await ReqUser.getUserPlayAction({userID:player.userID,gameID:gameSet.gameID})
		if(res == null || res.errMsg) {
			return false 
		}
		if(!this.isValid) {
			return 
		}
		if(!this.gameLayer_.players.find(v=>v.chairNo == this.chairNo_)) {
			this.popSelf()
			return 
		}
		if(!res.data) {
			this.lblTotalCount.string = "0"
			this.lblRuChi.string = "0%"
			this.lblWin.string = "0%"
		} else {
			let juCount = res.data.records.find(v=>v.name == ActionNames.PlayAction_JuCount)?.count || 0
			let preEnterCount = res.data.records.find(v=>v.name == ActionNames.PlayAction_PreEnter)?.count || 0
			let winCount = res.data.records.find(v=>v.name == ActionNames.PlayAction_WinCount)?.count || 0
			let giftCount = res.data.records.find(v=>v.name == ActionNames.PlayAction_Gift)?.count || 0
			if(!juCount) {
				this.lblTotalCount.string = "0"
				this.lblRuChi.string = "0%"
				this.lblWin.string = "0%"
			} else {
				this.lblTotalCount.string = String(juCount)	
				this.lblRuChi.string = (preEnterCount / juCount * 100).toFixed(1) + "%"
				this.lblWin.string = (winCount / juCount * 100).toFixed(1) + "%"
			}
		}
		
	}
}