

export namespace LeaderDefine {
	// 数值平衡
	// 这个结构用于记录用户某个道具的数值平衡情况
	// 在提现的时候会检查平衡值是否正确
	// 充值会增加数值，提现会减少数值
	// 返利会增加奖励数量，但不影响平衡值
	// 在界面显示时，多显示一列动态平衡，即exceptionValue + rewardValue
	// 当动态平衡小于0时，表示用户透支了，需要管理员介入处理
	export type tBalance = {
		userID:number,			// 用户ID
		itemID:string,			// 道具ID
		value:string,			// 动态数量
		exceptionValue:string,	// 平衡期望值 充值 提现 输 赢 其实就是水上水下
		rewardValue:string,		// 累计奖励数量

		totalCharge:string,		// 总充值
		totalWithdraw:string, 	// 总提现

		
		water:string,			// 累计抽水
		win:string,				// 累计赢取
		lose:string,			// 累计输掉
	}


}