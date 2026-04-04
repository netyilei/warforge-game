// Package ws 提供 WebSocket 消息定义
//
// 本文件定义 WebSocket 操作码常量
package ws

const (
	OpCodeGameStart   = 1001 // 游戏开始
	OpCodeGameEnd     = 1002 // 游戏结束
	OpCodePlayerJoin  = 1003 // 玩家加入
	OpCodePlayerLeave = 1004 // 玩家离开
	OpCodeBet         = 1005 // 下注
	OpCodeDeal        = 1006 // 发牌
	OpCodeChat        = 1007 // 聊天
	OpCodeReady       = 1008 // 准备
)
