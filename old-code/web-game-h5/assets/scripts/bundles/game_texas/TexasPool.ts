import Decimal from 'decimaljs'
import { TexasDefine, TexasUserMsg } from "./TexasDefine"

export class TexasPoolUser {
	constructor(chairNo:number) {
		this.chairNo = chairNo
		this.value = new Decimal(0)
		this.betType = null
	}
	chairNo:number
	value:Decimal
	betType:TexasDefine.BetType

	get allin() {
		return this.betType == TexasDefine.BetType.Allin
	}
	setupAllin() {
		this.betType = TexasDefine.BetType.Allin
	}
	get abandon() {
		return this.betType == TexasDefine.BetType.Abandon
	}
	setupAbandon() {
		this.betType = TexasDefine.BetType.Abandon
	}
}
export class TexasPool {
	serialNo:number 
	constructor(serial:number) {
		this.serialNo = serial
	}
	phase:number
	// 总数
	users:TexasPoolUser[] = []

	finished:boolean = false 

	// 标记座位号
	tagChairNo:number 
	// 标记跟平
	tagValue:Decimal = new Decimal(0)


	totalValue = new Decimal(0)
	/**
	 * 
	 * @returns 正确处理返回总数
	 */
	addValue(chairNo:number,value:number | Decimal,betType:TexasDefine.BetType) {
		value = new Decimal(value)
		let user = this.users.find(v=>v.chairNo == chairNo)
		if(!user) {
			return null 
		} else {
			if(betType == TexasDefine.BetType.Abandon) {
				user.value = user.value.add(value)
				user.setupAbandon()
			} else {
				// Log.oth.info("add value phase = " + this.phase + " chairNo = " + chairNo + " value = " + value + " old = " + user.value + " new = " + (user.value.add(value)))
				user.value = user.value.add(value)
				if(this.tagValue) {
					if(user.value.greaterThan(this.tagValue)) {
						this.tagChairNo = user.chairNo
						this.tagValue = new Decimal(user.value)
					}
				} else {
					this.tagChairNo = chairNo
					this.tagValue = new Decimal(user.value)
				}
			}
		}
		if(user.allin || (betType == TexasDefine.BetType.Allin)) {
			user.setupAllin()
		} else {
			user.betType = betType
		}
		this.totalValue = this.totalValue.add(value)
		return user.value
	}

	checkFinished() {
		if(this.finished) {
			return this.finished 
		}
		let abandonCount = this.users.reduce((n,v)=>n + (v.abandon ? 1 : 0),0)
		if(abandonCount >= this.users.length - 1) {
			this.finished = true 
			return this.finished
		}
		let value:Decimal
		for(let user of this.users) {
			if(user.abandon) {
				continue 
			}
			if(user.betType == null) {
				return false 
			}
			if(!value) {
				if(user.value.greaterThan(0)) {
					value = user.value
				}
			} else if(!user.value.eq(value)) {
				return false 
			}
		}
		this.finished = true 
		return this.finished
	}
	toSync() {
		let ret:TexasUserMsg.tTexasPoolSync = {
			serialNo:this.serialNo, 
			phase:this.phase,
			users:this.users.map(v=>{
				return {
					chairNo:v.chairNo,
					value:v.value.toString(),
					betType:v.betType,
				}
			}),
			finished:this.finished,
			tagChairNo:this.tagChairNo,
			tagValue:this.tagValue.toString(),
			totalValue:this.totalValue.toString(),
		}
		return ret 
	}

	static fromSync(sync:TexasUserMsg.tTexasPoolSync) {
		let ret = new TexasPool(sync.serialNo)
		ret.phase = sync.phase
		ret.users = sync.users.map(v=>{
			let user = new TexasPoolUser(v.chairNo)
			user.value = new Decimal(v.value)
			user.betType = v.betType
			return user
		})
		ret.finished = sync.finished
		ret.tagChairNo = sync.tagChairNo
		ret.tagValue = new Decimal(sync.tagValue)
		ret.totalValue = new Decimal(sync.totalValue)
		return ret 
	}
}

export class TexasPoolManager {
	stacks:TexasPool[]

	totalPool:TexasPool

	playingChairNos:number[]
	
	// 记录
	records:{
		chairNo:number,
		value:Decimal,
		betType:TexasDefine.BetType,
	}[]

	userTypes:{
		chairNo:number,
		lastType:TexasDefine.BetType,
		phaseType:TexasDefine.BetType,
	}[]
	serialNo = 0
	constructor(chairNos:number[]) {
		this.records = []
		this.userTypes = []

		this.totalPool = new TexasPool(this.serialNo ++)
		this.totalPool.users = []
		this.totalPool.phase = -1

		this.stacks = [this.totalPool]

		this.playingChairNos = chairNos.slice()
		for(let chairNo of chairNos) {
			this.totalPool.users.push(new TexasPoolUser(chairNo))
		}
	}

	phase:number = -1
	phasePoolStartIdx:number

	get topPhasePool() {
		return this.stacks.length > 1 ? this.stacks[this.stacks.length - 1] : null
	}
	// 把top收拢到total
	// 保留边池
	stepPhase() {
		if(this.phasePoolStartIdx != null) {
			for(let i = this.phasePoolStartIdx ; i < this.stacks.length ; i ++) {
				let pool = this.stacks[i]
				for(let user of pool.users) {
					this.totalPool.addValue(user.chairNo,user.value,
						user.abandon ? TexasDefine.BetType.Abandon : (user.allin ? TexasDefine.BetType.Allin : null))
				}
			}
			// 去掉top
			this.stacks.splice(this.stacks.length - 1,1)
		}
		let pool = new TexasPool(this.serialNo ++)
		this.phase ++
		pool.phase = this.phase
		for(let chairNo of this.playingChairNos) {
			pool.users.push(new TexasPoolUser(chairNo))
		}
		this.stacks.push(pool)
		this.phasePoolStartIdx = this.stacks.length - 1
	}

	getUserTotalValue(chairNo:number) {
		let ret = new Decimal(0)
		for(let pool of this.stacks) {
			let user = pool.users.find(v=>v.chairNo == chairNo)
			if(user) {
				ret = ret.add(user.value)
			}
		}
		return ret 
	}
	getUserCurPhaseTotalValue(chairNo:number) {
		let ret = new Decimal(0)
		for(let i = this.phasePoolStartIdx ; i < this.stacks.length ; i ++) {
			let pool = this.stacks[i]
			let user = pool.users.find(v=>v.chairNo == chairNo)
			if(user) {
				ret = ret.add(user.value)
			}
		}
		return ret 
	}

	getUserNeedValue(chairNo:number) {
		if(!this.playingChairNos.includes(chairNo)) {
			return null 
		}
		let ret = new Decimal(0)
		for(let i = this.phasePoolStartIdx ; i < this.stacks.length ; i ++) {
			let pool = this.stacks[i]
			if(pool.finished) {
				continue 
			}
			if(!pool.tagValue) {
				return new Decimal(0)
			}
			let user = pool.users.find(v=>v.chairNo == chairNo)
			ret.add(pool.tagValue.sub(user?.value || 0))
		}
		return ret 
	}
	/**
	 * @returns 返回下注类型，null为不正确
	 */
	onBet(chairNo:number,value:Decimal,betType:TexasDefine.BetType) {
		switch(betType) {
			case TexasDefine.BetType.Ante:
			case TexasDefine.BetType.SB:
			case TexasDefine.BetType.BB:
			case TexasDefine.BetType.FB:{
				let pool = this.stacks[this.stacks.length - 1]
				pool.addValue(chairNo,value,betType)
				return betType
			}
		}
		if(value.eq(0) && betType == TexasDefine.BetType.Abandon) {
			for(let i = this.phasePoolStartIdx ; i < this.stacks.length ; i ++) {
				let pool = this.stacks[i]
				if(pool.finished) {
					continue 
				}
				let user = pool.users.find(v=>v.chairNo == chairNo)
				if(!user) {
					continue 
				}
				pool.addValue(chairNo,0,betType)
				pool.checkFinished()
			}
			this.records.push({
				chairNo,
				value:new Decimal(0),
				betType:TexasDefine.BetType.Abandon,
			})
			let idx = this.playingChairNos.indexOf(chairNo)
			if(idx >= 0) {
				this.playingChairNos.splice(idx,1)
			}
			return TexasDefine.BetType.Abandon
		}
		if(value.eq(0) && betType == TexasDefine.BetType.Check) {
			this.records.push({
				chairNo,
				value:new Decimal(0),
				betType,
			})
			return betType
		}
		// 如果不是allin，必须大于等于need
		if(betType != TexasDefine.BetType.Allin) {
			let need = this.getUserNeedValue(chairNo)
			if(!need) {
				return null 
			}
			if(need.greaterThan(value)) {
				return null 
			}
		}
		let lastValue = new Decimal(value)
		for(let i = this.phasePoolStartIdx ; i < this.stacks.length ; i ++) {
			let pool = this.stacks[i]
			if(pool.finished) {
				continue 
			}
			let isTop = i == this.stacks.length - 1 
			let user = pool.users.find(v=>v.chairNo == chairNo)
			if(!user) {
				continue 
			}
			let need:Decimal = pool.tagValue ? pool.tagValue.sub(user.value) : null
			// 如果没有需求，则为bet
			// 这里的隐形条件是必须是top，top可能没有tagValue，边池一定有
			if(!need) {
				pool.addValue(chairNo,lastValue,betType)
				this.records.push({
					chairNo,
					value:new Decimal(lastValue),
					betType,
				})
				lastValue = new Decimal(0)
				return TexasDefine.BetType.Bet
			} else {
				// new add
				if(betType == TexasDefine.BetType.Allin){
					pool.addValue(chairNo,lastValue,betType)
					//重新计算边池
					if(this.stacks.length > 2){
						//删除1 到 n-1的边池
						for(let j = 1; j < this.stacks.length - 1; j++){
							this.stacks.splice(j,1)
						}
					}
					//查找allin 并从小到大排序
					let allinArr:Decimal[] = []
					let _copyUsers:TexasPoolUser[] = [];
					for (const user of pool.users) {
						let _find = allinArr.find(v=>v.eq(user.value))
						if(user.allin && !_find){
							allinArr.push(user.value)
						}
						let _tempUser=  new TexasPoolUser(user.chairNo)
						_tempUser.value = user.value;
						_tempUser.betType = user.betType;
						_copyUsers.push(_tempUser)
					}
					allinArr.sort((a,b)=>{return a.comparedTo(b)})
					//计算allin 边池值 eg 10  25  40  to  10  15  15 
					for (let i = allinArr.length-1; i >=0; i--) {
						if(i != 0){
							allinArr[i] =  allinArr[i].sub( allinArr[i-1])
						}
					}
					this.onRemoveAllSidePool();
					//计算pool.users 中 allin 的边池
					for (const allin_ of allinArr) {
						console.log("allin_ = " + allin_)
						let newPool = new TexasPool(this.serialNo ++)
						newPool.phase = pool.phase
						this.stacks.splice(i,0,newPool)
						newPool.tagChairNo = chairNo
						newPool.tagValue = new Decimal(user.value)
						newPool.users = [];

						for(let j = _copyUsers.length - 1; j >= 0 ; j --) {
							let oldUser = _copyUsers[j] 
							if(oldUser.betType != null){
								if(oldUser.value.lessThanOrEqualTo(allin_)){
									_copyUsers.splice(j,1)
									newPool.users.push(oldUser)
								}else{
									oldUser.value = oldUser.value.sub(allin_)
									let _tempUser=  new TexasPoolUser(oldUser.chairNo)
									_tempUser.value = allin_;
									_tempUser.betType = oldUser.betType;
									newPool.users.push(_tempUser);
								}
							}
						}
						//计算newPool.users 中value 总数
						let _tempSumValue = new Decimal(0);
						for (const user_ of newPool.users) {
							_tempSumValue = _tempSumValue.add(user_.value)
						}
						newPool.totalValue = _tempSumValue;
						newPool.checkFinished()
						console.log("newpool",newPool)
						this.onCreateSidePool(newPool)
					}
					
					
					let idx = this.playingChairNos.indexOf(chairNo)
					if(idx >= 0) {
						this.playingChairNos.splice(idx,1)
					}
					return TexasDefine.BetType.Allin	
				}
				// new end
				// 当need更大，必须是allin，并且可能产生边池
				/*
				if(need.greaterThan(lastValue)) {
					// 必须是allin
					if(betType != TexasDefine.BetType.Allin) {
						return null 
					}
					// allin to call，在此处根据自己产生边池
					pool.addValue(chairNo,lastValue,betType)
					let newPool = new TexasPool(this.serialNo ++)
					newPool.phase = pool.phase
					this.stacks.splice(i,0,newPool)
					newPool.users = [user]
					newPool.tagChairNo = chairNo
					newPool.tagValue = new Decimal(user.value)
										
					for(let j = pool.users.length - 1; j >= 0 ; j --) {
						let oldUser = pool.users[j]
						if(oldUser == user) {
							pool.users.splice(j,1)
							continue 
						}
						if(oldUser.abandon && oldUser.value.lessThanOrEqualTo(user.value)) {
							pool.users.splice(j,1)
							newPool.users.push(oldUser)
						} else {
							newPool.users.push(new TexasPoolUser(chairNo))
							oldUser.value = oldUser.value.sub(user.value)
							pool.totalValue = pool.totalValue.sub(user.value)
						}
					}
					pool.tagValue = pool.tagValue.sub(user.value)
					pool.totalValue = pool.totalValue.sub(user.value)

					newPool.checkFinished()
					
					let idx = this.playingChairNos.indexOf(chairNo)
					if(idx >= 0) {
						this.playingChairNos.splice(idx,1)
					}
					this.onCreateSidePool(newPool)
					return TexasDefine.BetType.Allin
				}*/
				else {
					// 如果lastValue比need大，需要看是否是top
					// 如果是top直接加进去，否则要填数
					// 这里如果是allin的话，要等待其他人call或allin，数值不一样再产生边池
					let isEq = need.eq(lastValue)
					if(isTop) {
						pool.addValue(chairNo,lastValue,betType)
						lastValue = new Decimal(0)

						this.records.push({
							chairNo,
							value:new Decimal(value),
							betType,
						})
						return isEq ? TexasDefine.BetType.Call : TexasDefine.BetType.Raise
					} else {
						pool.addValue(chairNo,need,betType)
						lastValue = lastValue.sub(need)
						pool.checkFinished()
						if(lastValue.eq(0)) {
							this.records.push({
								chairNo,
								value:new Decimal(value),
								betType,
							})
							return TexasDefine.BetType.Call
						}
					}
				}
			}
		}
		return null 
	}

	onCreateSidePool(pool:TexasPool) {

	}
	onRemoveAllSidePool() {
		
	}

	toSync() {
		let ret:TexasUserMsg.tTexasPoolManagerSync = {
			stacks:this.stacks.map(v=>v.toSync()),
			playingChairNos:this.playingChairNos.slice(),
			serialNo:this.serialNo,
			phase:this.phase,
			phasePoolStartIdx:this.phasePoolStartIdx,

			userTypes:this.userTypes,
		}
		return ret 
	}

	fromSync(sync:TexasUserMsg.tTexasPoolManagerSync) {
		this.stacks = sync.stacks.map(v=>TexasPool.fromSync(v))
		this.playingChairNos = sync.playingChairNos
		this.serialNo = this.serialNo
		this.phase = this.phase
		this.phasePoolStartIdx = this.stacks.length - 1
		this.totalPool = this.stacks[0]
		this.records = []
		this.userTypes = sync.userTypes
	}
}
