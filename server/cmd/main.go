// Package main 提供 Nakama 插件入口
//
// 本文件是 Nakama 游戏服务器的入口点，负责：
// - 加载配置
// - 初始化数据库连接
// - 初始化各个模块
package main

import (
	"context"
	"database/sql"

	"warforge-server/adapter"
	"warforge-server/config"
	"warforge-server/database"
	"warforge-server/modules/admin"
	"warforge-server/modules/bot"
	"warforge-server/modules/hiro"
	"warforge-server/nakama/hooks"
	"warforge-server/nakama/match"
	"warforge-server/nakama/rpc"

	"github.com/heroiclabs/nakama-common/runtime"
)

// InitModule 初始化 Nakama 模块
//
// 这是 Nakama 插件的入口函数，由 Nakama 运行时调用
func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("WarForge Game Server Module Loading...")

	// 加载配置文件
	if _, err := config.LoadConfig("./config/config.yaml"); err != nil {
		logger.Warn("Failed to load config file: %v, using defaults", err)
	}

	// 初始化数据库连接
	database.InitDB(db)

	// 初始化 Nakama RPC 模块
	if err := rpc.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Nakama RPC: %v", err)
		return err
	}

	// 初始化 Nakama Match 模块
	if err := match.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Nakama Match: %v", err)
		return err
	}

	// 初始化 Nakama Hooks 模块
	if err := hooks.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Nakama Hooks: %v", err)
		return err
	}

	// 初始化 Admin 模块（玩家管理 RPC）
	if err := admin.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Admin: %v", err)
		return err
	}

	// 初始化 Adapter 模块
	if err := adapter.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Adapter: %v", err)
		return err
	}

	// 初始化 Bot 模块
	if err := bot.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Bot: %v", err)
		return err
	}

	// 初始化 Hiro 模块
	if err := hiro.Init(logger, initializer); err != nil {
		logger.Error("Failed to init Hiro: %v", err)
		return err
	}

	logger.Info("WarForge Game Server Module Loaded!")
	return nil
}
