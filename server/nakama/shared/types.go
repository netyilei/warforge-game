// Package shared 提供 Nakama 模块共享的类型定义
//
// 本文件定义游戏相关的数据结构，包括：
// - 游戏配置结构
// - 玩家状态结构
// - 房间状态结构
package shared

import "time"

// GameConfig 游戏配置
type GameConfig struct {
	MinPlayers    int           `json:"minPlayers"`    // 最少玩家数
	MaxPlayers    int           `json:"maxPlayers"`    // 最多玩家数
	TurnTimeout   time.Duration `json:"turnTimeout"`   // 回合超时时间
	InitialChips  int64         `json:"initialChips"`  // 初始筹码
	MinBet        int64         `json:"minBet"`        // 最小下注
}

// PlayerState 玩家状态
type PlayerState struct {
	UserID    string `json:"userId"`    // 用户ID
	SeatIndex int    `json:"seatIndex"` // 座位索引
	Chips     int64  `json:"chips"`     // 筹码数
	IsReady   bool   `json:"isReady"`   // 是否准备
	IsFolded  bool   `json:"isFolded"`  // 是否弃牌
}

// RoomState 房间状态
type RoomState struct {
	RoomID    string        `json:"roomId"`    // 房间ID
	GameType  string        `json:"gameType"`  // 游戏类型
	Players   []PlayerState `json:"players"`   // 玩家列表
	StartTime int64         `json:"startTime"` // 开始时间
}
