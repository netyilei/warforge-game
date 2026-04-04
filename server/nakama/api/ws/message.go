// Package ws 提供 WebSocket 消息定义
//
// 本文件定义 WebSocket 消息结构和操作码常量，包括：
// - 消息基础结构
// - 游戏相关消息
// - 下注消息
package ws

// WSMessage WebSocket 消息基础结构
type WSMessage struct {
	OpCode int         `json:"opCode"` // 操作码
	Data   interface{} `json:"data"`   // 消息数据
	Time   int64       `json:"time"`   // 时间戳
}

// GameStartData 游戏开始消息数据
type GameStartData struct {
	RoomID   string `json:"roomId"`   // 房间ID
	GameType string `json:"gameType"` // 游戏类型
}

// PlayerJoinData 玩家加入消息数据
type PlayerJoinData struct {
	UserID    string `json:"userId"`    // 用户ID
	SeatIndex int    `json:"seatIndex"` // 座位索引
}

// BetData 下注消息数据
type BetData struct {
	UserID string `json:"userId"` // 用户ID
	Amount int64  `json:"amount"` // 下注金额
}
