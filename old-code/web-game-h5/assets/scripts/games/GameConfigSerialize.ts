import { GameSet } from "../ServerDefines/GameSet";
import { RoomDefine } from "../ServerDefines/RoomDefine";


export class GameConfigSerialize {
	constructor(gameSet:GameSet,config:tGameConfig) {
		this.gameSet = gameSet
		this.config = config 
	}
	private gameSet_:GameSet = null
	get gameSet() {
		return this.gameSet_
	}
	set gameSet(v) {
		this.gameSet_ = v
	}
	private config_:tGameConfig = null 
	get config() {
		return this.config_
	}
	set config(v) {
		this.config_ = v
	}

	getExtensioNames(group?:number) {
		let ret:string[] = []
		let groups:number[] = []
		if(group != null) {
			groups.push(group)
		} else {
			for(let ext of this.config.lobby_setting.extension) {
				groups.push(ext.group)
			}
		}
		for(let group of groups) {
			let ext = this.config.lobby_setting.extension.find(v=>v.group == group)
			if(ext) {
				for(let i = 0 ; i < ext.names.length ; i ++) {
					if(this.gameSet.checkRule(group,1<<i)) {
						ret.push(ext.names[i])
					}
				}
			}
		}
		return ret 
	}

	getSimpleRules() {
		let ret:string[] = [
			this.gameSet.getUserCount() + "人",
		]
		let str = this.gameSet.getJuCount().toString()
		switch(this.gameSet.getJuType()) {
			case GameSet.JuType_Ju: {
				str += "局"
			} break 
			case GameSet.JuType_Quan: {
				str += "圈"
			} break 
			default: {
				str += "局"
			} break 
		}
		ret.push(str)
		return ret 
	}

	getJuType() {
		let str = ""
		switch(this.gameSet.getJuType()) {
			case GameSet.JuType_Ju: {
				str += "局"
			} break 
			case GameSet.JuType_Quan: {
				str += "圈"
			} break 
			default: {
				str += "局"
			} break 
		}
		return str 
	}

	getRuleInGame() {
		let names = this.getExtensioNames()
		let str = names.join(" ")
		return str 
	}

	getRuleInList() {
		let names = this.getExtensioNames()
		let str = names.join(" ")
		return str 
	}
	// getTeaDeskInfo(teaExt?:RoomDefine.TeaExtension) {
	// 	let str = this.config.game_name
	// 	str += "\n" 
	// 	str += this.getSimpleRules().join("/")
	// 	if(teaExt && teaExt.useFund) {
	// 		str += "\n" + TeaFundUtils.toShow(teaExt.fundExt1) + "准入/" + TeaFundUtils.toShow(teaExt.fundExt2) + "倍数"
	// 	}
	// 	return str 
	// }

	// getTeaBillDetailTitle(boxCode:string) {
	// 	let str = this.config.game_name + "\n房间号:" + boxCode + "\n"
	// 	let rules = this.getSimpleRules()
	// 	str += rules.join(",")
	// 	return str 
	// }
	// getTeaBillDetailRule() {
	// 	return this.getExtensioNames().join("\n")
	// }
	// getTeaTemplateRule() {
	// 	return this.getSimpleRules().join("/") + " " + this.getExtensioNames().join("/")
	// }
}