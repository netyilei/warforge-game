package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"

	"warforge-server/config"
	"warforge-server/database"
	"warforge-server/internal/infrastructure/nakama"
	"warforge-server/internal/interfaces/nakama/match"
	nakamaRPC "warforge-server/internal/interfaces/nakama/rpc"
	"warforge-server/migrations"
	_ "warforge-server/migrations/modules"
	"warforge-server/pkg/email"
)

var emailWorker *email.EmailWorker

func main() {}

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Initializing WarForge Nakama module")

	database.InitDB(db)

	cfg, err := config.LoadConfig("")
	if err != nil {
		logger.Warn("Failed to load config file, using defaults: %v", err)
	} else {
		if err := database.InitRedis(cfg.Redis.Host, cfg.Redis.Port, cfg.Redis.Password, cfg.Redis.DB); err != nil {
			logger.Warn("Failed to initialize Redis: %v", err)
		} else {
			logger.Info("Redis initialized successfully")
		}

		migrations.InitGlobalManager(db, &cfg.Migration)
		if err := migrations.RunGlobal(); err != nil {
			logger.Error("Failed to run migrations: %v", err)
			return err
		}
		logger.Info("Database migrations completed")
	}

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

	redisClient := database.GetRedis()
	if redisClient != nil {
		emailWorker = email.InitEmailWorker(redisClient, 2)
		logger.Info("Email worker started")
	} else {
		logger.Warn("Redis not available, email worker not started")
	}

	logger.Info("WarForge Nakama module initialized successfully")
	return nil
}
