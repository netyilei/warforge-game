import GameDefineComponent from "../../../core/game/GameDefineComponent";
import { UIClickHelper } from "../../../core/ui/ClickHelper";
import { Display } from "../../../core/ui/Display";
import { UIBase } from "../../../core/ui/UIBase";
import { GameConfigDefines } from "../../../games/GameConfigDefines";
import { GameSet } from "../../../ServerDefines/GameSet";
import { RoomDefine } from "../../../ServerDefines/RoomDefine";
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox";
import { CreateGame_GameName } from "./CreateGame_GameName";
import { CreateGame_Ju } from "./CreateGame_Ju";
import { ICreateGameDelegate } from "./ICreateGameDelegate";


const {ccclass, property} = cc._decorator;

@ccclass
export class CreateGameLayer_Bak extends UIBase implements ICreateGameDelegate {
	@property(cc.Node)
	templateGameName:cc.Node = null
	@property(cc.Node)
	templateLine:cc.Node = null
	@property(cc.Node)
	templateCheckNormal:cc.Node = null
	@property(cc.Node)
	templateCheckMutex:cc.Node = null
	@property(cc.Node)
	templateJu:cc.Node = null
	@property(cc.Node)
	templateColor:cc.Node = null

	@property(cc.Node)
	nodeSetupLayout:cc.Node = null
	@property(cc.Node)
	nodeCheckLayout:cc.Node = null

	@property([cc.Integer])
	lobbyFocusGameIDs:number[] = []

	protected gameIDs_:number[] = []
	protected gameSets_ = new Map<number,GameSet>()
	protected dirty_ = new Map<number,boolean>()

	protected curGameID_:number = null

	protected comGameNames_:CreateGame_GameName[] = []
	protected func_:Function

	get deskColorEnabled() {
		return false
	}
	onPush(func:(gameSet:GameSet)=>any) {
		this.func_ = func

		this.templateGameName.active = false
		this.templateLine.active = false
		this.templateCheckNormal.active = false
		this.templateCheckMutex.active = false
		this.templateJu.active = false
		if(this.templateColor) {
			this.templateColor.active = false
		}

		this.nodeSetupLayout.destroyAllChildren()
		this.nodeCheckLayout.destroyAllChildren()

		this.initGames()
		if(this.gameIDs_.length == 0) {
			return
		}
		let gameID = this.gameIDs_[0]
		// gameID = 105
		this.onSelectGameID(gameID)
	}

	initGames() {
		this.gameIDs_ = []
		let gameDefines = GameDefineComponent.instance.games
		for(let def of gameDefines) {
			this.gameIDs_.push(def.gameID)
		}
		if(CC_BUILD && this.lobbyFocusGameIDs && this.lobbyFocusGameIDs.length > 0) {
			// console.log(this.lobbyFocusGameIDs)
			// this.gameIDs_ = this.gameIDs_.filter(v=>this.lobbyFocusGameIDs.includes(v))
			this.gameIDs_ = []
		}
		// this.gameIDs_ = [161]
		//this.gameIDs_.sort((a,b)=>a-b)

		let self = this
		for(let gameID of this.gameIDs_) {
			let gameConfig = GameConfigDefines.getGameConfig(gameID)
			if(gameConfig.lobby_setting.water) {
				continue
			}
			let node = kcore.display.instantiate(this.templateGameName)
			node.active = true
			this.nodeCheckLayout.addChild(node)


			let com = node.getComponent(CreateGame_GameName)

			this.comGameNames_.push(com)
			com.setInfo(gameConfig.game_name,function() {
				self.onSelectGameID(gameID)
			})
		}
	}

	onClickCreate() {
		UIClickHelper.playAudio()
		let gameSet = this.gameSets_.get(this.curGameID_)
		let func = this.func_
		this.popSelf()
		func(gameSet)
	}

	refreshRenderer() {
		this.dirty_.set(this.curGameID_,true)
		this.onSelectGameID(this.curGameID_)
	}
	onSelectGameID(gameID:number) {
		let idx = this.gameIDs_.indexOf(gameID)
		let com = this.comGameNames_[idx]

		for(let target of this.comGameNames_) {
			if(target == com) {
				target.setSelected(true)
			} else {
				target.setSelected(false)
			}
		}

		this.curGameID_ = gameID
		let gameSet = this.gameSets_.get(this.curGameID_)
		let isNew = gameSet == null
		if(isNew) {
			gameSet = new GameSet(gameID)
			this.gameSets_.set(this.curGameID_,gameSet)
		}
		gameSet.setPayType(0)

		let isDirty = false
		if(this.dirty_.get(this.curGameID_)) {
			this.dirty_.delete(this.curGameID_)
			isDirty = true
		}

		this.nodeSetupLayout.destroyAllChildren()
		let func = GameConfigDefines.getCreateFunc(gameID)
		if(func) {
			func(gameSet,this,{isNew:isNew,isDirty:isDirty})
			if(this.deskColorEnabled) {
				this.addColor(gameSet)
			}
			return
		}
		let self = this
		let gameConfig = GameConfigDefines.getGameConfig(this.curGameID_)
		let lobbySetting = gameConfig.lobby_setting
		// 人数
		{
			let group = new ICreateGameDelegate.SetupGroup(lobbySetting.user_count_title || "人数",this)
			if(isNew) {
				let userCount = lobbySetting.user_count.find(v=>v == lobbySetting.user_count_default)
				gameSet.setUserCount(userCount)
			}
			for(let userCount of lobbySetting.user_count) {
				let com = group.addNode(this.templateCheckMutex)
				com.isMutex = true
				com.setToggleInfo(userCount + "人",function(b) {
					if(b) {
						group.setMutexCheck(com)
						gameSet.setUserCount(userCount)

						self.refreshRenderer()
					}
				})
				com.isChecked = userCount == gameSet.getUserCount()
			}
		}

		// 玩法
		let extensions = lobbySetting.extension
		for(let ext of extensions) {
			this.addExtension(ext,isNew)
		}

		// 局数
		{
			let group = new ICreateGameDelegate.SetupGroup(lobbySetting.ju_count_title || "局数",this)
			let juInfo = lobbySetting.ju_count.find(v=>v.user_count == gameSet.getUserCount())
			if(isNew || isDirty) {
				gameSet.setJuCount(juInfo.count[0])
			}
			for(let i = 0 ; i < juInfo.count.length ; i ++) {
				let juCount = juInfo.count[i]
				let spend = juInfo.spend[i]
				let com = <CreateGame_Ju>group.addNode(this.templateJu)
				com.isMutex = true
				com.setInfo("" + juCount + juInfo.type,spend,function(b) {
					if(b) {
						group.setMutexCheck(com)
						gameSet.setJuCount(juCount)
						gameSet.setSpendMoney(spend)
					}
				})
				if(juCount == gameSet.getJuCount()) {
					com.isChecked = true
					gameSet.setJuCount(juCount)
					gameSet.setSpendMoney(spend)
				} else {
					com.isChecked = false
				}
			}
		}

		// 底分
		{
			let group = new ICreateGameDelegate.SetupGroup(lobbySetting.base_score_title || "底分",this)
			if(isNew) {
				gameSet.setScore(lobbySetting.base_score[0])
			}
			for(let baseScore of lobbySetting.base_score) {
				let com = group.addNode(this.templateCheckMutex)
				com.isMutex = true
				com.setToggleInfo("" + baseScore + "分",function(b) {
					if(b) {
						group.setMutexCheck(com)
						gameSet.setScore(baseScore)
					}
				})
				com.isChecked = baseScore == gameSet.getScore()
			}
		}
		this.addSystemOption()
		if(this.deskColorEnabled) {
			this.addColor(gameSet)
		}
	}

	addColor(gameSet:GameSet) {
		if(!this.templateColor) {
			return
		}
		let node = kcore.display.instantiate(this.templateColor)
		node.active = true
		this.nodeSetupLayout.addChild(node)
		let checks:ButtonCheckBox[] = []
		for(let i = 0 ; i < 5 ; i ++) {
			let idx = i
			let check = node.childCom("check_" + i,ButtonCheckBox)
			checks.push(check)
			check.isChecked = gameSet.getDeskColor() == i
			check.setFunc((b)=>{
				if(b) {
					gameSet.setDeskColor(idx)
					for(let j = 0 ; j < 5 ; j ++) {
						let check = checks[j]
						check.isChecked = j == idx
					}
				}
			})
		}
	}
	addExtension(ext:tGameConfigExtension,isNew?:boolean) {
		let gameSet = this.gameSets_.get(this.curGameID_)
		let isMutex = ext.type == "mutex"
		let template = isMutex ? this.templateCheckMutex : this.templateCheckNormal
		if(isNew) {
			if(ext.defaults == null || ext.defaults.length == 0) {
				if(isMutex) {
					gameSet.addRule(ext.group,1)
				}
			} else {
				for(let v of ext.defaults) {
					gameSet.addRule(ext.group,1 << (v - 1))
				}
			}
		}
		let group = new ICreateGameDelegate.SetupGroup(ext.title || "玩法",this,ext.lineMaxCount)
		for(let i = 0 ; i < ext.names.length ; i ++) {
			let name = ext.names[i]
			let rule = 1 << i
			let com = group.addNode(template)
			com.isMutex = isMutex
			com.setToggleInfo(name,function(b) {
				if(b) {
					if(isMutex) {
						group.setMutexCheck(com)
						gameSet.clearRules(ext.group)
					}
					gameSet.addRule(ext.group,rule)
				} else {
					if(!isMutex) {
						gameSet.removeRule(ext.group,rule)
					}
				}
			})

			com.isChecked = gameSet.checkRule(ext.group,rule)
		}
	}
	addSystemOption() {
		let group = new ICreateGameDelegate.SetupGroup("系统设置",this,3)
		let names = [
			"开启定位",
			"防作弊",
			"禁用聊天"
		]
		let gameSet = this.gameSets_.get(this.curGameID_)
		let funcs = [
			{
				set:gameSet.setGPSEnabled,
				get:gameSet.getGPSEnabled,
			},
			{
				set:gameSet.setDefCheatEnabled,
				get:gameSet.getDefCheatEnabled,
			},

			{
				set:gameSet.setChatDisabled,
				get:gameSet.getChatDisabled,
			}
		]
		for(let i = 0 ; i < names.length ; i ++) {
			let name = names[i]
			let fInfo = funcs[i]
			let rule = 1 << i
			let com = group.addNode(this.templateCheckNormal)
			com.isMutex = false
			com.setToggleInfo(name,function(b) {
				if(b) {
					fInfo.set.apply(gameSet,[true])
				} else {
					fInfo.set.apply(gameSet,[false])
				}
			})

			com.isChecked = fInfo.get.apply(gameSet)
		}

	}
}