package rpc

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("RPC Module Loading...")

	if err := initializer.RegisterRpc("health", healthCheck); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("user_info", userInfo); err != nil {
		return err
	}

	logger.Info("RPC Module Loaded!")
	return nil
}

func healthCheck(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"status":"ok","service":"warforge-game-server"}`, nil
}

func userInfo(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"code":0,"data":{"user_id":1,"nickname":"test"}}`, nil
}
