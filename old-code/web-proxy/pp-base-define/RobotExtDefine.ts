import { ClubDefine } from "./ClubDefine"
import { RobotDefine } from "./RobotDefine"
import { RoomDefine } from "./RoomDefine"

export namespace RobotExtDefine {
	// 全局控制配置	
	export type tGlobalControl = {
		enabled:boolean,		// 机器人总开关
		groupEnabled:boolean,	// 机器人匹配开关
		groups:{				// 具体匹配开关，如果没配置默认开启
			groupID:number,
			enabled:boolean,
		}[],
		matchEnabled:boolean,	// 机器人比赛开关
	}

	export type tItemNeeded = {
		itemID:string,			// 需求道具ID
		count:string,			// 需求数量
		floating:boolean,		// 是否浮动需求
		floatingCount?:string,	// 浮动数量
	}

	// 机器人计划基础数据
	export type RobotPlanBase = {
		name:string,
		desc:string,
		personality:RobotDefine.Personality,	// 个性，个性数据保存在 tPersonalityGameConfig_Base
		strategy:RobotDefine.RuntimeStrategy,	// 行为策略
		strategyData:RobotDefine.tStrategyData_Base	// 基于strategy生成对应的Data

		targetValue:string,						// 目标数值
		curValue:string,						// 当前数值
	}
	// 比赛计划
	export type tMatchPlan = {
		planID:number,
		enabled:boolean,

		matchID:number,		// 比赛ID

		robotCount:number,			// 计划机器人数量
		runtimeRobotCount:number,	// 运行时机器人数量

		itemNeeded:tItemNeeded,		// 需求道具
		chargeMinCount:string,		// 充值阈值
		storeID:number,				// 充值库存ID
		retryCount:number,			// 重试次数
		retryFloatingCount:string,	// 重试浮动数量

		createTimestamp:number,
		createDate:string,

		startTimestamp:number,		// 计划开始时间
		startDate:string,			// 计划开始日期
	} & RobotPlanBase

	// 匹配计划
	export type tGroupPlan = {
		planID:number,
		enabled:boolean,

		groupID:number,			// 匹配ID

		monopoly:boolean,		// 是否独占
		power:number,			// 执行权重

		robotCount:number,		// 计划机器人数量
		runtimeRobotCount:number,	// 运行时机器人数量

		itemNeeded:tItemNeeded,	// 需求道具
		chargeMinCount:string,	// 充值阈值
		storeID:number,			// 充值库存ID

		timestamp:number,
		date:string,
	} & RobotPlanBase

	// 充值库存
	export type tChargeStore = {
		storeID:number,
		enabled:boolean,
		name:string,
		desc:string,
		gmUserID:number,

		itemID:string,
		count:string,

		timestamp:number,
		date:string,
	}

	// 充值库存变动记录
	export type tChargeStoreRecord = {
		no:number,
		storeID:number,
		gmUserID:number,
		itemID:string,
		count:string,
		reason:string,
		data?:any,

		timestamp:number,
		date:string,
	}

	export type tChargeRecord = {
		no:number,
		storeID:number,
		robotUserID:number,

		groupID?:number,
		matchID?:number,

		itemID:string,
		fromCount:string,		// 充值前数量
		count:string,			// 充值数量
		floatingCount?:string,	// 浮动数量
		lastCount:string,		// 充值后数量

		reason:string,			// 充值原因
		data?:any,				// 充值附加数据

		timestamp:number,
		date:string,
	}
}