// import { baseService } from "kdweb-core/lib/service/base";
// import { ChainDefine } from "../../pp-base-define/ChainDefine";
// import { DBDefine } from "../../pp-base-define/DBDefine";
// import { ChainDataControl } from "../../src/ChainDataControl";
// import { DB } from "../../src/db";
// import { RedisLock } from "../../src/RedisLock";
// import { kdutils } from "kdweb-core/lib/utils";
// import { TimeDate } from "../../src/TimeDate";
// import { IDUtils } from "../../src/IDUtils";
// import _ from "underscore";
// import { UserDefine } from "../../pp-base-define/UserDefine";
// import { Rpc } from "../rpc";
// import { ChainApi } from "../../src/ChainApi";
// import Decimal from "decimal.js";
// import { kds } from "../../pp-base-define/GlobalMethods";
// import { ItemDefine } from "../../pp-base-define/ItemDefine";


// let db = DB.get()
// let redis = DB.getRedis()
// export namespace GMChain {
// 	export async function getChains(userID:number,params:{
		
// 	}) {
// 		let control = new ChainDataControl
// 		return control.getChains()
// 	}

// 	/**
// 	 * 修改或创建一个公链
// 	 */
// 	export async function updateChain(userID:number,params:{
// 		chain:ChainDefine.tChain,
// 	}) {
// 		let control = new ChainDataControl
// 		await control.updateChain(params.chain)
// 		return {}
// 	}


// 	export async function delChain(userID:number,params:{
// 		chainID:number,
// 	}) {
// 		let control = new ChainDataControl
// 		await control.delChain(params.chainID)
// 		return {}
// 	}

// 	export async function getCoins(userID:number,params:{
// 		chainID?:number,
// 		itemID?:string,
// 		name?:string,
// 		symbol?:string,
// 	}) {
// 		let index:any = {}
// 		if(params.chainID) {
// 			index.chainID = params.chainID
// 		}
// 		if(params.itemID) {
// 			index.itemID = params.itemID
// 		}
// 		if(params.name) {
// 			index.name = params.name
// 		}
// 		if(params.symbol) {
// 			index.symbol = params.symbol
// 		}
// 		let coins:ChainDefine.tCoin[] = await db.get("t_cc_coins",index)
// 		return {
// 			coins
// 		}
// 	}
// 	/**
// 	 * 修改或创建一个币
// 	 */
// 	export async function updateCoin(userID:number,params:{
// 		coin:ChainDefine.tCoin,
// 	}) {
// 		let control = new ChainDataControl
// 		await control.updateCoin(params.coin)
// 	}

// 	export async function delCoin(userID:number,params:{
// 		symbol?:string,
// 	}) {
// 		let control = new ChainDataControl
// 		await control.delCoin(params.symbol)
// 		return {}
// 	}

	
// 	/**
// 	 * 公链转账记录
// 	 */
// 	export async function getChainReqs(userID:number,params:{
// 		nos?:number[],
// 		taskID?:number,
// 		status?:ChainDefine.ChainReqStatus,
// 		startTime?:number,
// 		endTime?:number,
// 		page:number,	// 页数 从0开始
// 		limit:number,	// 每页数量
// 	}) {
// 		let index:any = {}
// 		if(params.nos) {
// 			index.no = {$in:[params.nos]}
// 		}
// 		if(params.taskID != null) {
// 			index["data.taskID"] = params.taskID
// 		}
// 		if(params.status != null) {
// 			index.status = params.status
// 		}
// 		if(params.startTime) {
// 			if(params.endTime) {
// 				index.timestamp = {$gte:params.startTime,$lt:params.endTime}
// 			} else {
// 				index.timestamp = {$gte:params.startTime}
// 			}
// 		} else if(params.endTime) {
// 			index.timestamp = {$lt:params.endTime}
// 		}
		
// 		let count = await db.getCount(DBDefine.tableChainRequest,index)
// 		let datas:ChainDefine.tChainReq[] = await db.getOption(DBDefine.tableChainRequest,index,{
// 			sort:{
// 				timestamp:-1,
// 			},
// 			skip:params.page * params.limit,
// 			limit:params.limit,
// 		})
// 		return {
// 			datas,
// 			count,
// 		}
// 	}
// 	/**
// 	 * 重试公链请求
// 	 * 如果chainReq.status == Failed 可以通过此方法重试
// 	 * @param userID 
// 	 * @param params 
// 	 */
// 	export async function retryChainReq(userID:number,params:{
// 		no:number,
// 	}) {
// 		return await RedisLock.callInLock(RedisLock.ChainReq(params.no),10,async ()=>{
// 			let req:ChainDefine.tChainReq = await db.getSingle(DBDefine.tableChainRequest,{no:params.no})
// 			if(!req) {
// 				return baseService.errJson(1,"未找到")
// 			}
// 			if(req.status != ChainDefine.ChainReqStatus.Failed) {
// 				return baseService.errJson(1,"状态不正确")
// 			}
// 			let relates:ChainDefine.tChainReq[] = await db.get(DBDefine.tableChainRequest,{
// 				$or:[
// 					{no:params.no},
// 					{relateNos:params.no},
// 				]
// 			}) || []
// 			if(relates.length > 0 && !_.every(relates,v=>v.status == ChainDefine.ChainReqStatus.Failed)) {
// 				return baseService.errJson(1,"相关请求已处理no = " + relates.find(v=>v.status == ChainDefine.ChainReqStatus.Failed).no)
// 			}
// 			let newNo = await IDUtils.getChainReqNo()
// 			let nos = relates.map(v=>v.no)
// 			nos.push(req.no)
// 			nos.push(newNo)
// 			nos = _.uniq(nos)
// 			await db.updateManyOrigin(DBDefine.tableChainRequest,{
// 				$or:[
// 					{no:params.no},
// 					{relateNos:params.no}
// 				]
// 			},{
// 				$set:{
// 					relateNos:nos
// 				}
// 			})
// 			req.no = newNo
// 			req.hash = null 
// 			req.status = ChainDefine.ChainReqStatus.Wait
// 			req.timestamp = kdutils.getMillionSecond()
// 			req.date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
// 			req.endTimestamp = null 
// 			req.endDate = null 
// 			req.relateNos = nos
// 			await db.insert(DBDefine.tableChainRequest,req)
// 			return {}
// 		})
// 	}

// 	/**
// 	 * 设置归集主地址
// 	 * @param userID 
// 	 * @param params 
// 	 */
// 	export async function collect_addMainAddress(userID:number,params:{
// 		chainID:number,	// 公链ID
// 		comment:string,	// 注释
// 	}) {
// 		await new ChainDataControl().addMainAddress(params.chainID,params.comment)
// 		return {}
// 	}

// 	export async function collect_delMainAddress(userID:number,params:{
// 		address:string,
// 	}) {
// 		await new ChainDataControl().delMainAddress(params.address)
// 		return {}
// 	}

// 	export async function collect_getMainAddresses(userID:number,params:{
// 		chainID?:number
// 	}) {
// 		return {
// 			datas:await new ChainDataControl().getMainAddresses(params.chainID)
// 		}
// 	}

// 	export async function collect_getTasks(userID:number,params:{
// 		page:number,
// 		limit:number,
// 	}) {
// 		let index:any = {}

// 		let count = await db.getCount(DBDefine.tableCollectTask,index)
// 		let datas = await db.getOption(DBDefine.tableCollectTask,index,{
// 			skip:params.page * params.limit,
// 			limit:params.limit,
// 			sort:{
// 				startTimestamp:-1
// 			},
// 			projection:{
// 				status:0
// 			}
// 		}) || []
// 		return {
// 			datas,count
// 		}
// 	}

// 	/**
// 	 * 试算归集任务
// 	 */
// 	export async function collect_calcTask(userID:number,params:{
// 		chainID:number,
// 		mainAddress:string,		
// 		coinName:string,
// 		minValue?:string,
// 		maxValue?:string,
// 	}) {
// 		let control = new ChainDataControl()
// 		let coin = await control.getChainCoinbyName(params.chainID,params.coinName)
// 		if(!coin) {
// 			return baseService.errJson(1,"未找到coin")
// 		}
// 		let calcID = String(kdutils.getMillionSecond())
// 		let func = async ()=>{
// 			let result:any = await Rpc.task.calcCollection(params.chainID,params.coinName,params.minValue,params.maxValue) || {}
// 			result.calcID = calcID	
// 			db.insert("t_collect_calc",result)
// 		}
// 		func()
// 		return {
// 			calcID
// 		}
// 	}

	
// 	export async function collect_getCalcResult(userID:number,params:{
// 		calcID:string
// 	}) {
// 		let result:{
// 			addressInfos:{address:string,value:string},
// 			totalValue:string,
// 			totalFee:string,
// 		} = await db.getSingle("t_collect_calc",{calcID:params.calcID})
// 		return {
// 			result
// 		}
// 	}

// 	/**
// 	 * 创建归集任务
// 	 */
// 	export async function collect_createTask(userID:number,params:{
// 		chainID:number,
// 		mainAddress:string,		
// 		coinName:string,
// 		minValue?:string,
// 		maxValue?:string,
// 	}) {
// 		let task = await Rpc.task.createCollectionTask(params.chainID,params.coinName,params.mainAddress,params.minValue,params.maxValue)
// 		return task ? {task} : baseService.errJson(1,"创建失败")
// 	}

// 	export async function getUserChargeAddress(userID:number,params:{
// 		userID?:number,
// 		page:number,
// 		limit:number,
// 	}) {
// 		let index:any = {}
// 		if(params.userID != null) {
// 			index.userID = {$in:params.userID}
// 		}
// 		let count = await db.getCount(DBDefine.tableUserChainCharge,index)
// 		let datas = await db.getOption(DBDefine.tableUserChainCharge,index,{
// 			skip:params.page * params.limit,
// 			limit:params.limit
// 		})
// 		return {
// 			datas,count
// 		}
// 	}

// 	/**
// 	 * 获取地址本
// 	 */
// 	export async function getAddressBook(userID:number,params:{
// 		chainID?:number
// 	}) {
// 		let index:any = {}
// 		if(params.chainID != null) {
// 			index.chainID = params.chainID
// 		}
// 		return {
// 			datas:<ChainDefine.tAddressBook[]>await db.get(DBDefine.tableAddressBook,index)
// 		}
// 	}

// 	/**
// 	 * 添加/修改记录
// 	 */
// 	export async function setAddressBook(userID:number,params:{
// 		data:ChainDefine.tAddressBook
// 	}) {
// 		params.data.address = params.data.address.trim()
// 		params.data.timestamp = kdutils.getMillionSecond()
// 		params.data.date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
// 		await db.updateOrInsert(DBDefine.tableAddressBook,params.data,{address:params.data.address,chainID:params.data.chainID})
// 		return {}
// 	}

// 	/**
// 	 * 删除记录
// 	 */
// 	export async function delAddressBook(userID:number,params:{
// 		chainID:number,
// 		address:string,
// 	}) {
// 		params.address = params.address.trim()
// 		await db.del(DBDefine.tableAddressBook,{address:params.address,chainID:params.chainID})
// 		return {}
// 	}

// 	/**
// 	 * 创建公链转账
// 	 * fromAddress 可以从getUserChargeAddress里选取，也可以从getMainAddresses里选取
// 	 * toAddress 必须从addressBook中选取，按chainID检索
// 	 */
// 	export async function createChainReq(userID:number,params:{
// 		chainID:number,
// 		fromAddress:string,
// 		toAddress:string,
// 		coinName:string,
// 		value:string,
// 	}) {
// 		params.fromAddress = params.fromAddress.trim()
// 		params.toAddress = params.toAddress.trim()
// 		let control = new ChainDataControl()
// 		let key = await control.getCustomAddressKey(params.chainID,params.fromAddress)
// 		if(!key) {
// 			return baseService.errJson(1,"from没有私钥")
// 		}
// 		let coin = await control.getChainCoinbyName(params.chainID,params.coinName)
// 		if(!coin) {
// 			return baseService.errJson(1,"未找到coin")
// 		}
// 		let coinChain = coin.chains.find(v=>v.chainID == params.chainID)
// 		let req:ChainDefine.tChainReq = {
// 			no:await IDUtils.getChainReqNo(),			// 流水号
// 			chainID:params.chainID,		// 公链ID
// 			from:params.fromAddress,		// from
// 			to:params.toAddress,			// to 
// 			value:params.value,		// 数量
// 			acc:coinChain.acc,			// 精度
// 			contract:coinChain.contract,	// 合约
			
// 			hash:null,		// Hash
// 			status:ChainDefine.ChainReqStatus.Wait,	// 状态
	
// 			tag:"FromGM",			// 注释
// 			data:{gmID:userID},
// 			relateNos:null,// 相关
// 			timestamp:kdutils.getMillionSecond(),	// 开始时间
// 			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
// 			endTimestamp:null,// 结束时间
// 			endDate:null,
// 		}
// 		await db.insert(DBDefine.tableChainRequest,req)
// 		return {
// 			req
// 		}
// 	}

// 	async function _getBalanceCacheOnly(chainID:number,address:string,acc:number,contract?:string) {
// 		let key = "CHAIN:" + chainID + "|" + contract + "|" + address
// 		let info = await redis.hget("t_gm_get_balance_cache",key)
// 		if(info && kdutils.getMillionSecond() - info.timestamp < 10000) {
// 			return info.value
// 		}
// 		return "0"
// 	}
	
// 	async function _getBalance(chainID:number,address:string,acc:number,contract?:string) {
// 		let key = "CHAIN:" + chainID + "|" + contract + "|" + address
// 		let info = await redis.hget("t_gm_get_balance_cache",key,true)
// 		if(info && kdutils.getMillionSecond() - info.timestamp < 30000) {
// 			return info.value
// 		}
// 		let value = new Decimal(await ChainApi.getAddressBalanceByContract(address,chainID,acc,contract) || 0)
// 		await redis.hset("t_gm_get_balance_cache",key,{
// 			value:value.toString(),
// 			timestamp:kdutils.getMillionSecond()
// 		},true)
// 		return value.toString()
// 	}

// 	async function _getBalances(chainID:number,addresses:string[],acc:number,contract?:string,cacheOnly?:boolean) {
// 		let values:{
// 			address:string,
// 			value:string
// 		}[] = []
// 		for(let address of addresses) {
// 			values.push({
// 				address,
// 				value:cacheOnly ? await _getBalanceCacheOnly(chainID,address,acc,contract) : await _getBalance(chainID,address,acc,contract)
// 			})
// 		}
// 		return values
// 	}

// 	/**
// 	 * 查询余额
// 	 */
// 	export async function getBalance(userID:number,params:{
// 		chainID:number,
// 		coinName:string,
// 		addresses:string[],
// 		cacheOnly?:boolean,	// 是否只使用缓存
// 	}) {
// 		let control = new ChainDataControl
// 		let coin = await control.getChainCoinbyName(params.chainID,params.coinName)
// 		if(!coin) {
// 			return baseService.errJson(1,"coin不存在")
// 		}
// 		let coinChain = coin.chains.find(v=>v.chainID == params.chainID)
// 		let values:{
// 			address:string,
// 			value:string
// 		}[] = await _getBalances(params.chainID,params.addresses,coinChain.acc,coinChain.contract,params.cacheOnly)
// 		return {
// 			values
// 		}
// 	}

// 	/**
// 	 * 获取提现审核配置
// 	 */
// 	export async function getWithdrawConfig(userID:number,params:{

// 	}) {
// 		return {
// 			config:<ChainDefine.tWithdrawConfig>await redis.get(DBDefine.rTableWithdrawConfig,true)
// 		}
// 	}

// 	/**
// 	 * 设置提现审核配置
// 	 */
// 	export async function setWithdrawConfig(userID:number,params:{
// 		config:ChainDefine.tWithdrawConfig
// 	}) {
// 		await redis.set(DBDefine.rTableWithdrawConfig,params.config,true)
// 	}

// 	/**
// 	 * 获取提现请求
// 	 */
// 	export async function getWithdrawReqs(userID:number,params:{
// 		userID?:number,
// 		chainID?:number,
// 		itemID?:string,
// 		oper?:boolean,
// 		confirm?:boolean,

// 		startTime?:number,
// 		endTime?:number,

// 		page:number,limit:number,
// 	}) {
// 		let index:any = {}
// 		if(params.userID) {
// 			index.userID = params.userID
// 		}
// 		if(params.chainID != null) {
// 			index.chainID = params.chainID
// 		}
// 		if(params.itemID) {
// 			index.itemID = params.itemID
// 		}
// 		if(params.oper != null) {
// 			index = !!params.oper
// 		}
// 		if(params.confirm != null) {
// 			index = !!params.confirm
// 		}
		
// 		if(params.startTime) {
// 			if(params.endTime) {
// 				index.reqTimestamp = {$gte:params.startTime,$lt:params.endTime}
// 			} else {
// 				index.reqTimestamp = {$gte:params.startTime}
// 			}
// 		} else if(params.endTime) {
// 			index.reqTimestamp = {$lt:params.endTime}
// 		}
// 		let count = await db.getCount(DBDefine.tableWithdrawReq,index)
// 		let datas:ChainDefine.tWithdrawReq[] = await db.getOption(DBDefine.tableWithdrawReq,index,{
// 			skip:params.page * params.limit,
// 			limit:params.limit,
// 			sort:{
// 				reqTimestamp:-1
// 			}
// 		}) || []
// 		return {
// 			datas,count
// 		}
// 	}

// 	/**
// 	 * 审批提现请求
// 	 */
// 	export async function confirmWithdrawReq(userID:number,params:{
// 		no:number,
// 		confirm:boolean,
// 	}) {
// 		return await RedisLock.callInLock(RedisLock.WithdrawReq(params.no),10,async ()=>{
// 			let req:ChainDefine.tWithdrawReq = await db.getSingle(DBDefine.tableWithdrawReq,{no:params.no})
// 			if(!req || req.oper) {
// 				return baseService.errJson(1,"无法操作")
// 			}
// 			if(!params.confirm) {
// 				await db.updateOrigin(DBDefine.tableWithdrawReq,{
// 					no:params.no
// 				},{
// 					$set:{
// 						oper:true,confirm:false,
// 						operTimestamp:kdutils.getMillionSecond(),
// 						operDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
// 					}
// 				})
// 				await Rpc.center.call(kds.item.add,req.userID,req.itemID,req.value,ItemDefine.SerialType.ChainWithdrawFailed)
// 				return {}
// 			}
// 			let config:ChainDefine.tWithdrawConfig = await redis.get(DBDefine.rTableWithdrawConfig,true)
// 			let coinConfig = config ? config.coins.find(v=>v.coinName == req.coinName) : null
// 			if(!coinConfig) {
// 				return baseService.errJson(1,"没有建立配置")
// 			}
// 			let chainConfig = coinConfig.chains.find(v=>v.chainID == req.chainID)
// 			if(!chainConfig) {
// 				return baseService.errJson(1,"没有公链配置")
// 			}
// 			if(chainConfig.addresses.length == 0) {
// 				return baseService.errJson(1,"没有主地址配置")
// 			}
// 			let address = chainConfig.addresses[kdutils.intRandom(0,chainConfig.addresses.length)]
// 			let control = new ChainDataControl
// 			let coin = await control.getItemCoin(req.itemID)
// 			if(!coin) {
// 				return baseService.errJson(1,"没有币种配置")
// 			}
// 			let coinChain = coin.chains.find(v=>v.chainID == req.chainID)
// 			if(!coinChain) {
// 				return baseService.errJson(1,"币种没有公链配置")
// 			}
// 			let chainReq:ChainDefine.tChainReq = {
// 				no:await IDUtils.getChainReqNo(),			// 流水号
// 				chainID:req.chainID,		// 公链ID
// 				from:address,		// from
// 				to:req.address,			// to 
// 				value:req.lastValue,		// 数量
// 				acc:req.acc,			// 精度
// 				contract:coinChain.contract,	// 合约
				
// 				hash:null,		// Hash
// 				status:ChainDefine.ChainReqStatus.Wait,	// 状态
		
// 				tag:"WithdrawConfirm",			// 注释
// 				data:{gmID:userID,withdrawNo:req.no},
// 				relateNos:null,// 相关
// 				timestamp:kdutils.getMillionSecond(),	// 开始时间
// 				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
// 				endTimestamp:null,// 结束时间
// 				endDate:null,
// 			}
// 			await Promise.all([
// 				db.updateOrigin(DBDefine.tableWithdrawReq,{
// 					no:params.no
// 				},{
// 					$set:{
// 						oper:true,confirm:true,
// 						operTimestamp:kdutils.getMillionSecond(),
// 						operDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
// 					}
// 				}),
// 				db.insert(DBDefine.tableChainRequest,chainReq),
// 				db.insert(DBDefine.tableChainWithdrawRecord,<ChainDefine.tWithdrawRecord>{
// 					no:req.no,
// 					reqNo:req.no,		// 请求no
// 					userID:req.userID,
// 					chainID:req.chainID,
// 					address:req.address,
// 					from:chainReq.from,
// 					contract:chainReq.contract,
// 					coinName:req.coinName,
// 					itemID:req.itemID,
// 					value:req.value,		// 提现数值
// 					feeValue:req.feeValue,	// 手续费
// 					lastValue:req.lastValue,
// 					rate:req.rate,		// 汇率
// 					txValue:req.txValue,		// 币种数值
// 					chainReqNo:chainReq.no,	// 公链转账记录
// 					chainReqStatus:chainReq.status,
// 					chainReqHash:null,
// 					timestamp:kdutils.getMillionSecond(),
// 					date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
// 				})
// 			])
// 			return {}
// 		})
// 	}

// 	/**
// 	 * 获取提现记录
// 	 * chainReqNo 可以点击跳转到公链转账记录
// 	 */
// 	export async function getWithdrawRecords(userID:number,params:{
// 		userID?:number,
// 		chainID?:number,
// 		itemID?:string,

// 		startTime?:number,
// 		endTime?:number,

// 		page:number,limit:number,
// 	}) {
// 		let index:any = {}
// 		if(params.userID) {
// 			index.userID = params.userID
// 		}
// 		if(params.chainID != null) {
// 			index.chainID = params.chainID
// 		}
// 		if(params.itemID) {
// 			index.itemID = params.itemID
// 		}
		
// 		if(params.startTime) {
// 			if(params.endTime) {
// 				index.timestamp = {$gte:params.startTime,$lt:params.endTime}
// 			} else {
// 				index.timestamp = {$gte:params.startTime}
// 			}
// 		} else if(params.startTime) {
// 			index.timestamp = {$lt:params.endTime}
// 		}
// 		let count = await db.getCount(DBDefine.tableChainWithdrawRecord,index)
// 		let datas:ChainDefine.tWithdrawRecord[] = await db.getOption(DBDefine.tableChainWithdrawRecord,index,{
// 			skip:params.page * params.limit,
// 			limit:params.limit,
// 			sort:{
// 				reqTimestamp:-1
// 			}
// 		}) || []
// 		return {
// 			datas,count
// 		}
// 	}
// }