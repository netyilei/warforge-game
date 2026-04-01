
export namespace ChargeDefine {
	export type tChainInfo = {
		chainID:number,
		name:string,
		displayName:string,
		iconUrl:string,
		rpcURL:string,			// RPC URL
	}

	export type tBankInfo = {
		bankID:number,
		name:string,
		displayName:string,
		iconUrl:string,
	}

	export type tBankBranchInfo = {
		branchID:number,
		bankID:number,
		name:string,
		displayName:string,
	}

	export type tPaypayInfo = {
		paypalID:number,
		name:string,
		displayName:string,
		iconUrl:string,
	}
	// 区块链充值
	export type tChargeBlockchainConfig = {
		typeID:number,
		enabled:boolean,
		chainID:number,
		name:string,
		displayName:string,
		rate:number,			// 兑换比例，1单位链币可兑换多少平台币
		itemID:string,			// 道具ID
		contractAddress:string,	// 代币合约地址，若为原生链币则为空
		symbol:string,			// 代币符号
		decimals:number,		// 保留小数点位数

		minAmount?:number,		// 最小充值金额
		maxAmount?:number,		// 最大充值金额
		feePercent?:number,		// 手续费百分比
		feeFixedAmount?:number,
	}

	// 银行充值
	export type tChargeBankConfig = {
		typeID:number,
		enabled:boolean,
		bankID:number,
		branchID:number,
		unit:string, 			// "CYN"|"USD",
		rate:number,			// 兑换比例，1单位法币可兑换多少平台币
		itemID:string,

		accountName:string,		// 账户名
		accountNumber:string, 	// 账号

		minAmount?:number,		// 最小充值金额
		maxAmount?:number,		// 最大充值金额
		feePercent?:number,		// 手续费百分比
		feeFixedAmount?:number,
	}

	// 定义paypal支付参数
	export type tChargePaypalConfig = {
		typeID:number,
		enabled:boolean,
		paypalID:number,					// PayPal配置ID
		unit:string,						// "USD"|"EUR"|"GBP"|"CNY", 货币单位
		rate:number,						// 兑换比例，1单位法币可兑换多少平台币
		itemID:string,						// 对应的道具ID
		paypalAccountInfo:{
			email:string,					// PayPal收款账户邮箱
			merchantID?:string,				// PayPal商户ID
			clientID?:string,				// PayPal客户端ID（用于API）
			clientSecret?:string,			// PayPal客户端密钥（用于API）
			mode:"sandbox"|"live",			// 运行模式：沙盒或生产环境
			webhookID?:string,				// Webhook ID用于接收支付通知
		},
		minAmount?:number,					// 最小充值金额
		maxAmount?:number,					// 最大充值金额
		feePercent?:number,					// 手续费百分比
		feeFixedAmount?:number,
	}

	export type tChargeAppleCardConfig = {
		typeID:number,
        name: string,
        displayName: string,
		enabled:boolean,
		unit:string,						// "USD"|"EUR"|"GBP"|"CNY", 货币单位
		rate:number,						// 兑换比例，1单位法币可兑换多少平台币
		itemID:string,						// 对应的道具ID
		
        minAmount?: number,
        maxAmount?: number,
        feePercent?: number,
        feeFixedAmount?: number,
	}

	export enum PayType {
		Blockchain,
		Bank,
		Paypal,
		AppleCard,
	}

	export enum ChargeStatus {
		Wait,
		Success,
		Fail,
		Cancel,
		Process,
		Refunded,
	}
	
	export type tChargeOrder = {
		orderID:number,				// 
		strOrderID:string,
		userID:number,
		payType:PayType,			// 充值方式
		typeID:number,				// 充值方式类型ID
		currencyUnit?:string,		// 充值货币单位
		amount?:string,				// 充值金额
		hash?:string,				// 区块链交易哈希
		paypalID?:string,
		itemID:string,				// 道具ID
		itemCount:string,			// 道具数量

		imgUrls?:string[],			// 充值凭证图片URL列表

		status:ChargeStatus,		// 充值状态

		gmUserID:number,			// 充值审核管理员ID
		reason?:string,				// 充值失败或拒绝原因
		confirmAmount?:string,		// 实际到账数量
		confirmItemCount?:string,	// 实际到账道具数量
		rate?:number,				// 充值时的兑换比例，供统计使用

		timestamp:number,
		date:string,

		data?:any,

		confirmTimestamp:number,
		confirmDate:string,
	}

	export type tChargeUpload = {
		orderID:number,
		fullPath:string,

		timestamp:number,
		date:string,
	}

	export type tUploadCache = {
		userID:number,
		fullPath:string,
		tag:string,
		timestamp:number,
		date:string,
	}

	export type tWithdrawBlockchainConfig = {
		typeID:number,
		enabled:boolean,
		chainID:number,
		
		name:string,
		displayName:string,

		rate:number,			// 兑换比例，1单位平台币可兑换多少链币
		itemID:string,			// 提现使用的道具ID
		contractAddress:string,	// 代币合约地址，若为原生链币则为空
		symbol:string,			// 代币符号
		decimals:number,		// 小数点位数

		minAmount:string,		// 最小提现金额
		maxAmount:string,		// 最大提现金额
		fixedFee:boolean,		// 是否固定手续费
		feeAmount:string, 		// 固定手续费金额，当fixedFee=true时有效
		feePercent:number,		// 手续费百分比，当fixedFee=false时有效
	}

	export type tWithdrawBankConfig = {
		typeID:number,
		enabled:boolean,
		bankID:number,
		branchID:number,

		unit:string, 			// "CYN"|"USD",
		rate:number,			// 兑换比例，1单位平台币可兑换多少链币
		itemID:string,			// 提现使用的道具ID

		minAmount:string,		// 最小提现金额
		maxAmount:string,		// 最大提现金额
		fixedFee:boolean,		// 是否固定手续费
		feeAmount:string, 		// 固定手续费金额，当fixedFee=true时有效
		feePercent:number,		// 手续费百分比，当fixedFee=false时有效
	}

	export type tWithdrawPaypalConfig = {
		typeID:number,
		enabled:boolean,
		paypalID:number,
		
		unit:string, 			// "CYN"|"USD",
		rate:number,			// 兑换比例，1单位平台币可兑换多少链币
		itemID:string,			// 提现使用的道具ID

		minAmount:string,		// 最小提现金额
		maxAmount:string,		// 最大提现金额
		fixedFee:boolean,		// 是否固定手续费
		feeAmount:string, 		// 固定手续费金额，当fixedFee=true时有效
		feePercent:number,		// 手续费百分比，当fixedFee=false时有效
	}

	// 历史记录 - 用户区块链地址
	export type tRecordUserBlockchain = {
		no:number,
		userID:number,
		chainID:number,
		address:string,
	}
	// 历史记录 - 用户银行信息
	export type tRecordUserBankInfo = {
		no:number,
		userID:number,
		bankID:number,
		branchID:number,
		accountName:string,			// 账户名
		accountNumber:string, 		// 账号
	}
	// 历史记录 - 用户PayPal信息
	export type tRecordUserPaypalInfo = {
		no:number,
		userID:number,
		paypalID:number,
		email:string,				// PayPal收款账户邮箱
	}

	// 第三方钱包用户充值区块链地址
	export type tWalletUserAddress = {
		userID:number,
		chainID:number,
		address:string,

		coinID?:string,
		contractAddress?:string,
		callbackUrl?:string,
	}

	export enum WithdrawStatus {
		Wait,
		Processing,
		Success,
		Fail,
		Refuse,
	}

	export type tWithdrawOrder = {
		orderID:number,
		strOrderID:string,
		userID:number,
		payType:PayType,				// 提现方式
		typeID:number,					// 提现方式类型ID
		currencyUnit?:string,			// 到账单位
		originAmount?:string,			// 原始提现金额
		amount?:string,					// 到账数量
		feeAmount?:string,				// 手续费金额
		itemID:string,					// 道具ID
		itemCount:string,				// 提现道具数量

		blockchain?:{
			chainID:number,
			address:string,
			hash?:string,				// 区块链交易哈希
		},

		bank?:{
			bankID:number,
			branchID:number,
			accountName:string,			// 账户名
			accountNumber:string, 		// 账号
		},
		paypal?:{
			email:string,				// PayPal收款账户邮箱
		}

		status:WithdrawStatus,

		gmUserID:number,
		reason?:string,					// 拒绝原因

		timestamp:number,
		date:string,

		confirmTimestamp:number,
		confirmDate:string,
	}

	export type tUserWithdrawReq = {
		typeID:number,
		itemID:string,
		itemCount:string,
		blockchain?:{
			chainID:number,
			address:string,
			hash?:string,				// 区块链交易哈希
		},

		bank?:{
			bankID:number,
			branchID:number,
			accountName:string,			// 账户名
			accountNumber:string, 		// 账号
		},
		paypal?:{
			paypaylID:number,
			email:string,				// PayPal收款账户邮箱
		}
	}

	export type tWithdrawChainMainAddress = {
		no:number,
		chainID:number,
		address:string,
		comment:string,			// 备注
		enabled:boolean,
		pri:number,				// 优先级，数值越大优先级越高
	}

	
	export const DefaultABI_ERC20 = [
		{
			anonymous: false,
			inputs: [
				{ name: 'from', type: 'address' },
				{ name: 'to', type: 'address' },
				{ name: 'value', type: 'uint256' }
			],
			name: 'Transfer',
			type: 'event'
		},
		{
			constant: true,
			inputs: [{ name: '_owner', type: 'address' }],
			name: 'balanceOf',
			outputs: [{ name: 'balance', type: 'uint256' }],
			payable: false,
			stateMutability: 'view',
			type: 'function'
		},
		{
			constant: false,
			inputs: [
				{ name: '_to', type: 'address' },
				{ name: '_value', type: 'uint256' }
			],
			name: 'transfer',
			outputs: [{ name: '', type: 'bool' }],
			payable: false,
			stateMutability: 'nonpayable',
			type: 'function'
		}
	]
}