import { UserDefine } from "./UserDefine"

export namespace RewardDefine {
	
	// 触发club奖励的类型
	export enum GameActionType {
		Round		= 0x0001,	// 每局
		Water		= 0x0002,	// 抽水
		Lose		= 0x0004,	// 输了也返利
		DeskCost	= 0x0008,	// 使用自定义桌费设置
	}

	// 全局返利配置
	export type tCharge = {
		loginRegisters:{
			itemID:string,			
			count:string,	// 登录注册奖励数量
		}[],
		// 充值
		charges:{
			itemID:string,			
			minChargeValue:string,	// 触发返利的最小充值金额
			maxChargeValue:string,	// 触发返利的最大充值金额，0表示不限制
			chargeLeaderPercent:number, // 上级返利百分比
		}[],
	}

	export enum GameWaterType {
		None		= 0x00,
		Ju			= 0x01,
		Round		= 0x02,
	}

	export enum GameWaterTarget {
		Everyone 	= 0x0100,
		Winner		= 0x0200,
	}

	export type tFriendWater = {
		items:{
			itemID:string,			// 道具ID
			type:GameWaterType,		// 抽水类型
			target:GameWaterTarget, // 抽水目标
			percent:number,			// 抽水百分比
			minValue:string,		// 最小抽水值 比如赢100分，抽水5%，则抽水5分，如果最小抽水值是10，则抽水10分
			maxValue:string,		// 最大抽水值
		}[]
	}

	// 匹配抽水
	export type tGroupWater = {
		groupID:number,
		type:GameWaterType,
		target:GameWaterTarget,
		percent:number,
		minValue:string,
		maxValue:string,
	}

	// 比赛默认抽水
	export type tMatchWater = {
		type:GameWaterType,
		target:GameWaterTarget,
		percent:number,
		minValue:string,
		maxValue:string,
	}

	export type tChargeLeaderRecord = {
		no:number,
		userID:number,
		leaderUserID:number,
		itemID:string,
		value:string,
		percent:number,
		rewardValue:string,

		timestamp:number,
		date:string,
	}

	// 返利计划
	export type tPlan = {
		planID:number,
		name:string,
		desc?:string,
		// 充值返利
		charge:{
			enabled:boolean,	
			inviteItemID:string,	// 邀请人返利itemID
			invitePercent:number,	// 返利百分比

			minValue:number,		// 返利的最小充值
			maxValue:number,		// 返利的最大充值
		},


		// 俱乐部游戏奖励
		club:{
			enabled:boolean, 			// // 是否开启
			gameActionType:number,		// tRewardGameActionType的按位或集合

			// 按局返利 使用 GameSet.getDeskCost 计算
			actionRound:{
				inviteItemID:string,		// 邀请人返利itemID
				invitePercent:number,		// 返利百分比
				// 上级返利
				leaderItemID:string,		// 上级返利itemID
				leaderPercents:{
					leaderLayer:number,		// 层级，直接上级为一层，上级的上级为两层
					percent:number,
				}[]
				leaderPercentMax:number,	// 上级返利最大百分比
			},
			// 抽水
			actionWater:{
				// 默认
				defaultWaterPercent:number,	// 默认抽水百分比
				// 针对游戏
				gameWaterPercent:{
					gameID:number,
					percent:number,
				}[],

				inviteItemID:string,		// 邀请人返利itemID
				invitePercent:number,		// 返利百分比
				// 上级返利
				leaderItemID:string,		// 上级返利itemID
				leaderPercents:{
					leaderLayer:number,		// 层级，直接上级为一层，上级的上级为两层
					percent:number,
				}[]
				leaderPercentMax:number,	// 上级返利最大百分比
			},
			// 输返利
			actionLose:{
				// 默认
				defaultDefine:{
					// 输的分数取绝对值，乘以percent得到输分奖励
					percent:number,			// 返利百分比
					// 生成的最大返利额度
					maxValue:number,		// 最大返利额度
				},
				// 针对游戏
				gameDefines:{
					gameID:number,
					// 输的分数取绝对值，乘以percent得到输分奖励
					percent:number,			// 返利百分比
					// 生成的最大返利额度
					maxValue:number,		// 最大返利额度
				}[],

				selfItemID:string,		// 返给自己itemID
				selfPercent:number,		// 百分比

				inviteItemID:string,	// 邀请人返利itemID
				invitePercent:number,	// 百分比
				// 上级返利
				leaderItemID:string,	// 上级返利itemID
				leaderPercents:{
					leaderLayer:number,		// 层级，直接上级为一层，上级的上级为两层
					percent:number,
				}[]
				leaderPercentMax:number,	// 上级返利最大百分比
			}
		},

	}

	export enum PotTargetType {
		All,	// 全部用户
		User,  	// 指定用户
	}

	export enum PotSceneType {
		Global,	// 全局
		Room,	// 房间
		Custom,	// 好友房
		Group,	// 匹配
		Match,	// 比赛
	}

	export enum OBPercentType {
		ExceptionCharge,	// 平衡期望/充值
		ExceptionWithdraw,	// 平衡期望/提现
		ExceptionWin,		// 平衡期望/赢
		ExceptionLose,		// 平衡期望/输
	}

	// 用户奖池
	// 注意这个类型是联合了tPotExtConfig
	export type tPot = {
		potID:number,
		userID?:number,
		roomID?:number,
		groupID?:number,
		matchID?:number,
		enabled:boolean,			// 是否启用
		targetType:PotTargetType,	// 目标类型
		sceneType:PotSceneType,		// 场景类型
		globalMatch:boolean,	// 如果scene是global，是否会影响比赛
	} & tPotExtConfig

	export type tPotExtConfig = {
		itemID:string,			// 道具ID
		countControl:boolean,	// 是否控制数量
		totalCount:string,		// 执行数量
		currentCount:string,	// 当前数量
		enabled:boolean,		// 是否启用

		pri:number,				// 优先级，数值越大优先级越高

		rates:{
			percent:number,	// 权重触发几率
			minValueCardPower:number,	// 最小牌权重
			min2ValueCardPower:number,	// 次小牌权重
			normalValueCardPower:number,// 普通牌权重
			maxValueCardPower:number,	// 最大牌权重
		}

		observeEnabled:boolean,		// 是否启用观测	如果启动观测，会先检查观测条件是否满足，满足则正常触发奖池
		observeType:OBPercentType,	// 观测类型
		observePercent:number,		// 观测百分比
	}
}