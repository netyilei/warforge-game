import { ClubDefine } from "./ClubDefine"
import { RoomDefine } from "./RoomDefine"

export namespace RobotDefine {
	export enum Status {
		Ready,		// 待命
		Loading,	// 加载中
		Using,		// 使用中
		Rest,		// 等待超时

		MatchSignup,
		MatchPlaying,
		MatchWaiting,
		MatchOut,
	}
	export type tRuntime = {
		robotUserID:number,
		status:Status,				// 执行状态
		
		roomID?:number,				// 房间号
		strategy?:RuntimeStrategy,
		strategyData?:tStrategyData_Base,
		personality?:tPersonalityGameConfig_Base,
		
		strategyPlanID?:number,
		strategyTaskID?:number,		// 任务ID

		logicName?:string,			// 服务器名字
		workerIdx?:number,			// 进程序列
		
		storeID?:number,			// 执行的库存ID
		groupPlanID?:number,
		matchPlanID?:number,
		groupID?:number,
		matchID?:number,

		targetGroupID?:number,		// 目标匹配ID
		targetMatchID?:number,		// 目标比赛ID
		
		startTimestamp:number,		// 启动时间
		startDate:string,
		// 休息到什么时间
		restTimestamp:number,		// 休息截止时间
		restDate:string,
	}

	// 总体策略
	export enum RuntimeStrategy {
		Normal,			// 没有特定策略
		Kill,			// 杀分
		Bonus,			// 送分
		Target,			// 针对目标
	}

	// 策略实时数据基础
	export type tStrategyData_Base = {
		juLimitCount?:number,	// 总局数控制
		curJuCount?:number,		// 当前局数

		roomLimitCount?:number,	// 总房间数控制
		curRoomCount?:number,	// 当前房间数

		lessThanPlayerSitdown?:number,		// 玩家少于多少坐下  0直接坐下
		greateThanPlayerStandup?:number,	// 玩家大于多少站起  
	}

	export type tStrategyData_Kill = tStrategyData_Base & {
		limitValue?:string,		// 目标分数
		curValue?:string,		// 当前完成目标
	}

	export type tStrategyData_Bonus = tStrategyData_Base & {
		limitValue?:string,		// 目标分数
		curValue?:string,		// 当前完成目标
	}
	export type tStrategyData_Target = tStrategyData_Base & {
		targetUserIDs?:number[],
		limitValue?:string,		// 目标分数
		curValues:{
			userID:number,
			value:string,
		}[],					// 当前完成目标
	}

	// 机器人性格
	export enum Personality {
		Level0,	// 一般性格
		Level1,	// 中等性格
		Level2,	// 激进性格
		Level3,	// 非常暴躁
	}

	export type tPersonalityGameConfig_Base = {
		gameID:number,
		personality:Personality,
		desc:string,
	}

	export type tPersonalityActionConfig_Base = {
		percent?:number,	    	// 几率
		scales?:number[],		// 尺度
		maxToForcePercent?:number,	// 最大胜率强制执行概率
	}
	// 针对各种动作的数值，以下只给出参考
	// 需要根据机器人逻辑调整定义
	export type tPersonalityGameConfig_Texas = tPersonalityGameConfig_Base & {
		checkPercent:number,	// 过牌几率 基本都是大概率
		

		bluff:{
			betPercent:number,		// 下注几率
			betScales:number[],		// 下注尺度
			raisePercent:number,	// 诈牌加注几率
			raiseScales:number[],	// 尺度
			allinPercent:number,	// 诈牌allin几率
		}
		//下注
		bet:tPersonalityActionConfig_Base,
		//加注
		raise:tPersonalityActionConfig_Base,
		
		call:tPersonalityActionConfig_Base,

		allin:tPersonalityActionConfig_Base

		isCheckOpponent:boolean,	// 是否检查对手 会影响设置的概率

		// betPercent:number,		// 下注几率
		// betScales:number[],		// 下注尺度
		// raisePercent:number,	// 加注几率
		// raiseScales:number[],	// 尺度

		// callPercent:number,		// call几率
		// callScales:number[],	// 尺度
		//allinScales:number[],	// 尺度

		// bluffPercent:number,	// 诈牌几率
		// bluffScales:number[],	// 尺度
	}

	export function getRedisKeyName_Personality(gameID:number,personality:Personality) {
		return gameID + ":" + Personality[personality]
	}

	export type tEnvConfig = {
		enabled:boolean,				// 总开关

		defaultClub:tEnvConfig_Club,	// 默认俱乐部设置
		clubs:tEnvConfig_Club[]			// 俱乐部设置

		defaultGroup:tEnvConfig_Group,	// 默认匹配设置
		groups:tEnvConfig_Group[],		// 匹配设置
	}

	
	export type tEnvConfig_ItemBase = {
		enabled:boolean,
		allowNoStrategyRobot:boolean,		// 是否允许tRobotStrategy未设置clubIDs和groupIDs的机器人进入

		autoCharge:boolean,					// 是否自动充值
		charges:{
			itemID:string,
			minChargeValue:string,			// 最小充值
			maxChargeValue:string,			// 最大充值
	
			needChargeLeastValue:string,	// 触发充值额度
		}[],

		buyin:{
			minMultiRate:number,			// 最小买入倍数
			maxMultiRate:number,			// 最大买入倍数
			rateAcc:number,					// 倍数小数点
		}
	}
	export type tEnvConfig_Club = tEnvConfig_ItemBase & {
		clubID?:number,
	}
	export type tEnvConfig_Group = tEnvConfig_ItemBase & {
		groupID?:number,
	}

	export type tRobotStrategy = {
		planID:number,
		gameID:number,
		desc:string,
		robotUserIDs:number[],
		clubIDs?:number[],	// 只能进入的club
		groupIDs?:number[],	// 只能进入的group

		// 下列参数以StrategyTask为准
		personality:Personality,	// 个性
		strategy:RuntimeStrategy,
		strategyData:tStrategyData_Base	// 基于strategy生成对应的Data
	}

	export enum StrategyTaskStatus {
		Wait,		// 等待执行
		Running,	// 执行中
		Pause,		// 暂停执行
		End,		// 已结束
		Cancel,		// 已取消
	}
	export type tStrategyTask = {
		taskID:number,			// 任务流水号
		planID:number,			// 策略ID
		personality:Personality,	// 个性
		strategy:RuntimeStrategy,	// 策略
		strategyData:tStrategyData_Base	// 基于strategy生成对应的Data

		status:StrategyTaskStatus,	// 执行状态

		createGMID:number,			// 创建的GM ID
		createTimestamp:number,
		createDate:string,

		startTimestamp:number,		// 执行时间
		startDate:string,
		datas:any[],
	}

	// 任务变动记录
	export type tStrategyTaskRecord = {
		taskID:number,
		planID:number,
		key:string,
		fromValue:any,
		toValue:any,
		reason:string,
		data?:any,
		timestamp:number,
		date:string,
	}

	export type tRobotGameSerial = {
		no:number,
		userID:number,
		roomID:number,
		gameID:number,
		clubID:number,
		templateID:number,
		groupID:number,
		matchID:number,
		payType:RoomDefine.PayType,
		itemID:string,
		valueIndex:ClubDefine.ValueIndex,
		scoreChanged:string,
		numScoreChanged:number,

		timestamp:number,
		date:string,
	}

	export enum StoreValueEndType {
		Robot,
		GM,
	}
	// 机器人库存
	export type tStoreValue = {
		no:number,					// 流水号
		gmID:number,				// 创建GMID
		itemID:string,				// 
		value:string,				// 总量
		usedValue:string,			// 已使用
		ended:boolean,				// 是否已结束
		endType:StoreValueEndType,	// 结束类型
		endData:any,				// 数据标记
		timestamp:number,			// 创建时间
		date:string,
		endTimestamp:number,		// 结束时间
		endDate:string,
	}

	export type tUseStoreRecord = {
		no:number,					// 流水
		useNo:number,				// 库存流水
		robotUserID:number,
		itemID:string,
		value:string,
		reason?:string,
		data?:any,
		timestamp:number,
		date:string,
	}

	export const LoginTag = "Robot"
}