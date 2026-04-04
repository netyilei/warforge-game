// Package shared 提供 Nakama 模块共享的常量定义
//
// 本文件定义游戏类型和操作码常量，包括：
// - 游戏类型常量
// - WebSocket 操作码常量
package shared

const (
	GameTypeTexas    = "texas"    // 德州扑克
	GameTypeNiuniu   = "niuniu"   // 牛牛
	GameTypeDoudizhu = "doudizhu" // 斗地主
	GameTypeMajiang  = "majiang"  // 麻将
)

const (
	OpCodeGameStart   = 1001 // 游戏开始
	OpCodeGameEnd     = 1002 // 游戏结束
	OpCodePlayerJoin  = 1003 // 玩家加入
	OpCodePlayerLeave = 1004 // 玩家离开
	OpCodeBet         = 1005 // 下注
	OpCodeDeal        = 1006 // 发牌
)
