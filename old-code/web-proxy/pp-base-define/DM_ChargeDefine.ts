import { kdmodule } from "kdweb-core/lib/mongo/model";
import { ChargeDefine } from "./ChargeDefine";
import { DB } from "../src/db";

export const Module_ChargeChainInfo = new kdmodule.database<ChargeDefine.tChainInfo>({
	db:DB.get(),mainIndexName:"chainID",useMongoIDForIndex:true,indexes:{chainID:1},autoCreateIndexes:false,
	tableName:"t_charge_chain_info",
	kvChangeTableName:"t_charge_chain_info_changed"
})

export const Module_ChargeBankInfo = new kdmodule.database<ChargeDefine.tBankInfo>({
	db:DB.get(),mainIndexName:"bankID",useMongoIDForIndex:true,indexes:{bankID:1},autoCreateIndexes:false,
	tableName:"t_charge_bank_info",
	kvChangeTableName:"t_charge_bank_info_changed"
})

export const Module_ChargeBankBranchInfo = new kdmodule.database<ChargeDefine.tBankBranchInfo>({
	db:DB.get(),mainIndexName:"branchID",useMongoIDForIndex:true,indexes:{branchID:1},autoCreateIndexes:false,
	tableName:"t_charge_bank_branch_info",
	kvChangeTableName:"t_charge_bank_branch_info_changed"
})

export const Module_ChargePaypalInfo = new kdmodule.database<ChargeDefine.tPaypayInfo>({
	db:DB.get(),mainIndexName:"paypalID",useMongoIDForIndex:true,indexes:{paypalID:1},autoCreateIndexes:false,
	tableName:"t_charge_paypal_info",
	kvChangeTableName:"t_charge_paypal_info_changed"
})

export const Module_ChargeConfigBlockchain = new kdmodule.database<ChargeDefine.tChargeBlockchainConfig>({
	db:DB.get(),mainIndexName:"typeID",useMongoIDForIndex:true,indexes:{typeID:1},autoCreateIndexes:false,
	tableName:"t_charge_config_blockchain",
	kvChangeTableName:"t_charge_config_blockchain_changed"
})

export const Module_ChargeConfigBank = new kdmodule.database<ChargeDefine.tChargeBankConfig>({
	db:DB.get(),mainIndexName:"typeID",useMongoIDForIndex:true,indexes:{typeID:1},autoCreateIndexes:false,
	tableName:"t_charge_config_bank",
	kvChangeTableName:"t_charge_config_bank_changed"
})

export const Module_ChargeConfigPaypal = new kdmodule.database<ChargeDefine.tChargePaypalConfig>({
	db:DB.get(),mainIndexName:"typeID",useMongoIDForIndex:true,indexes:{typeID:1},autoCreateIndexes:false,
	tableName:"t_charge_config_paypal",
	kvChangeTableName:"t_charge_config_paypal_changed"
})

export const Module_ChargeWalletUserAddress = new kdmodule.database<ChargeDefine.tWalletUserAddress>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:false,indexes:{userID:1},autoCreateIndexes:false,
	fullIndexes:[
		{
			name:"idx_user_chain",
			field:{userID:1,chainID:1},
		}
	],
	tableName:"t_charge_wallet_user_address",
	kvChangeTableName:"t_charge_wallet_user_address_changed"
})

export const Module_ChargeRecordUserBlockchain = new kdmodule.database<ChargeDefine.tRecordUserBlockchain>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_charge_record_user_blockchain",
	kvChangeTableName:"t_charge_record_user_blockchain_changed"
})
export const Module_ChargeRecordUserBankInfo = new kdmodule.database<ChargeDefine.tRecordUserBankInfo>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_charge_record_user_bank_info",
	kvChangeTableName:"t_charge_record_user_bank_info_changed"
})
export const Module_ChargeRecordUserPaypalInfo = new kdmodule.database<ChargeDefine.tRecordUserPaypalInfo>({
	db:DB.get(),mainIndexName:"no",useMongoIDForIndex:true,indexes:{no:1},autoCreateIndexes:false,
	tableName:"t_charge_record_user_paypal_info",
	kvChangeTableName:"t_charge_record_user_paypal_info_changed"
})

export const Module_ChargeOrder = new kdmodule.database<ChargeDefine.tChargeOrder>({
	db:DB.get(),mainIndexName:"orderID",useMongoIDForIndex:true,indexes:{orderID:1},autoCreateIndexes:false,
	tableName:"t_charge_order",
	kvChangeTableName:"t_charge_order_changed"
})
export const Module_ChargeUpload = new kdmodule.database<ChargeDefine.tChargeUpload>({
	db:DB.get(),mainIndexName:"orderID",useMongoIDForIndex:true,indexes:{orderID:1},autoCreateIndexes:false,
	tableName:"t_charge_upload",
	kvChangeTableName:"t_charge_upload_changed"
})

export const Module_ChargeUploadCache = new kdmodule.database<ChargeDefine.tUploadCache>({
	db:DB.get(),mainIndexName:"userID",useMongoIDForIndex:true,indexes:{userID:1},autoCreateIndexes:false,
	tableName:"t_charge_upload_cache",
	kvChangeTableName:"t_charge_upload_cache_changed"
})

export const Module_WithdrawConfigBlockchain = new kdmodule.database<ChargeDefine.tWithdrawBlockchainConfig>({
	db:DB.get(),mainIndexName:"typeID",useMongoIDForIndex:true,indexes:{typeID:1},autoCreateIndexes:false,
	tableName:"t_withdraw_config_blockchain",
	kvChangeTableName:"t_withdraw_config_blockchain_changed"
})
export const Module_WithdrawConfigBank = new kdmodule.database<ChargeDefine.tWithdrawBankConfig>({
	db:DB.get(),mainIndexName:"typeID",useMongoIDForIndex:true,indexes:{typeID:1},autoCreateIndexes:false,
	tableName:"t_withdraw_config_bank",
	kvChangeTableName:"t_withdraw_config_bank_changed"
})
export const Module_WithdrawConfigPaypal = new kdmodule.database<ChargeDefine.tWithdrawPaypalConfig>({
	db:DB.get(),mainIndexName:"typeID",useMongoIDForIndex:true,indexes:{typeID:1},autoCreateIndexes:false,
	tableName:"t_withdraw_config_paypal",
	kvChangeTableName:"t_withdraw_config_paypal_changed"
})
export const Module_WithdrawOrder = new kdmodule.database<ChargeDefine.tWithdrawOrder>({
	db:DB.get(),mainIndexName:"orderID",useMongoIDForIndex:true,indexes:{orderID:1},autoCreateIndexes:false,
	tableName:"t_withdraw_order",
	kvChangeTableName:"t_withdraw_order_changed"
})