// import Decimal from "decimal.js"
// import { ChainDefine } from "../pp-base-define/ChainDefine"
// import { DB } from "./db"
// import Web3 from "web3"
// import { Log } from "../pp-account/log"
// import { kdasync } from "kdweb-core/lib/tools/async"
// import { kdutils } from "kdweb-core/lib/utils"
// import { TimeDate } from "./TimeDate"


// let tableChain = "t_cc_chains"
// let tableCoin = "t_cc_coins"
// let tableCustomAddress = "t_cc_custom_address"
// let tableCollectMainAddress = "t_cc_collect_main_address"
// let db = DB.get()
// export class ChainDataControl {
// 	constructor() {

// 	}

// 	async getChain(chainID:number) {
// 		return <ChainDefine.tChain>await db.getSingle(tableChain,{chainID:chainID})
// 	}

// 	async getChainByName(name:string) {
// 		return <ChainDefine.tChain>await db.getSingle(tableChain,{name})
// 	}
	
// 	async getChainByNetwork(network:string) {
// 		return <ChainDefine.tChain>await db.getSingle(tableChain,{network})
// 	}

// 	async getChains(chainIDs?:number[]) {
// 		if(chainIDs) {
// 			return <ChainDefine.tChain[]>await db.get(tableChain,{chainID:{$in:chainIDs}})
// 		}
// 		return <ChainDefine.tChain[]>await db.get(tableChain,{})
// 	}

// 	async updateChain(chain:ChainDefine.tChain) {
// 		return await db.updateOrInsert(tableChain,chain,{chainID:chain.chainID})
// 	}

// 	async delChain(chainID:number) {
// 		return await db.delMany(tableChain,{chainID:chainID})
// 	}

// 	async getChainCoin(chainID:number,symbol:string) {
// 		return <ChainDefine.tCoin>await db.getSingle(tableCoin,{symbol:symbol,"chains.chainID":chainID})
// 	}
// 	async getChainCoinbyName(chainID:number,name:string) {
// 		return <ChainDefine.tCoin>await db.getSingle(tableCoin,{name:name,"chains.chainID":chainID})
// 	}

// 	async getChainCoins(chainID:number) {
// 		return <ChainDefine.tCoin[]>await db.get(tableCoin,{"chains.chainID":chainID})
// 	}

// 	async getCoins() {
// 		return <ChainDefine.tCoin[]>await db.get(tableCoin,{})
// 	}

// 	async getItemCoin(itemID:string) {
// 		return <ChainDefine.tCoin>await db.getSingle(tableCoin,{itemID:itemID})
// 	}

// 	async getSymbolCoin(symbol:string) {
// 		return <ChainDefine.tCoin>await db.getSingle(tableCoin,{symbol:symbol})
// 	}
	
// 	async updateCoin(coin:ChainDefine.tCoin) {
// 		return await db.updateOrInsert(tableCoin,coin,{symbol:coin.symbol})
// 	}

// 	async delCoin(symbol:string) {
// 		return await db.delMany(tableCoin,{symbol:symbol})
// 	}

// 	async getMainAddresses(chainID?:number) {
// 		let index:any = {}
// 		if(chainID != null) {
// 			index.chainID = chainID
// 		}
// 		return <ChainDefine.tCollectMainAddress[]>await db.get(tableCollectMainAddress,index) || []
// 	}
// 	async delMainAddress(address:string) {
// 		await db.del(tableCollectMainAddress,{address})
// 	}
// 	async addMainAddress(chainID:number,comment:string) {
// 		let address = await this.createAddress(chainID,comment,"main")
// 		if(!address) {
// 			return false 
// 		}
// 		await db.updateOrInsert(tableCollectMainAddress,<ChainDefine.tCollectMainAddress>{
// 			chainID,
// 			address,comment,timestamp:kdutils.getMillionSecond(),date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
// 		},{
// 			chainID,
// 			address,
// 		})
// 		return true 
// 	}

// 	accToTen(acc:number) {
// 		return Decimal.pow(10,acc)
// 	}

// 	async getCustomAddressKey(chainID:number,address:string) {
// 		let t:ChainDefine.tCustomAddress = await db.getSingle(tableCustomAddress,{chainID:chainID,address:address})
// 		return t ? t.key : null 
// 	}

// 	async createAddress(chainID:number,comment?:string,reason?:string) {
// 		let tryCount = 100
// 		while(true) {
// 			tryCount --
// 			let w = new Web3()
// 			let account = w.eth.accounts.create()
// 			let t:ChainDefine.tCustomAddress = await db.getSingle(tableCustomAddress,{chainID:chainID,address:account.address})
// 			if(t) {
// 				Log.oth.error("create address failed same address ",account,t)
// 				if(tryCount <= 0) {
// 					break 
// 				}
// 				await kdasync.timeout(10)
// 				continue 
// 			}
// 			let address = account.address.toLowerCase()
// 			t = {
// 				chainID,
// 				comment,
// 				address:address,
// 				key:account.privateKey,
// 				reason,
// 				timestamp:kdutils.getMillionSecond(),
// 				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
// 			}
// 			await db.insert(tableCustomAddress,t)
// 			return address
// 		}		
// 	}
// }