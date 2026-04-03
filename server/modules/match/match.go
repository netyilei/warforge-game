package match

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Match Module Loading...")

	if err := initializer.RegisterMatch("texas", newTexasMatch); err != nil {
		return err
	}

	logger.Info("Match Module Loaded!")
	return nil
}

func newTexasMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
	return &TexasMatch{}, nil
}

type TexasMatch struct{}

type TexasMatchState struct {
	presences map[string]runtime.Presence
}

func (m *TexasMatch) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	logger.Info("Texas Match Init")

	state := &TexasMatchState{
		presences: make(map[string]runtime.Presence),
	}

	tickRate := 10
	label := "{\"game_type\":\"texas\"}"

	return state, tickRate, label
}

func (m *TexasMatch) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	return state, true, ""
}

func (m *TexasMatch) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*TexasMatchState)

	for _, p := range presences {
		mState.presences[p.GetUserId()] = p
	}

	return mState
}

func (m *TexasMatch) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*TexasMatchState)

	for _, p := range presences {
		delete(mState.presences, p.GetUserId())
	}

	return mState
}

func (m *TexasMatch) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	mState, _ := state.(*TexasMatchState)

	for _, message := range messages {
		logger.Info("Received message from %s: %s", message.GetUserId(), string(message.GetData()))
	}

	return mState
}

func (m *TexasMatch) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	logger.Info("Texas Match Terminate, grace seconds: %d", graceSeconds)
	return state
}

func (m *TexasMatch) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, "signal received: " + data
}
