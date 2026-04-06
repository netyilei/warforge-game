package rpc

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

func RegisterHealthRPC(initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("health", healthCheck); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("user_info", userInfo); err != nil {
		return err
	}

	return nil
}

func healthCheck(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"status":"ok","service":"warforge-nakama"}`, nil
}

func userInfo(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"code":0,"data":{"user_id":1,"nickname":"test"}}`, nil
}
