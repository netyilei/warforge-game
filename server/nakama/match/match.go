// Package match 提供 Nakama 权威匹配器实现
//
// 本文件实现游戏房间匹配逻辑，包括：
// - 德州扑克匹配器
// - 房间状态管理
// - 玩家加入/离开处理
package match

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

// Init 初始化匹配模块
//
// 注册所有权威匹配器到 Nakama 运行时
func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Nakama Match Module Loading...")

	// 注册德州扑克匹配器
	if err := initializer.RegisterMatch("texas", newTexasMatch); err != nil {
		return err
	}

	logger.Info("Nakama Match Module Loaded!")
	return nil
}

// newTexasMatch 创建德州扑克匹配器实例
//
// 返回一个新的德州扑克匹配器
func newTexasMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
	return &TexasMatch{}, nil
}

// TexasMatch 德州扑克匹配器
type TexasMatch struct{}

// TexasMatchState 德州扑克房间状态
type TexasMatchState struct {
	presences map[string]runtime.Presence // 在线玩家列表
}

// MatchInit 初始化匹配房间
//
// 创建房间初始状态，设置帧率和标签
func (m *TexasMatch) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	logger.Info("Texas Match Init")

	// 初始化房间状态
	state := &TexasMatchState{
		presences: make(map[string]runtime.Presence),
	}

	tickRate := 10 // 每秒10帧
	label := "{\"game_type\":\"texas\"}"

	return state, tickRate, label
}

// MatchJoinAttempt 处理玩家加入请求
//
// 验证玩家是否允许加入房间
func (m *TexasMatch) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	return state, true, ""
}

// MatchJoin 处理玩家加入房间
//
// 将玩家添加到房间状态中
func (m *TexasMatch) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*TexasMatchState)

	// 将所有新玩家添加到房间
	for _, p := range presences {
		mState.presences[p.GetUserId()] = p
	}

	return mState
}

// MatchLeave 处理玩家离开房间
//
// 从房间状态中移除玩家
func (m *TexasMatch) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*TexasMatchState)

	// 从房间中移除所有离开的玩家
	for _, p := range presences {
		delete(mState.presences, p.GetUserId())
	}

	return mState
}

// MatchLoop 游戏主循环
//
// 每帧执行的游戏逻辑
func (m *TexasMatch) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	mState, _ := state.(*TexasMatchState)

	// 处理玩家消息
	for _, message := range messages {
		logger.Info("Received message from %s: %s", message.GetUserId(), string(message.GetData()))
	}

	return mState
}

// MatchTerminate 处理房间终止
//
// 房间即将关闭时的清理逻辑
func (m *TexasMatch) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	logger.Info("Texas Match Terminate, grace seconds: %d", graceSeconds)
	return state
}

// MatchSignal 处理房间信号
//
// 接收外部信号并处理
func (m *TexasMatch) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, "signal received: " + data
}
