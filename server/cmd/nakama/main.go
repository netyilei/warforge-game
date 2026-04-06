package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"

	"warforge-server/internal/infrastructure/nakama"
	"warforge-server/internal/interfaces/nakama/match"
	nakamaRPC "warforge-server/internal/interfaces/nakama/rpc"
)

func main() {}

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Initializing WarForge Nakama module")

	nakamaAdapter := nakama.NewNakamaAdapter(nk)

	_ = nakamaAdapter

	if err := nakamaRPC.RegisterHealthRPC(initializer); err != nil {
		logger.Error("Failed to register health RPC: %v", err)
		return err
	}

	if err := nakamaRPC.RegisterAdminRPC(initializer); err != nil {
		logger.Error("Failed to register admin RPC: %v", err)
		return err
	}

	if err := nakamaRPC.RegisterAuthEmailRPC(initializer); err != nil {
		logger.Error("Failed to register auth email RPC: %v", err)
		return err
	}

	if err := nakamaRPC.RegisterEmailRPC(initializer); err != nil {
		logger.Error("Failed to register email RPC: %v", err)
		return err
	}

	if err := match.RegisterMatchHandler(initializer, "warforge_match"); err != nil {
		logger.Error("Failed to register match handler: %v", err)
		return err
	}

	logger.Info("WarForge Nakama module initialized successfully")
	return nil
}
