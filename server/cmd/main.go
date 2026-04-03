package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
	"warforge-server/adapter"
	"warforge-server/database"
	"warforge-server/modules/admin"
	"warforge-server/modules/bot"
	"warforge-server/modules/hooks"
	"warforge-server/modules/match"
	"warforge-server/modules/rpc"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("WarForge Game Server Module Loading...")

	if err := database.InitGORM(db); err != nil {
		logger.Error("Failed to init GORM: %v", err)
		return err
	}

	if err := rpc.Init(logger, initializer); err != nil {
		logger.Error("Failed to init RPC: %v", err)
		return err
	}

	if err := match.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Match: %v", err)
		return err
	}

	if err := hooks.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Hooks: %v", err)
		return err
	}

	if err := adapter.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Adapter: %v", err)
		return err
	}

	if err := bot.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Bot: %v", err)
		return err
	}

	if err := admin.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Admin: %v", err)
		return err
	}

	logger.Info("WarForge Game Server Module Loaded!")
	return nil
}
