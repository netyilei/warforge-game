package match

import (
	"context"
	"database/sql"
	"sync"

	"github.com/heroiclabs/nakama-common/runtime"
)

func RegisterMatchHandlers(initializer runtime.Initializer) error {
	if err := initializer.RegisterMatch("texas", newTexasMatch); err != nil {
		return err
	}
	return nil
}

type TexasMatchState struct {
	Presences map[string]runtime.Presence
	Players   []*TexasPlayer
	mu        sync.RWMutex
}

type TexasPlayer struct {
	UserID    string
	SessionID string
	SeatIndex int
	Chips     int64
	Folded    bool
	IsBot     bool
}

func newTexasMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
	return &TexasMatch{
		state: &TexasMatchState{
			Presences: make(map[string]runtime.Presence),
			Players:   make([]*TexasPlayer, 0),
		},
	}, nil
}

type TexasMatch struct {
	state *TexasMatchState
}

func (m *TexasMatch) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	logger.Info("Texas Match initialized")
	return m.state, 1, ""
}

func (m *TexasMatch) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	mState, _ := state.(*TexasMatchState)

	mState.mu.Lock()
	defer mState.mu.Unlock()

	mState.Presences[presence.GetUserId()] = presence

	player := &TexasPlayer{
		UserID:    presence.GetUserId(),
		SessionID: presence.GetSessionId(),
		SeatIndex: len(mState.Players),
		Chips:     10000,
		Folded:    false,
		IsBot:     false,
	}
	mState.Players = append(mState.Players, player)

	logger.Info("Player %s joined match", presence.GetUserId())
	return mState, true, ""
}

func (m *TexasMatch) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*TexasMatchState)

	mState.mu.Lock()
	defer mState.mu.Unlock()

	for _, presence := range presences {
		mState.Presences[presence.GetUserId()] = presence
		logger.Info("Player %s joined", presence.GetUserId())
	}

	return mState
}

func (m *TexasMatch) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*TexasMatchState)

	mState.mu.Lock()
	defer mState.mu.Unlock()

	for _, presence := range presences {
		delete(mState.Presences, presence.GetUserId())
		for i, player := range mState.Players {
			if player.UserID == presence.GetUserId() {
				mState.Players = append(mState.Players[:i], mState.Players[i+1:]...)
				break
			}
		}
		logger.Info("Player %s left", presence.GetUserId())
	}

	return mState
}

func (m *TexasMatch) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	mState, _ := state.(*TexasMatchState)

	mState.mu.RLock()
	defer mState.mu.RUnlock()

	for _, message := range messages {
		logger.Info("Received message from %s: %s", message.GetUserId(), string(message.GetData()))
	}

	return mState
}

func (m *TexasMatch) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	logger.Info("Match terminating in %d seconds", graceSeconds)
	return state
}

func (m *TexasMatch) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, "signal received: " + data
}
