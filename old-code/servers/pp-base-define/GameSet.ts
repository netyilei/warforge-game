import { RoomDefine } from "./RoomDefine"

let setCount = 10
export class GameSet {
	static JuType_Ju = 0
	static JuType_Quan = 1
	
	static createWithData(gameData:RoomDefine.GameData) {
		return new GameSet(gameData.gameID,gameData.bSets,gameData.iSets)
	}

	constructor(gameID?:number,bSets?:number[],iSets?:number[]) {
		gameID = gameID || 0
		bSets = bSets || []
		iSets = iSets || []

		this.bSets_ = []
		this.iSets_ = []

		for(let i = 0 ; i < setCount ; i ++) {
			if(i >= bSets.length) {
				this.bSets_[i] = 0
			} else {
				this.bSets_[i] = bSets[i]
			}
			if(i >= iSets.length) {
				this.iSets_[i] = 0
			} else {
				this.iSets_[i] = iSets[i]
			} 
		}
		this.gameID_ = gameID
	}

	equals(other:GameSet) {
		if(this.gameID != other.gameID) {
			return false 
		}
		for(let i = 0 ; i < setCount ; i ++) {
			if(this.bSets_[i] != other.bSets_[i]) {
				return false 
			}
			if(this.iSets_[i] != other.iSets_[i]) {
				return false 
			}
		}
		return true 
	}

	private gameID_:number;
	get gameID() {
		return this.gameID_
	}
	set gameID(value) {
		this.gameID_ = value
	}

	private bSets_:number[];
	get bSets() {
		return this.bSets_.slice()
	}
	private iSets_:number[];
	get iSets() {
		return this.iSets_.slice()
	}

	setISet(index:number,value:number) {
		this.iSets_[index] = value
		return this 
	}

	get gameData() {
		let data:RoomDefine.GameData = {
			gameID:this.gameID,
			bSets:this.bSets,
			iSets:this.iSets,
		}
		return data 
	}

	checkRule(group,rule){
		let r = this.iSets_[group]
		if(r != null) {
			return (r & rule) != 0
		}
		return false 
	}

	getScore() {
		let b = this.bSets_[0]
		return b 
	} 

	setScore(score) {
		this.bSets_[0] = score
		return this 
	}

	getUserCount() {
		let b = this.bSets_[1] & 0x0F
		return b
	} 

	setUserCount(count) {
		let b = this.bSets_[1] & 0xF0
		this.bSets_[1] = b | (count & 0x0F)
		return this 
	}

	getJuType() {
		let b = this.bSets_[1] & 0xF0
		return b >>> 4
	}

	setJuType(type) {
		let b = this.bSets_[1] & 0x0F
		this.bSets_[1] = ((type & 0x0F) << 4) | b
		return this 
	}

	getJuCount() {
		let b = this.bSets_[2]
		return b 
	} 

	setJuCount(count) {
		this.bSets_[2] = count 
		return this 
	}


	getYuYinDisabled() {
		let b = this.bSets_[3]
		b = (b & 0x01)
		return b > 0
	} 

	setYuYinDisabled(disabled) {
		let b = this.bSets_[3]
		b = disabled ? (b | 0x01) : (b & ~0x01)
		this.bSets_[3] = b
		return this 
	}

	getChatDisabled() {
		let b = this.bSets_[3]
		b = (b & 0x10)
		return b > 0
	} 

	setChatDisabled(disabled) {
		let b = this.bSets_[3]
		b = disabled ? (b | 0x10) : (b & ~0x10)
		this.bSets_[3] = b
		return this 
	}


	getGPSEnabled() {
		let b = this.bSets_[3]
		b = (b & 0x02)
		return b > 0
	} 

	setGPSEnabled(disabled) {
		let b = this.bSets_[3]
		b = disabled ? (b | 0x02) : (b & ~0x02)
		this.bSets_[3] = b
		return this 
	}


	getSameIPEnabled() {
		let b = this.bSets_[3]
		b = (b & 0x04)
		return b > 0
	} 

	setSameIPEnabled(disabled) {
		let b = this.bSets_[3]
		b = disabled ? (b | 0x04) : (b & ~0x04)
		this.bSets_[3] = b
		return this 
	}


	getDefCheatEnabled() {
		let b = this.bSets_[3]
		b = (b & 0x08)
		return b > 0
	} 

	setDefCheatEnabled(disabled) {
		let b = this.bSets_[3]
		b = disabled ? (b | 0x08) : (b & ~0x08)
		this.bSets_[3] = b
		return this 
	}

	getDeskColor() {
		let b = this.bSets_[4]
		return b 
	} 
	
	setDeskColor(color) {
		this.bSets_[4] = color
		return this 
	}

	getSpendMoney() {
		let b = this.bSets_[5]
		return b
	} 

	setSpendMoney(money) {
		this.bSets_[5] = money 
		return this 
	}

	getPayType() {
		let b = this.bSets_[6]
		return b
	} 

	setPayType(type) {
		this.bSets_[6] = type 
		return this 
	}

	// 桌费
	getDeskCost() {
		return this.bSets_[7] & 0x00FFFFFF
	}

	setDeskCost(cost) {
		this.bSets_[7] = (this.bSets_[7] & 0xFF000000) | (cost & 0x00FFFFFF)
		return this 
	}

	setDeskCostType(type:RoomDefine.DeskCostType) {
		this.bSets_[7] = (this.bSets_[7] & 0x00FFFFFF) | ((type & 0xFF) << 24)
		return this 
	}

	getDeskCostType():RoomDefine.DeskCostType {
		return (this.bSets_[7] >> 24) & 0xFF
	}

	// 抽水 百分比
	getWinnerRate() {
		return this.bSets_[8]
	}
	
	setWinnerRate(v) {
		this.bSets_[8] = v 
		return this 
	}
	// 抽水 百分比
	getWinnerRateType() {
		return this.bSets_[9]
	}
	
	setWinnerRateType(v) {
		this.bSets_[9] = v 
		return this 
	}

	// addMode(v:IGameSet.Mode) {
	// 	let n = this.bSets_[9]
	// 	n = n | v 
	// 	this.bSets_[9] = n 
	// 	return this 
	// }

	// removeMode(v:IGameSet.Mode) {
	// 	let n = this.bSets_[9]
	// 	n = n & (~v)
	// 	this.bSets_[9] = n 
	// 	return this 
	// }

	// checkMode(v:IGameSet.Mode) {
	// 	let r = this.bSets_[9]
	// 	if(r != null) {
	// 		return (r & v) != 0
	// 	}
	// 	return false 
	// }

	addRule(group:number,rule:number) {
		let n = this.iSets_[group]
		n = n | rule
		this.iSets_[group] = n
		return this 
	}

	removeRule(group:number,rule:number) {
		let n = this.iSets_[group]
		n = n & (~rule)
		this.iSets_[group] = n
		return this 
	}

	clearRules(group:number) {
		this.iSets_[group] = 0
		return this 
	}
}
