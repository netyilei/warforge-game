package match

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

type MatchHandler struct {
	moduleName string
}

func NewMatchHandler(moduleName string) *MatchHandler {
	return &MatchHandler{moduleName: moduleName}
}

func (h *MatchHandler) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	state := map[string]interface{}{
		"presences": make(map[string]runtime.Presence),
		"game_id":   params["game_id"],
		"room_id":   params["room_id"],
	}

	stateJSON, _ := json.Marshal(state)
	return state, 0, string(stateJSON)
}

func (h *MatchHandler) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	return state, true, ""
}

func (h *MatchHandler) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	stateMap := state.(map[string]interface{})
	presencesMap := stateMap["presences"].(map[string]runtime.Presence)

	for _, p := range presences {
		presencesMap[p.GetUserId()] = p
	}

	stateMap["presences"] = presencesMap
	return stateMap
}

func (h *MatchHandler) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	stateMap := state.(map[string]interface{})
	presencesMap := stateMap["presences"].(map[string]runtime.Presence)

	for _, p := range presences {
		delete(presencesMap, p.GetUserId())
	}

	stateMap["presences"] = presencesMap

	if len(presencesMap) == 0 {
		return nil
	}

	return stateMap
}

func (h *MatchHandler) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	stateMap := state.(map[string]interface{})

	for _, msg := range messages {
		logger.Info("Received message from %s: %s", msg.GetUserId(), string(msg.GetData()))
	}

	return stateMap
}

func (h *MatchHandler) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	return state
}

func (h *MatchHandler) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, data
}

func newMatchHandler(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
	return &GenericMatch{
		handler: NewMatchHandler("generic"),
		state:   nil,
	}, nil
}

type GenericMatch struct {
	handler *MatchHandler
	state   interface{}
}

func (m *GenericMatch) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	return m.handler.MatchInit(ctx, logger, db, nk, params)
}

func (m *GenericMatch) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	return m.handler.MatchJoinAttempt(ctx, logger, db, nk, dispatcher, tick, state, presence, metadata)
}

func (m *GenericMatch) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	return m.handler.MatchJoin(ctx, logger, db, nk, dispatcher, tick, state, presences)
}

func (m *GenericMatch) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	return m.handler.MatchLeave(ctx, logger, db, nk, dispatcher, tick, state, presences)
}

func (m *GenericMatch) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	return m.handler.MatchLoop(ctx, logger, db, nk, dispatcher, tick, state, messages)
}

func (m *GenericMatch) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	return m.handler.MatchTerminate(ctx, logger, db, nk, dispatcher, tick, state, graceSeconds)
}

func (m *GenericMatch) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return m.handler.MatchSignal(ctx, logger, db, nk, dispatcher, tick, state, data)
}

func RegisterMatchHandler(initializer runtime.Initializer, moduleName string) error {
	return initializer.RegisterMatch(moduleName, newMatchHandler)
}
