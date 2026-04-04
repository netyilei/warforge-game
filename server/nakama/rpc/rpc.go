// Package rpc 提供 Nakama RPC 接口实现
//
// 本文件实现游戏核心 RPC 接口，包括：
// - 健康检查接口
// - 用户信息查询接口
package rpc

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

// Init 初始化 RPC 模块
//
// 注册所有 RPC 接口到 Nakama 运行时
func Init(logger runtime.Logger, initializer runtime.Initializer) error {
	logger.Info("Nakama RPC Module Loading...")

	// 注册健康检查接口
	if err := initializer.RegisterRpc("health", healthCheck); err != nil {
		return err
	}

	// 注册用户信息查询接口
	if err := initializer.RegisterRpc("user_info", userInfo); err != nil {
		return err
	}

	logger.Info("Nakama RPC Module Loaded!")
	return nil
}

// healthCheck 健康检查接口
//
// 返回服务状态信息，用于监控和负载均衡检测
func healthCheck(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"status":"ok","service":"warforge-nakama"}`, nil
}

// userInfo 用户信息查询接口
//
// 返回指定用户的基本信息
func userInfo(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	return `{"code":0,"data":{"user_id":1,"nickname":"test"}}`, nil
}
