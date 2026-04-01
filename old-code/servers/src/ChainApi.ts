// import Decimal from "decimal.js";
// import { ChainDefine } from "../pp-base-define/ChainDefine";
// import { DBDefine } from "../pp-base-define/DBDefine";
// import { UserDefine } from "../pp-base-define/UserDefine";
// import { ChainDataControl } from "./ChainDataControl";
// import { DB } from "./db";
// import { TransactionConfig, TransactionReceipt } from "web3-core"
// import { kdasync } from "kdweb-core/lib/tools/async";
// import { kdutils } from "kdweb-core/lib/utils";
// import { Log } from "../pp-rpc-center/log";
// import Web3 from "web3";


// let dbLogin = DB.get()
// let control = new ChainDataControl()
// export namespace ChainApi {
// 	export async function getBalance(userID:number | UserDefine.tLoginData,symbol:string) {
// 		let loginData:UserDefine.tLoginData
// 		if(typeof(userID) == "number") {
// 			loginData = await dbLogin.getSingle(DBDefine.tableUserLoginData,{userID:userID})
// 			if(!loginData) {
// 				Log.oth.error("[getBalance] cannot get loginData userID = " + userID)
// 				return null 
// 			}
// 		} else {
// 			loginData = userID
// 		}
// 		let chain = await control.getChain(loginData.chainID)
// 		if(!chain) {
// 			Log.oth.error("[getBalance] cannot get chain id = " + loginData.chainID)
// 			return null 
// 		}
// 		let coin = await control.getChainCoin(loginData.chainID,symbol)
// 		if(!coin) {
// 			Log.oth.error("[getBalance] cannot get chain coin id = " + loginData.chainID + " symbol = " + symbol)
// 			return null 
// 		}
// 		let coinChain = coin.chains.find(v=>v.chainID == loginData.chainID)
// 		let w = new Web3(chain.rpcUrl)
// 		if(coinChain.contract) {
// 			let entity = new w.eth.Contract(ChainDefine.DefaultABI_ERC20,coinChain.contract)
// 			return new Decimal(await entity.methods.balanceOf(loginData.address).call()).div(control.accToTen(coinChain.acc))
// 		} else {
// 			return new Decimal(await w.eth.getBalance(loginData.address)).div(control.accToTen(coinChain.acc))	
// 		}
// 	}
// 	export async function getBalanceByItemID(userID:number | UserDefine.tLoginData,itemID:string) {
// 		try {
// 			let loginData:UserDefine.tLoginData
// 			if(typeof(userID) == "number") {
// 				loginData = await dbLogin.getSingle(DBDefine.tableUserLoginData,{userID:userID})
// 				if(!loginData) {
// 					Log.oth.error("[getBalanceByItemID] cannot get loginData userID = " + userID)
// 					return null 
// 				}
// 			} else {
// 				loginData = userID
// 			}
// 			let chain = await control.getChain(loginData.chainID)
// 			if(!chain) {
// 				Log.oth.error("[getBalanceByItemID] cannot get chain id = " + loginData.chainID)
// 				return null 
// 			}
// 			let coin = await control.getItemCoin(itemID)
// 			if(!coin) {
// 				Log.oth.error("[getBalanceByItemID] cannot get chain coin id = " + loginData.chainID + " itemID = " + itemID)
// 				return null 
// 			}
// 			let coinChain = coin.chains.find(v=>v.chainID == loginData.chainID)
// 			if(!coinChain) {
// 				Log.oth.error("[getBalanceByItemID] cannot get chain coin info id = " + loginData.chainID + " itemID = " + itemID,coin)
// 				return null 
// 			}
// 			let w = new Web3(chain.rpcUrl)
// 			if(coinChain.contract) {
// 				let entity = new w.eth.Contract(ChainDefine.DefaultABI_ERC20,coinChain.contract)
// 				return new Decimal(await entity.methods.balanceOf(loginData.address).call()).div(control.accToTen(coinChain.acc))
// 			} else {
// 				return new Decimal(await w.eth.getBalance(loginData.address)).div(control.accToTen(coinChain.acc))	
// 			}
// 		} catch (error) {
// 			Log.oth.error("error",error)
// 			return null
// 		}
// 	}
	
// 	export async function getAddressBalance(address:string,chainID:number,coin:ChainDefine.tCoin) {
// 		try {
// 			let chain = await control.getChain(chainID)
// 			if(!chain) {
// 				Log.oth.error("[getAddressBalance] cannot get chain id = " + chainID)
// 				return null 
// 			}
// 			let coinChain = coin.chains.find(v=>v.chainID == chainID)
// 			let w = new Web3(chain.rpcUrl)
// 			if(coinChain.contract) {
// 				let entity = new w.eth.Contract(ChainDefine.DefaultABI_ERC20,coinChain.contract)
// 				return new Decimal(await entity.methods.balanceOf(address).call()).div(control.accToTen(coinChain.acc))
// 			} else {
// 				return new Decimal(await w.eth.getBalance(address)).div(control.accToTen(coinChain.acc))	
// 			}
// 		} catch (error) {
// 			Log.oth.error("error",error)
// 			return null
// 		}
// 	}
// 	export async function getAddressBalanceByContract(address:string,chainID:number,acc:number,contract?:string) {
// 		try {
// 			let chain = await control.getChain(chainID)
// 			if(!chain) {
// 				Log.oth.error("[getAddressBalance] cannot get chain id = " + chainID)
// 				return null 
// 			}
// 			let w = new Web3(chain.rpcUrl)
// 			if(contract) {
// 				let entity = new w.eth.Contract(ChainDefine.DefaultABI_ERC20,contract)
// 				return new Decimal(await entity.methods.balanceOf(address).call()).div(control.accToTen(acc))
// 			} else {
// 				return new Decimal(await w.eth.getBalance(address)).div(control.accToTen(acc))	
// 			}
// 		} catch (error) {
// 			Log.oth.error("error",error)
// 			return null
// 		}
// 	}
	
// 	export async function transfer(chainID:number,fromAddress:string,toAddress:string,symbol:string,value:string) {
// 		try {
// 			let chain = await control.getChain(chainID)
// 			if(!chain) {
// 				Log.oth.error("[transfer] cannot find chain id = " + chainID)
// 				return null 
// 			}
// 			let coin = await control.getChainCoin(chainID,symbol)
// 			if(!coin) {
// 				Log.oth.error("[transfer] cannot find coin chain id = " + chainID + " symbol = " + symbol)
// 				return null 
// 			}
// 			let key = await control.getCustomAddressKey(chainID,fromAddress)
// 			if(!key) {
// 				Log.oth.error("[transfer] cannot find key chain id = " + chainID + " address = " + fromAddress)
// 				return null 
// 			}
// 			let coinChain = coin.chains.find(v=>v.chainID == chainID)
// 			let w = new Web3(chain.rpcUrl)
// 			let hash:string 
// 			let txObject:TransactionConfig
// 			let gasPrice = await w.eth.getGasPrice()
// 			if(gasPrice == null) {
// 				Log.oth.error("[transfer] cannot get gas price chain id = " + chainID + " rpc = " + chain.rpcUrl)
// 				return null 
// 			}
// 			if(coinChain.contract) {
// 				let dValue = new Decimal(value).mul(Decimal.pow(10,coinChain.acc))
// 				let wContract = new w.eth.Contract(ChainDefine.DefaultABI_ERC20,coinChain.contract)
// 				txObject = {
// 					from: fromAddress,
// 					to: coinChain.contract,
// 					gas:chain.gas.transferContract,
// 					gasPrice:gasPrice,
// 					data: wContract.methods.transfer(toAddress, dValue.toHex()).encodeABI(),
// 					nonce:<any>("0x" + (await w.eth.getTransactionCount(fromAddress) || 0).toString(16)),
// 				};
// 			} else {
// 				let dValue = new Decimal(value).mul(Decimal.pow(10,coinChain.acc))
// 				txObject = {
// 					from:fromAddress,
// 					to:toAddress,
// 					value:dValue.toHex(),
// 					gas:chain.gas.transferMainCoin,
// 					gasPrice:gasPrice,
// 					nonce:<any>("0x" + (await w.eth.getTransactionCount(fromAddress) || 0).toString(16)),
// 				}
// 			}
// 			let raw = await w.eth.accounts.signTransaction(txObject,key)
// 			hash = await new Promise<string>(async (resolve,reject)=>{
// 				let info = await w.eth.sendSignedTransaction(raw.rawTransaction,(error,hash)=>{
// 					if(!hash) {
// 						Log.oth.error("[transfer] cannot send tx 1 chain id = " + chainID,txObject,raw,error)
// 						resolve(null)
// 						return 
// 					}
// 					resolve(hash)
// 				})
// 				if(!info || !info.transactionHash) {
// 					Log.oth.error("[transfer] cannot send tx 2 chain id = " + chainID,txObject,raw)
// 					resolve(null)
// 				} else {
// 					resolve(info.transactionHash)
// 				}
// 			})
// 			return hash 
// 		} catch (error) {
// 			Log.oth.error("error",error)
// 			return null
// 		}
// 	}
// 	export async function call(chainID:number,fromAddress:string,method:string,args:any[]) {

// 	}

// 	export async function mint(chainID:number,fromAddress:string,toAddress:string,symbol:string) {

// 	}
	
// 	export async function waitForHash(chainID:number,hash:string,blockConfirmed?:number) {
// 		blockConfirmed = blockConfirmed || 6 
// 		let chain = await control.getChain(chainID)
// 		if(!chain) {
// 			return false 
// 		}
// 		let ms1 = 3000		// 交易发布超时
// 		let ms2 = 60000		// 区块确认超时
// 		let startTime = kdutils.getMillionSecond()
// 		let w = new Web3(chain.rpcUrl)
// 		try {
// 			while(true) {
// 				kdasync.timeout(1000)
// 				if(kdutils.getMillionSecond() - startTime >= ms1) {
// 					break 
// 				}
// 				let action = await w.eth.getTransaction(hash)
// 				if(!action || !action.blockNumber) {
// 					continue 
// 				}
// 				while(true) {
// 					kdasync.timeout(1000)
// 					if(kdutils.getMillionSecond() - startTime >= ms2) {
// 						break 
// 					}
// 					let verify:TransactionReceipt = await w.eth.getTransactionReceipt(hash)
// 					if(!verify) {
// 						continue 
// 					}
// 					if(!verify.status) {
// 						return false 
// 					}
// 					let curBlockNumber = new Decimal(await w.eth.getBlockNumber())
// 					let verifyBlockNumber = new Decimal(verify.blockNumber)
// 					if(curBlockNumber.sub(verifyBlockNumber).greaterThanOrEqualTo(blockConfirmed)) {
// 						return true 
// 					}
// 				}
// 			}
// 		} catch (error) {
// 			Log.oth.error("wait hash error hash = " + hash, error)
// 		}
// 		return false 
// 	}
// }