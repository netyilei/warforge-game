import { UIBase } from "../../core/ui/UIBase";
import UserUtils from "../../core/utils/UserUtils";
import { GameConfig_Texas } from "../../games/GameConfig_Texas";
import { ReqUser } from "../../requests/ReqUser";
import { GSUserMsg } from "../../ServerDefines/GSUserMsg";
import { UserDefine } from "../../ServerDefines/UserDefine";


const { ccclass, property, menu } = cc._decorator


namespace UserActionNames {
	export const PlayAction_JuCount 	= "ju_count"	// 参与局数
	export const PlayAction_PreEnter 	= "pre_enter"	// 翻前入池
	export const PlayAction_WinCount 	= "win_count"	// 赢的局数
	export const PlayAction_Gift 		= "gift_count"	// 礼物数
}
@ccclass
@menu('cpp/lobby/UserDefaultLayer')
export class UserDefaultLayer extends UIBase {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Label)
	lblName:cc.Label = null
	@property(cc.Label)
	lblUserID:cc.Label = null

	@property(cc.Label)
	lblJuCount:cc.Label = null
	@property(cc.Label)
	lblPreEnter:cc.Label = null
	@property(cc.Label)
	lblWinCount:cc.Label = null

	@property(cc.Node)
	nodeRootBase:cc.Node = null
	@property([cc.Node])
	nodeEdits:cc.Node[] = []
	@property(cc.Node)
	nodeRootGift:cc.Node = null
	@property(cc.Node)
	nodeExtLayout:cc.Node = null
	@property(cc.Node)
	nodeLayoutGift:cc.Node = null
	@property(cc.Node)
	nodeTemplateGift:cc.Node = null
	onPush(opt:UserDefaultLayer.tOptions): void {
		this.nodeTemplateGift.active = false

		let loginData:UserDefine.tLoginData = kcore.data.get("login/data")
		let isSelf = !opt || !opt.userID || opt.userID == loginData.userID
		if(!isSelf || !opt?.userID) {
			this.scheduleOnce(()=>{
				this.popSelf()
			})
			return 
		}
		let userID = opt.userID || loginData.userID

		if(opt.edit && isSelf) {
			this.nodeEdits.forEach(v=>v.active = true)
		} else {
			this.nodeEdits.forEach(v=>v.active = false)
		}
		let size = this.nodeRootBase.getContentSize()
		this.scheduleOnce(()=>{
			if(this.nodeRootGift.active) {
				size.height += this.nodeRootGift.height
				this.nodeRootBase.setContentSize(size)
			}
		})
		if(opt.inGameGift && !isSelf) {
			this.nodeRootGift.active = true 
		} else {
			this.nodeRootGift.active = false
		}

		this.nodeLayoutGift.destroyAllChildren()
		if(this.nodeRootGift.active) {
			if(krenderer && krenderer.asset && krenderer.asset.ani) {
				let defs = krenderer.asset.ani.getAllToEmojiDefines()
				for(let def of defs) {
					let idx = def.index
					let node = kcore.display.instantiate(this.nodeTemplateGift)
					node.active = true 
					this.nodeLayoutGift.addChild(node)
					let spr = node.getComponentInChildren(cc.Sprite)
					spr.spriteFrame = def.frame
					
					kcore.click.click(node,()=>{
						if(kroom && kroom.env && kroom.env.gameLayer) { 
							let player = kroom.env.gameLayer.selfPlayer
							let toPlayer = kroom.env.gameLayer.players.find(v=>v.userID == userID)
							if(	player 
								&& kroom.env.gameLayer.isChairNoWatcher(player.chairNo) == false 
								&& toPlayer 
								&& kroom.env.gameLayer.isChairNoWatcher(toPlayer.chairNo) == false) {
								kcore.gnet.send(GSUserMsg.Chat,<GSUserMsg.tChatReq>{
									type:GSUserMsg.ChatType.ToEmoji,
									// text:def.text,
									toChairNo:toPlayer.chairNo,
									index:idx,
								})
								this.popSelf()
							}
						}
					})
				}
			}
		}
		UserUtils.instance.load(userID).then((userData)=>{
			this.lblName.string = userData.nickName
			this.lblUserID.string = "ID:" + userData.userID
			kcore.display.setWebTextureStyle(this.sprIcon,userData.iconUrl,{
				style:"opacity"
			})
		})
		this.loadRecord(loginData.userID)
	}

	async loadRecord(userID:number,gameID?:number) {
		this.lblJuCount.string = "-"
		this.lblPreEnter.string = "-"
		this.lblWinCount.string = "-"
		gameID = gameID || GameConfig_Texas.gameID
		let res = await ReqUser.getUserPlayAction({userID:userID,gameID})
		if(res == null || res.errMsg) {
			return 
		}
		if(!this.isValid) {
			return 
		}
		if(!res.data) {
			this.lblJuCount.string = "0"
			this.lblPreEnter.string = "0%"
			this.lblWinCount.string = "0%"
		} else {
			let juCount = res.data.records.find(v=>v.name == UserActionNames.PlayAction_JuCount)?.count || 0
			let preEnterCount = res.data.records.find(v=>v.name == UserActionNames.PlayAction_PreEnter)?.count || 0
			let winCount = res.data.records.find(v=>v.name == UserActionNames.PlayAction_WinCount)?.count || 0
			let giftCount = res.data.records.find(v=>v.name == UserActionNames.PlayAction_Gift)?.count || 0
			if(!juCount) {
				this.lblJuCount.string = "0"
				this.lblPreEnter.string = "0%"
				this.lblWinCount.string = "0%"
			} else {
				this.lblJuCount.string = String(juCount)	
				this.lblPreEnter.string = (preEnterCount / juCount * 100).toFixed(1) + "%"
				this.lblWinCount.string = (winCount / juCount * 100).toFixed(1) + "%"
			}
		}
	}

	onClickModifyUserInfo() {
		kcore.click.playAudio()
		kcore.ui.push("ChangeNameLayer")
	}
}

export namespace UserDefaultLayer {
	export type tOptions = {
		userID?:number,
		edit?:boolean,
		inGameGift?:boolean,
		gameID?:number,
		funcGift?:(idx:number)=>any,
	}
	export function push(opt?:tOptions) {
		kcore.ui.push("UserDefaultLayer",opt)
	}
}