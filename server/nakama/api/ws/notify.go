// Package ws 提供 WebSocket 消息定义
//
// 本文件定义通知消息结构，包括：
// - 通知消息结构
// - 游戏通知数据
package ws

// NotifyMessage 通知消息结构
type NotifyMessage struct {
	Type    string `json:"type"`    // 通知类型
	Title   string `json:"title"`   // 通知标题
	Content string `json:"content"` // 通知内容
	Time    int64  `json:"time"`    // 时间戳
}

// NotifyGameData 游戏通知数据
type NotifyGameData struct {
	GameType string `json:"gameType"` // 游戏类型
	RoomID   string `json:"roomId"`   // 房间ID
	Action   string `json:"action"`   // 动作类型
}
