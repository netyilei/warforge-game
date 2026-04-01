

// import Web3 = require('web3');
// import Decimal from 'decimaljs';
// let w:any = Web3
// export namespace BlockChainWallet {
// 	let contractAddress = ""
// 	let tokenAcc = 18
// 	let chainID:number // = 21471
// 	let selfAddress:string 
// 	export async function init() {
// 		if(!window["ethereum"]) {
// 			return false 
// 		}
// 		// 正式环境USDT
// 		// contractAddress = "0x59185C3d8F4Eb9bC8aFC8f942CB0612a010Cf31d"

// 		// 测试环境USDT
// 		// contractAddress = "0xA98F1Fa361708ffd596591992130eb5Ed69Fc888"
// 		try {
// 			let accounts:string[] = await window["ethereum"].request({method:"eth_requestAccounts"})
// 			if(!accounts || accounts.length == 0) {
// 				return false 
// 			}
// 			selfAddress = accounts[0]
// 			chainID = window["ethereum"].chainId
// 			if(chainID == null) {
// 				let str = await window["ethereum"].request({ method: 'eth_chainId' })
// 				if(!str) {
// 					cc.error("get chain id failed")
// 					return false 
// 				}
// 				chainID = parseInt(str, 16)
// 			} else {
// 				if(typeof(chainID) == "string") {
// 					chainID = parseInt(chainID, 16)
// 				}
// 			}
// 		} catch (error) {
// 			cc.error("error in wallet init",error)
// 		}
// 		return true 
// 	}
// 	export function getChainID() {
// 		return chainID
// 	}

// 	export function getAddress() {
// 		return selfAddress
// 	}

// 	export function getContract() {
// 		return contractAddress
// 	}

// 	export function setContract(address:string) {
// 		address = address ? address.trim() : null
// 		contractAddress = address ? address : null
// 	}

// 	export async function personalSign(content:string) {
// 		try {
// 			let w3 = new w(window["ethereum"])

// 			let signature = await w3.eth.personal.sign(content, selfAddress, '');
// 			return signature
// 		} catch (error) {
// 			cc.error("",error)
// 		}
// 		return null 
// 	}
// 	/**
// 	 * 主网币/USDT转账
// 	 * @param toAddress 
// 	 * @param amount 数量
// 	 * @returns 返回交易hash，用于提交 /chain/request
// 	 */
// 	export function transferToken(toAddress:string,amount:string) {
// 		let w3 = new w(window["ethereum"])

// 		return new Promise<string>(async (resolve,reject)=>{
// 			let txObject
// 			if(contractAddress) {
// 				let data = w3.eth.abi.encodeFunctionCall({
// 					name: 'transfer',
// 					type: 'function',
// 					inputs: [{
// 						type: 'address',
// 						name: '_to'
// 					},{
// 						type: 'uint256',
// 						name: '_value'
// 					}]
// 				}, [toAddress, Decimal.mul(amount,Decimal.pow(10,tokenAcc)).toHex()]);
// 				txObject = {
// 					to: contractAddress, // Required except during contract publications.
// 					from: selfAddress, // must match user's active address.
// 					value: 0, // Only required to send ether to the recipient from the initiating external account.
// 					data:data,
// 					gas:"70000",
// 					gasPrice:await w3.eth.getGasPrice(),
// 				}; 
// 				// window["ethereum"].request({
// 				// 	method: 'eth_sendTransaction',
// 				// 	params: [txObject],
// 				// }).then((hash)=>{
// 				// 	console.log("hash = ",hash)
// 				// 	resolve(hash)
// 				// }).catch((error)=>{
// 				// 	console.error(error);
// 				// 	resolve(null)
// 				// })
// 			} else {
// 				txObject = {
// 					to: toAddress, // Required except during contract publications.
// 					from: selfAddress, // must match user's active address.
// 					value: Decimal.mul(amount,Decimal.pow(10,tokenAcc)).toHex(), // Only required to send ether to the recipient from the initiating external account.
// 					gas:"70000",
// 					gasPrice:await w3.eth.getGasPrice(),
// 				}; 
// 				// window["ethereum"].request({
// 				// 	method: 'eth_sendTransaction',
// 				// 	params: [txObject],
// 				// }).then((hash)=>{
// 				// 	console.log("hash = ",hash)
// 				// 	resolve(hash)
// 				// }).catch((error)=>{
// 				// 	console.error(error);
// 				// 	resolve(null)
// 				// })
// 			}
// 			w3.eth.sendTransaction(txObject)
// 				.on('transactionHash', hash => {
// 					console.log("hash = ",hash)
// 					resolve(hash)
// 				})
// 				.on('receipt', receipt => {
// 					console.log(receipt)
// 				})
// 				.on('error', error => {
// 					console.error(error);
// 					resolve(null)
// 				})
// 		})
// 	}
// }