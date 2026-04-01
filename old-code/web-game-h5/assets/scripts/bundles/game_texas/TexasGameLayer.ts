import Decimal from 'decimaljs'
import { Display } from '../../core/ui/Display'
import { Datar } from '../../core/utils/Datar'
import { Local } from '../../core/utils/Local'
import { ReqLobby } from '../../requests/ReqLobby'
import { GSUserMsg } from '../../ServerDefines/GSUserMsg'
import { ItemDefine } from '../../ServerDefines/ItemDefine'
import { RoomDefine } from '../../ServerDefines/RoomDefine'
import { UserDefine } from '../../ServerDefines/UserDefine'
import BaseGameLayer from '../room/BaseGameLayer'
import DefaultAtlas from '../room/Renderer/DefaultAtlas'
import { TexasClientDefine } from './TexasClientDefine'
import { TexasGamePhase, TexasUserMsg } from './TexasDefine'
import { TexasLocal } from './TexasLocal'
import { TexasPower } from './TexasPower'

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu('game/texas/TexasGameLayer')
export default class TexasGameLayer extends BaseGameLayer {
	@property(cc.Node)
	nodeFlyChipTemplate: cc.Node = null
	
	// @property({ type: cc.Node })
	// onlooker: cc.Node = null
	// @property({ type: cc.Node })
	// onplayer: cc.Node = null



	async onInitLayer() {

		TexasLocal.init()

		await super.onInitLayer()
		this.nodeFlyChipTemplate.active = false
		
		{
			let cardSkinName = TexasLocal.getItem('cardSkinName')
			if (cardSkinName) {
				let skin = krenderer.atlas.getSkin(
					cardSkinName
				)
				if (skin) {
					krenderer.atlas.setDefaultSkin(
						krenderer.RType.Card,
						cardSkinName,
						true
					)
				}
			}
			let bgSkinName = TexasLocal.getItem('bgSkinName')
			if (bgSkinName) {
				let skin = krenderer.atlas.getSkin(
					bgSkinName
				)
				if (skin) {
					krenderer.atlas.setDefaultSkin(
						krenderer.RType.Background,
						bgSkinName,
						true
					)
				}
			}
			let cardBackSkinName = TexasLocal.getItem('cardBackSkinName')
			if (cardBackSkinName) {
				let skin = krenderer.atlas.getSkin(
					cardBackSkinName
				)
				if (skin) {
					krenderer.atlas.setDefaultSkin(
						krenderer.RType.CardBack,
						cardBackSkinName,
						true
					)
				}
			}
		}

		this.dispMsg.listen(
			TexasClientDefine.Event_FlyChip,
			(
				from: cc.Node,
				to: cc.Node,
				parent: cc.Node,
				count?: number,
				callback?: Function
			) => {
				count = count || 1
				let delay = 0
				for (let i = 0; i < count; i++) {
					let nodeChip = Display.instantiate(this.nodeFlyChipTemplate)
					let fpos = kcore.utils.convertPositionST(from, parent, cc.v2())
					let tpos = kcore.utils.convertPositionST(to, parent, cc.v2())
					kcore.log.info(
						'>>>>>>> fly chip ' +
						from.name +
						'->' +
						to.name +
						' count = ' +
						count +
						' fpos = ' +
						fpos.toString() +
						' toPos = ' +
						tpos.toString()
					)
					parent.addChild(nodeChip)
					nodeChip.active = true
					nodeChip.position2 = fpos
					nodeChip.runAction(
						cc.sequence([
							cc.delayTime(delay),
							cc.moveTo(0.2, tpos).easing(cc.easeOut(2)),
							cc.callFunc(() => {
								if (callback) {
									try {
										callback()
									} catch (error) {
										kcore.log.error('error in ending fly chip ', error)
									}
								}
							}),
							cc.destroySelf(),
						])
					)
					delay += 0.02
				}
			}
		)

		kcore
			.gnet(this.node)
			.listen(TexasUserMsg.PhaseChange, (msg: TexasUserMsg.tPhaseChangeNT) => {
				this.phase_ = msg.phase
			})

		if (krenderer.asset.audio) {
			krenderer.asset.audio.play("bg", { asBG: true })
		}
	}

	private power_: TexasPower = null
	get power() {
		return this.power_
	}

	private phase_: TexasGamePhase = null
	get phase() {
		return this.phase_
	}

	_selfUserID: number = null
	get selfUserID() {
		if (this._selfUserID == null) {
			this._selfUserID = Datar.get('login/data').userID
		}
		return this._selfUserID
	}

	onUserEnter(userData: GSUserMsg.tUserEnterData, player: kroom.IBasePlayer) {
		console.log(userData)
		if (userData.userID == this.selfUserID) {
			this.onSelfEnter()
		}
	}

	onUserStandup(user: GSUserMsg.tUserEnterData) {
		if (user.chairNo == this.selfChairNo) {
			this.onSelfStandup()
		}
	}
	onGameStart(data: TexasUserMsg.tGameStartData): void {
		this.power_ = new TexasPower(this.gameSet)

		if (krenderer.asset.audio) {
			krenderer.asset.audio.play(TexasClientDefine.AUDIO_GAMESTART)
		}
	}
	onGameSync(data: TexasUserMsg.tSyncData): void {
		this.gameSyncDataPrint(data)
		this.phase_ = data.phase
	}

	protected gameSyncDataPrint(data: TexasUserMsg.tSyncData) {
		// let self = Datar.get("login/data")
		// let find = data.users.find((v)=>v.)
		// data.users.
		// let { users, phase, buyin, betTurnNT, pool } = data
		// console.log('========>',data)
		// console.log('玩家:')
		// console.table(users)
	}

	onRoundEnd(removeType: RoomDefine.RemoveType): void {
		this.ignoreBackToLobbyWhenRoundEnd = true
		kcore.tip
			.push('提示', '房间已结束', 1, () => {
				this.backToLobby()
			})
			.setIgnoreOutBound()
	}



	private switchGroupRoom_: boolean = false
	onUserExit(userData:GSUserMsg.tUserEnterData) {
		let roomID = this.roomInfo?.roomID
		if(this.ignoreAutoExit && userData.userID == this.selfUserID) {
			if(this.switchGroupRoom_) {
				kcore.ui.push("EnterGroupLayer", this.roomInfo?.groupID,[roomID])
				return 
			}
		}
		if(userData.userID == this.selfUserID) {
			this.backToLobby()
		}
	}

	onSelfStatus() {
		// this.onlooker.active = this.isOnlooker
		// this.onplayer.active = !this.onlooker.active
	}

	onSelfEnter() {
		this.onSelfStatus()
	}

	onSelfStandup() {
		if(this.roomInfo?.matchID){
			kcore.toast.push("比赛模式无法退出")
			return;
		}
		this.onSelfStatus()
	}

	/**
	 * 用户点击退出
	 */
	onClickExit() {
		kcore.click.playAudio()
		if(this.isFupan) {
			kcore.layer.lobby()
			return true 
		}
		if(this.roomInfo?.matchID){
			kcore.toast.push("比赛模式无法退出")
			return;
		}
		kcore.gnet.send(GSUserMsg.UserExit, {})
		kcore.tip.push("提示","退出请求已发送，请等待本局结束")
		// console.log('isOnlooker = ', this.isOnlooker)
		// kcore.ui.push('TexasExitLayer', this.isOnlooker)
	}

	onClickStandUp() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		kcore.gnet.send(GSUserMsg.UserStandUp, {})
	}

	onClickJiesan() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		let loginData:UserDefine.tLoginData = kcore.data.get("login/data")
		if(this.roomInfo.bossUserID != loginData.userID) {
			kcore.tip.push("提示","只有房主可以解散房间")
			return
		}
		kcore.gnet.send(GSUserMsg.Jiesan, {})
	}
	onClickMenu() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		kcore.ui.push('TexasGameMenuLayer')
	}

	onClickRecord() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		kcore.ui.push('TexasGameRecordListLayer', this)
	}

	onClickChat() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		kcore.ui.push("GameChatLayer", this)
	}

	onClickGameUserScore() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		kcore.ui.push('TexasGameScoreLayer', this)
	}

	async onClickSwitchGroup() {
		kcore.click.playAudio()
		if(this.isFupan) {
			return 
		}
		
		if(!this.roomInfo?.groupID) {
			return 
		}
		let res = await ReqLobby.getGroups({gameID:this.gameSet.gameID})
		if(res == null || res.errMsg) {
			// kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		let group = res.groups.find(v=>v.groupID == this.roomInfo.groupID)
		if(!group) {
			// kcore.tip.push("提示","未找到匹配信息")
			return 
		}

		let items:ItemDefine.tItem[] = kcore.data.get("user/items",[])
		let item = items.find(v=>v.id == group.itemID)

		let itemCount = new Decimal(item?.count || "0")
		let min = new Decimal(group.minItemCount || "0")
		let max = new Decimal(group.maxItemCount || "0")
		
		if(min.greaterThan(0) && itemCount.lessThan(min)) {
			kcore.toast.push(`金币不足`)
			return 
		}
		if(max.greaterThan(0) && itemCount.greaterThan(max)) {
			kcore.toast.push(`金币太多`)
			return 
		}
		this.ignoreAutoExit = true
		this.switchGroupRoom_ = true
		this.onClickExit()
	}
}
