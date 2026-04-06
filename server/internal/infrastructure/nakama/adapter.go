package nakama

import (
	"context"
	"fmt"

	"github.com/heroiclabs/nakama-common/api"
	"github.com/heroiclabs/nakama-common/runtime"
)

type NakamaAdapter struct {
	nk runtime.NakamaModule
}

func NewNakamaAdapter(nk runtime.NakamaModule) *NakamaAdapter {
	return &NakamaAdapter{nk: nk}
}

func (a *NakamaAdapter) Nakama() runtime.NakamaModule {
	return a.nk
}

func (a *NakamaAdapter) StorageRead(ctx context.Context, collection, key, userID string) ([]byte, error) {
	objects, err := a.nk.StorageRead(ctx, []*runtime.StorageRead{
		{
			Collection: collection,
			Key:        key,
			UserID:     userID,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("storage read error: %w", err)
	}
	if len(objects) == 0 {
		return nil, nil
	}
	return []byte(objects[0].Value), nil
}

func (a *NakamaAdapter) StorageWrite(ctx context.Context, collection, key, userID, permission string, value []byte) error {
	_, err := a.nk.StorageWrite(ctx, []*runtime.StorageWrite{
		{
			Collection:      collection,
			Key:             key,
			UserID:          userID,
			Value:           string(value),
			PermissionRead:  1,
			PermissionWrite: 1,
		},
	})
	if err != nil {
		return fmt.Errorf("storage write error: %w", err)
	}
	return nil
}

func (a *NakamaAdapter) StorageDelete(ctx context.Context, collection, key, userID string) error {
	err := a.nk.StorageDelete(ctx, []*runtime.StorageDelete{
		{
			Collection: collection,
			Key:        key,
			UserID:     userID,
		},
	})
	if err != nil {
		return fmt.Errorf("storage delete error: %w", err)
	}
	return nil
}

func (a *NakamaAdapter) StorageList(ctx context.Context, collection, userID string, limit int) ([]*api.StorageObject, error) {
	cursor := ""
	objects, _, err := a.nk.StorageList(ctx, "", userID, collection, limit, cursor)
	if err != nil {
		return nil, fmt.Errorf("storage list error: %w", err)
	}
	return objects, nil
}

func (a *NakamaAdapter) LeaderboardWrite(ctx context.Context, leaderboardID, ownerID string, score int64) error {
	_, err := a.nk.LeaderboardRecordWrite(ctx, leaderboardID, ownerID, "", score, 0, nil, nil)
	if err != nil {
		return fmt.Errorf("leaderboard write error: %w", err)
	}
	return nil
}

func (a *NakamaAdapter) LeaderboardList(ctx context.Context, leaderboardID string, limit int) ([]*api.LeaderboardRecord, error) {
	records, _, _, _, err := a.nk.LeaderboardRecordsList(ctx, leaderboardID, nil, limit, "", 0)
	if err != nil {
		return nil, fmt.Errorf("leaderboard list error: %w", err)
	}
	return records, nil
}

func (a *NakamaAdapter) MatchCreate(ctx context.Context, module string, params map[string]interface{}) (string, error) {
	matchID, err := a.nk.MatchCreate(ctx, module, params)
	if err != nil {
		return "", fmt.Errorf("match create error: %w", err)
	}
	return matchID, nil
}

func (a *NakamaAdapter) MatchGet(ctx context.Context, matchID string) (*api.Match, error) {
	match, err := a.nk.MatchGet(ctx, matchID)
	if err != nil {
		return nil, fmt.Errorf("match get error: %w", err)
	}
	return match, nil
}

func (a *NakamaAdapter) MatchSignal(ctx context.Context, matchID string, data string) (string, error) {
	response, err := a.nk.MatchSignal(ctx, matchID, data)
	if err != nil {
		return "", fmt.Errorf("match signal error: %w", err)
	}
	return response, nil
}
