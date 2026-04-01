// import { Transaction, TransactionReceipt } from "ethers"
// import { AbiItem } from "web3-utils"

// export namespace ChainDefine {
// 	export type tChain = {
// 		chainID:number,
// 		name:string,
// 		desc:string,
// 		coinType:string,				// BIP44类型
// 		network:string,					// 网络标记
// 		gas:{
// 			transferMainCoin:string,	// 主网币gas
// 			transferContract:string,	// 代币gas
// 			createContract:string,		// 创建合约gas
// 		}
// 		mainAcc:number,		// 主网币精度
// 		blockConfirmed:number,	// 等待区块高度
// 		rpcUrl:string,	// 接入点
// 	}

// 	export type tCoin = {
// 		itemID?:string,				// 映射itemID
// 		name:string,
// 		symbol:string,				// 符号 USDT
// 		acc:number,					// 平台精度
// 		chains:{
// 			chainID:number,
// 			contract:string,		// 是否是合约
// 			acc:number,				// 精度 6 18
// 			blockConfirmed:number,	// 需要确认的区块数

// 			rate:number,			// 充值兑换比例
// 			chargeEnabled:boolean,		// 可以充值
// 			withdrawEnabled:boolean,	// 可以提现
// 			withdrawFee:{				// 提现手续费
// 				fixedValue?:string,
// 				percent?:number,
// 			}
// 			withdrawMinValue:string,	// 提现最小值
// 			withdrawMaxValue:string,	// 提现最大值
// 			withdrawRate:number,		// 提现汇率
// 		}[]
// 	}

// 	export type tCustomContract = {
// 		chainID:number,
// 		name:string,
// 		contract:string,
// 		isCoin?:boolean,
// 		abis:AbiItem[],
// 	}
	
// 	export type tUdunCoin = {
// 		chainID:number,
// 		name:string,
// 		symbol:string,
// 		acc:number,
// 		udunID:string,
// 		udunSubID:string,
// 	}

// 	export type tUdunUserAddress = {
// 		chainID:number,
// 		comment:string,
// 		address:string,
// 		timestamp:number,
// 		date:string,
// 	}

// 	export type tCustomAddress = {
// 		chainID:number,
// 		comment:string,
// 		address:string,
// 		key:string,

// 		reason?:any,
// 		timestamp:number,
// 		date:string,
// 	}

// 	export enum ChainReqStatus {
// 		Wait,
// 		Sending,	// 发送中
// 		Success,	
// 		Failed,
// 	}
	
// 	export type tChainReq = {
// 		no:number,			// 流水号
// 		chainID:number,		// 公链ID
// 		from:string,		// from
// 		to:string,			// to 
// 		gas?:string,
// 		gasPrice?:string,
// 		value:string,		// 数量
// 		acc:number,			// 精度
// 		contract?:string,	// 合约
		
// 		hash:string,		// Hash
// 		status:ChainReqStatus,	// 状态

// 		tag:string,			// 注释
// 		data?:any,
// 		relateNos?:number[],// 相关
// 		blockHeight?:number,// 等待区块高度
// 		timestamp:number,	// 开始时间
// 		date:string,
// 		endTimestamp:number,// 结束时间
// 		endDate:string,
// 	}

// 	export type tCollectTask = {
// 		taskID:number,
// 		chainID:number,			// 公链ID
// 		coinName:string,		// 币种名字
// 		mainAddress:string,		// 主地址
// 		totalValue:string,		// 总数
// 		curValue:string,		// 当前数量
// 		totalFee:string,		// 总手续费
// 		reqNos:number[],		// chainReq.no
// 		status:{
// 			no:number,
// 			status:ChainReqStatus,
// 		}[]
// 		minValue?:string,		// 最小归集
// 		maxValue?:string,		// 最大归集
// 		startTimestamp:number,
// 		startDate:string,
// 		endTimestamp:number,
// 		endDate:string,
// 	}

// 	export type tCollectMainAddress = {
// 		chainID:number,
// 		address:string,
// 		comment:string,
// 		timestamp:number,
// 		date:string,
// 	}
// 	export type tAddressBook = {
// 		chainID:number,
// 		address:string,
// 		comment:string,
// 		timestamp?:number,
// 		date?:string,
// 	}

// 	export type tChargeNotify = {
// 		no:number,
// 		network:string,
// 		coin:string,
// 		coinAddr:string,
// 		amount:string,
// 		txHash:string,
// 		from:string,
// 		to:string,

// 		confirm:boolean,
// 		oper:boolean,
// 		reason?:any
// 		timestamp:number,
// 		date:string,
// 	}

// 	export type tChargeRecord = {
// 		no:number,
// 		userID:number,
// 		chainID:number,
// 		address:string,
// 		hash:string,
// 		contract:string,
// 		coinName:string,
// 		amount:string,
// 		value:string,
// 		acc:number,
// 		txValue:string,
// 		txObject:Transaction,
// 		txReceipt:TransactionReceipt,
// 		data:any,
// 		timestamp:number,
// 		date:string,
// 	}

// 	export type tWithdrawReq = {
// 		no:number,
// 		userID:number,
// 		chainID:number,		// 公链
// 		address:string,		// 地址
// 		coinName:string,	// 币种名字
// 		itemID:string,
// 		value:string,		// 提现数值
// 		feeValue:string,	// 手续费 币
// 		lastValue:string,	// 到账数量 币
// 		rate:number,		// 汇率
// 		txValue:string,		// 币种数值
// 		acc:number,			// 币种精度

// 		oper:boolean,		// 是否处理
// 		confirm:boolean,	// 是否同意

// 		reqTimestamp:number,
// 		reqDate:string,

// 		operTimestamp:number,
// 		operDate:string,
// 	}

// 	export type tWithdrawRecord = {
// 		no:number,
// 		reqNo:number,		// 请求no
// 		userID:number,
// 		chainID:number,
// 		address:string,
// 		from:string,		// 主地址
// 		contract:string,	// 合约地址
// 		coinName:string,	
// 		itemID:string,
// 		value:string,		// 提现数值
// 		feeValue:string,	// 手续费
// 		lastValue:string,	// 到账数量 币
// 		rate:number,		// 汇率
// 		txValue:string,		// 币种数值
// 		chainReqNo:number,	// 公链转账记录
// 		chainReqStatus:ChainReqStatus,
// 		chainReqHash:string,
// 		timestamp:number,
// 		date:string,
// 	}

// 	export type tWithdrawConfig = {
// 		autoEnabled:boolean,		// 自动提现开关
// 		coins:{
// 			autoEnabled:boolean,	// 自动提现开关
// 			coinName:string,
// 			chains:{ 				// 提现主地址，从归集主地址里选择
// 				chainID:number,
// 				addresses:string[],	// 注意这里是数组
// 			}[],	
// 		}[]
// 	}
// 	export const DefaultABI_ERC20:AbiItem[] = [
// 		{
// 			anonymous: false,
// 			inputs: [
// 				{ name: 'from', type: 'address' },
// 				{ name: 'to', type: 'address' },
// 				{ name: 'value', type: 'uint256' }
// 			],
// 			name: 'Transfer',
// 			type: 'event'
// 		},
// 		{
// 			constant: true,
// 			inputs: [{ name: '_owner', type: 'address' }],
// 			name: 'balanceOf',
// 			outputs: [{ name: 'balance', type: 'uint256' }],
// 			payable: false,
// 			stateMutability: 'view',
// 			type: 'function'
// 		},
// 		{
// 			constant: false,
// 			inputs: [
// 				{ name: '_to', type: 'address' },
// 				{ name: '_value', type: 'uint256' }
// 			],
// 			name: 'transfer',
// 			outputs: [{ name: '', type: 'bool' }],
// 			payable: false,
// 			stateMutability: 'nonpayable',
// 			type: 'function'
// 		}
// 	]
// }